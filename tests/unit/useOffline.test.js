/**
 * Unit tests for src/lib/useOffline.js
 * - useOnlineStatus hook
 * - replayOutbox function
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import 'fake-indexeddb/auto'
import { useOnlineStatus, replayOutbox } from '../../src/lib/useOffline'
import { outboxPush, outboxCount, idbPut, idbDelete } from '../../src/lib/offlineStore'

// Bootstrap the DB so stores exist
beforeAll(async () => {
  await idbPut('trips', { id: '__bootstrap__' })
  await idbDelete('trips', '__bootstrap__')
})

async function clearStores() {
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open('tmb-offline', 1)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  const storeNames = [...db.objectStoreNames]
  if (storeNames.length > 0) {
    const tx = db.transaction(storeNames, 'readwrite')
    for (const name of storeNames) {
      tx.objectStore(name).clear()
    }
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
  }
  db.close()
}

beforeEach(async () => {
  await clearStores()
})

describe('useOnlineStatus', () => {
  it('returns true when navigator.onLine is true', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)
  })

  it('responds to offline event', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
    const { result } = renderHook(() => useOnlineStatus())

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(false)
  })

  it('responds to online event', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true })
    const { result } = renderHook(() => useOnlineStatus())

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current).toBe(true)
  })

  it('cleans up event listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useOnlineStatus())
    unmount()

    const calls = removeSpy.mock.calls.map(c => c[0])
    expect(calls).toContain('online')
    expect(calls).toContain('offline')
    removeSpy.mockRestore()
  })
})

describe('replayOutbox', () => {
  function mockClient() {
    const insertFn = vi.fn().mockResolvedValue({ error: null })
    const updateEqFn = vi.fn().mockResolvedValue({ error: null })
    const deleteEqFn = vi.fn().mockResolvedValue({ error: null })
    const upsertFn = vi.fn().mockResolvedValue({ error: null })

    return {
      from: vi.fn().mockReturnValue({
        insert: insertFn,
        update: vi.fn().mockReturnValue({ eq: updateEqFn }),
        delete: vi.fn().mockReturnValue({ eq: deleteEqFn }),
        upsert: upsertFn,
      }),
      _insert: insertFn,
      _upsert: upsertFn,
    }
  }

  it('returns { replayed: 0, failed: false } with no client', async () => {
    const result = await replayOutbox(null)
    expect(result).toEqual({ replayed: 0, failed: false })
  })

  it('returns { replayed: 0, failed: false } with empty outbox', async () => {
    const client = mockClient()
    const result = await replayOutbox(client)
    expect(result).toEqual({ replayed: 0, failed: false })
    expect(client.from).not.toHaveBeenCalled()
  })

  it('replays insert entries', async () => {
    await outboxPush({ table: 'transport_legs', action: 'insert', payload: { name: 'Bus', trip_id: 'trip-1' } })

    const client = mockClient()
    const result = await replayOutbox(client)

    expect(result).toEqual({ replayed: 1, failed: false })
    expect(client.from).toHaveBeenCalledWith('transport_legs')
    expect(client._insert).toHaveBeenCalledWith({ name: 'Bus', trip_id: 'trip-1' })
    expect(await outboxCount()).toBe(0)
  })

  it('replays update entries', async () => {
    await outboxPush({ table: 'gear_items', action: 'update', id: 'g1', payload: { packed: true } })

    const client = mockClient()
    const result = await replayOutbox(client)

    expect(result).toEqual({ replayed: 1, failed: false })
    expect(client.from).toHaveBeenCalledWith('gear_items')
  })

  it('replays delete entries', async () => {
    await outboxPush({ table: 'safety_contacts', action: 'delete', id: 's1' })

    const client = mockClient()
    const result = await replayOutbox(client)

    expect(result).toEqual({ replayed: 1, failed: false })
    expect(client.from).toHaveBeenCalledWith('safety_contacts')
  })

  it('replays upsert entries', async () => {
    await outboxPush({ table: 'trips', action: 'upsert', payload: { id: 't1', name: 'Updated' } })

    const client = mockClient()
    const result = await replayOutbox(client)

    expect(result).toEqual({ replayed: 1, failed: false })
    expect(client._upsert).toHaveBeenCalledWith({ id: 't1', name: 'Updated' })
  })

  it('replays multiple entries in FIFO order', async () => {
    await outboxPush({ table: 'gear_items', action: 'update', id: 'g1', payload: { packed: true } })
    await outboxPush({ table: 'transport_legs', action: 'insert', payload: { name: 'Taxi' } })
    await outboxPush({ table: 'safety_contacts', action: 'delete', id: 's1' })

    const client = mockClient()
    const result = await replayOutbox(client)

    expect(result).toEqual({ replayed: 3, failed: false })

    const tables = client.from.mock.calls.map(c => c[0])
    expect(tables).toEqual(['gear_items', 'transport_legs', 'safety_contacts'])
    expect(await outboxCount()).toBe(0)
  })

  it('stops on first failure and preserves remaining entries', async () => {
    await outboxPush({ table: 'gear_items', action: 'update', id: 'g1', payload: { packed: true } })
    await outboxPush({ table: 'transport_legs', action: 'insert', payload: { name: 'Bus' } })
    await outboxPush({ table: 'safety_contacts', action: 'delete', id: 's1' })

    let callCount = 0
    const client = {
      from: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 2) {
          return {
            insert: vi.fn().mockResolvedValue({ error: { message: 'RLS violation' } }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }) }),
            delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          }
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        }
      }),
    }

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await replayOutbox(client)
    warnSpy.mockRestore()

    expect(result.replayed).toBe(1)
    expect(result.failed).toBe(true)
    expect(await outboxCount()).toBe(2)
  })
})
