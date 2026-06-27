/**
 * Unit tests for src/lib/offlineStore.js
 *
 * Uses fake-indexeddb to provide a real IndexedDB in Node/jsdom.
 * We bootstrap the DB via a dummy write (so the upgrade handler fires),
 * then clear stores between tests using the raw IDB API.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import {
  idbPut, idbPutAll, idbGetAll, idbDelete,
  outboxPush, outboxDrain, outboxRemove, outboxCount,
} from '../../src/lib/offlineStore'

// Ensure the DB + stores exist before any test runs
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

describe('offlineStore — IDB mirror', () => {
  it('idbPut + idbGetAll round-trips a record', async () => {
    const record = { id: 'g1', trip_id: 'trip-1', name: 'Hiking boots', packed: false }
    await idbPut('gear_items', record)
    const results = await idbGetAll('gear_items', 'trip-1')
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual(record)
  })

  it('idbPutAll writes multiple records in one transaction', async () => {
    const records = [
      { id: 'g1', trip_id: 'trip-1', name: 'Boots', packed: false },
      { id: 'g2', trip_id: 'trip-1', name: 'Jacket', packed: true },
      { id: 'g3', trip_id: 'trip-1', name: 'Hat', packed: false },
    ]
    await idbPutAll('gear_items', records)
    const results = await idbGetAll('gear_items', 'trip-1')
    expect(results).toHaveLength(3)
  })

  it('idbGetAll filters by trip_id', async () => {
    await idbPut('gear_items', { id: 'g1', trip_id: 'trip-1', name: 'A' })
    await idbPut('gear_items', { id: 'g2', trip_id: 'trip-2', name: 'B' })

    const trip1 = await idbGetAll('gear_items', 'trip-1')
    expect(trip1).toHaveLength(1)
    expect(trip1[0].name).toBe('A')

    const trip2 = await idbGetAll('gear_items', 'trip-2')
    expect(trip2).toHaveLength(1)
    expect(trip2[0].name).toBe('B')
  })

  it('idbPut overwrites existing record with same id', async () => {
    await idbPut('gear_items', { id: 'g1', trip_id: 'trip-1', name: 'Old', packed: false })
    await idbPut('gear_items', { id: 'g1', trip_id: 'trip-1', name: 'New', packed: true })

    const results = await idbGetAll('gear_items', 'trip-1')
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('New')
    expect(results[0].packed).toBe(true)
  })

  it('idbDelete removes a record', async () => {
    await idbPut('gear_items', { id: 'g1', trip_id: 'trip-1', name: 'Boots' })
    await idbDelete('gear_items', 'g1')

    const results = await idbGetAll('gear_items', 'trip-1')
    expect(results).toHaveLength(0)
  })

  it('idbGetAll for trips store uses id filter not trip_id index', async () => {
    await idbPut('trips', { id: 'trip-1', name: 'TMB' })
    await idbPut('trips', { id: 'trip-2', name: 'Other' })

    const filtered = await idbGetAll('trips', 'trip-1')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('TMB')

    const all = await idbGetAll('trips', undefined)
    expect(all).toHaveLength(2)
  })

  it('works across all store types', async () => {
    const stores = ['gear_items', 'bookings', 'transport_legs', 'safety_contacts']
    for (const store of stores) {
      await idbPut(store, { id: `${store}-1`, trip_id: 'trip-1', data: store })
      const results = await idbGetAll(store, 'trip-1')
      expect(results).toHaveLength(1)
      expect(results[0].data).toBe(store)
    }
  })
})

describe('offlineStore — outbox queue', () => {
  it('outboxPush + outboxDrain enqueues and retrieves entries', async () => {
    await outboxPush({ table: 'gear_items', action: 'update', id: 'g1', payload: { packed: true } })
    await outboxPush({ table: 'transport_legs', action: 'insert', payload: { name: 'Bus' } })

    const entries = await outboxDrain()
    expect(entries).toHaveLength(2)
    expect(entries[0].table).toBe('gear_items')
    expect(entries[0].action).toBe('update')
    expect(entries[0].payload).toEqual({ packed: true })
    expect(entries[1].table).toBe('transport_legs')
    expect(entries[1].action).toBe('insert')
  })

  it('outboxPush adds created_at timestamp', async () => {
    const before = Date.now()
    await outboxPush({ table: 'gear_items', action: 'update', id: 'g1', payload: {} })
    const after = Date.now()

    const entries = await outboxDrain()
    expect(entries[0].created_at).toBeGreaterThanOrEqual(before)
    expect(entries[0].created_at).toBeLessThanOrEqual(after)
  })

  it('outboxRemove deletes a specific entry', async () => {
    await outboxPush({ table: 'a', action: 'update', id: '1', payload: {} })
    await outboxPush({ table: 'b', action: 'delete', id: '2' })

    const entries = await outboxDrain()
    expect(entries).toHaveLength(2)

    await outboxRemove(entries[0].queueId)

    const remaining = await outboxDrain()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].table).toBe('b')
  })

  it('outboxCount returns the number of pending entries', async () => {
    expect(await outboxCount()).toBe(0)

    await outboxPush({ table: 'a', action: 'update', id: '1', payload: {} })
    expect(await outboxCount()).toBe(1)

    await outboxPush({ table: 'b', action: 'insert', payload: {} })
    expect(await outboxCount()).toBe(2)

    const entries = await outboxDrain()
    await outboxRemove(entries[0].queueId)
    expect(await outboxCount()).toBe(1)
  })

  it('entries have auto-incrementing queueId for FIFO ordering', async () => {
    await outboxPush({ table: 'a', action: 'update', id: '1', payload: {} })
    await outboxPush({ table: 'b', action: 'update', id: '2', payload: {} })
    await outboxPush({ table: 'c', action: 'update', id: '3', payload: {} })

    const entries = await outboxDrain()
    expect(entries[0].queueId).toBeLessThan(entries[1].queueId)
    expect(entries[1].queueId).toBeLessThan(entries[2].queueId)
  })
})
