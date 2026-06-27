import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGearItems } from '../../src/lib/useGearItems'
import { useTransportLegs } from '../../src/lib/useTransportLegs'
import { useSafetyContacts } from '../../src/lib/useSafetyContacts'
import { seedGear, seedTransport, seedSafety, resetStores } from '../msw/handlers'

const TRIP_ID = 'test-trip-001'
const FAKE_JWT = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0cmlwX2lkIjoidGVzdC10cmlwLTAwMSJ9.fake'

// The hooks call createClient which needs env vars
// MSW intercepts the actual HTTP calls, so we just need valid-looking URLs
import.meta.env.VITE_SUPABASE_URL = 'http://localhost:54321'
import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'

beforeEach(() => {
  resetStores()
})

// ---------- useGearItems ----------
describe('useGearItems', () => {
  const SAMPLE_GEAR = [
    { id: 'g1', trip_id: TRIP_ID, name: 'Hiking boots', category: 'Footwear', qty: 1, priority: 'Essential', status: 'Bought', packed: false, cost: null, sort: 0 },
    { id: 'g2', trip_id: TRIP_ID, name: 'Rain jacket', category: 'Shell & Rain', qty: 1, priority: 'Essential', status: 'Bought', packed: true, cost: 120, sort: 1 },
    { id: 'g3', trip_id: TRIP_ID, name: 'Sunscreen', category: 'Headwear & Sun', qty: 1, priority: 'Essential', status: 'Need to Buy', packed: false, cost: null, sort: 2 },
  ]

  it('returns empty items when no tripId provided', () => {
    const { result } = renderHook(() => useGearItems(null, null))
    expect(result.current.items).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('loads gear items from Supabase', async () => {
    seedGear(SAMPLE_GEAR)
    const { result } = renderHook(() => useGearItems(TRIP_ID, FAKE_JWT))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.items).toHaveLength(3)
    expect(result.current.items[0].name).toBe('Hiking boots')
    expect(result.current.error).toBeNull()
  })

  it('togglePacked flips packed state optimistically', async () => {
    seedGear(SAMPLE_GEAR)
    const { result } = renderHook(() => useGearItems(TRIP_ID, FAKE_JWT))

    await waitFor(() => expect(result.current.loading).toBe(false))

    // g1 starts as packed: false
    expect(result.current.items.find(i => i.id === 'g1').packed).toBe(false)

    await act(async () => {
      await result.current.togglePacked('g1', false)
    })

    // Optimistic update: should now be true
    expect(result.current.items.find(i => i.id === 'g1').packed).toBe(true)
  })

  it('updateItem patches item fields', async () => {
    seedGear(SAMPLE_GEAR)
    const { result } = renderHook(() => useGearItems(TRIP_ID, FAKE_JWT))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateItem('g3', { status: 'Bought' })
    })

    expect(result.current.items.find(i => i.id === 'g3').status).toBe('Bought')
  })
})

// ---------- useTransportLegs ----------
describe('useTransportLegs', () => {
  const SAMPLE_LEGS = [
    { id: 't1', trip_id: TRIP_ID, day_index: 0, name: 'Prarion Lift', type: 'lift', from_place: 'Les Houches', to_place: 'Prarion', depart_time: null, cost: 18.90, currency: 'EUR' },
    { id: 't2', trip_id: TRIP_ID, day_index: 1, name: 'Chapieux Navette', type: 'shuttle', from_place: 'Nant Borrant', to_place: 'Les Chapieux', depart_time: '17:20', cost: 8, currency: 'EUR' },
  ]

  it('returns empty when no tripId', () => {
    const { result } = renderHook(() => useTransportLegs(null, null))
    expect(result.current.legs).toEqual([])
  })

  it('loads legs and groups by day_index', async () => {
    seedTransport(SAMPLE_LEGS)
    const { result } = renderHook(() => useTransportLegs(TRIP_ID, FAKE_JWT))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.legs).toHaveLength(2)
    expect(result.current.legsByDay.get(0)).toHaveLength(1)
    expect(result.current.legsByDay.get(1)).toHaveLength(1)
    expect(result.current.legsByDay.get(0)[0].name).toBe('Prarion Lift')
  })

  it('createLeg adds a new leg', async () => {
    seedTransport(SAMPLE_LEGS)
    const { result } = renderHook(() => useTransportLegs(TRIP_ID, FAKE_JWT))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createLeg({
        trip_id: TRIP_ID,
        day_index: 4,
        name: 'PostBus La Fouly',
        type: 'bus',
        from_place: 'La Fouly',
        to_place: 'Champex-Lac',
        cost: 8.40,
        currency: 'CHF',
      })
    })

    expect(result.current.legs).toHaveLength(3)
    expect(result.current.legs.find(l => l.name === 'PostBus La Fouly')).toBeTruthy()
  })

  it('updateLeg patches leg fields optimistically', async () => {
    seedTransport(SAMPLE_LEGS)
    const { result } = renderHook(() => useTransportLegs(TRIP_ID, FAKE_JWT))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateLeg('t1', { cost: 20.00 })
    })

    expect(result.current.legs.find(l => l.id === 't1').cost).toBe(20.00)
  })

  it('deleteLeg removes a leg optimistically', async () => {
    seedTransport(SAMPLE_LEGS)
    const { result } = renderHook(() => useTransportLegs(TRIP_ID, FAKE_JWT))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteLeg('t2')
    })

    expect(result.current.legs).toHaveLength(1)
    expect(result.current.legs.find(l => l.id === 't2')).toBeUndefined()
  })
})

// ---------- useSafetyContacts ----------
describe('useSafetyContacts', () => {
  it('returns empty when no tripId', () => {
    const { result } = renderHook(() => useSafetyContacts(null, null))
    expect(result.current.contacts).toEqual([])
  })

  it('seeds default contacts when table is empty', async () => {
    // No pre-seeded data — the hook should auto-seed from safetySeed.json
    const { result } = renderHook(() => useSafetyContacts(TRIP_ID, FAKE_JWT))

    await waitFor(() => expect(result.current.loading).toBe(false))

    // safetySeed.json has 5 contacts
    expect(result.current.contacts).toHaveLength(5)
    expect(result.current.contacts.map(c => c.label)).toContain('European Emergency')
    expect(result.current.contacts.map(c => c.label)).toContain('REGA (Swiss Air Rescue)')
  })

  it('loads existing contacts without re-seeding', async () => {
    const existing = [
      { id: 's1', trip_id: TRIP_ID, label: 'Custom Contact', phone: '+34 600 000 000', notes: 'test' },
    ]
    seedSafety(existing)

    const { result } = renderHook(() => useSafetyContacts(TRIP_ID, FAKE_JWT))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.contacts).toHaveLength(1)
    expect(result.current.contacts[0].label).toBe('Custom Contact')
  })

  it('createContact adds a new contact', async () => {
    seedSafety([
      { id: 's1', trip_id: TRIP_ID, label: 'Existing', phone: '112', notes: null },
    ])

    const { result } = renderHook(() => useSafetyContacts(TRIP_ID, FAKE_JWT))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createContact({ trip_id: TRIP_ID, label: 'New Contact', phone: '+1 555', notes: '' })
    })

    expect(result.current.contacts).toHaveLength(2)
  })

  it('updateContact patches fields optimistically', async () => {
    seedSafety([
      { id: 's1', trip_id: TRIP_ID, label: 'Old Label', phone: '112', notes: null },
    ])

    const { result } = renderHook(() => useSafetyContacts(TRIP_ID, FAKE_JWT))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateContact('s1', { label: 'Updated Label' })
    })

    expect(result.current.contacts[0].label).toBe('Updated Label')
  })

  it('deleteContact removes contact optimistically', async () => {
    seedSafety([
      { id: 's1', trip_id: TRIP_ID, label: 'To delete', phone: '112', notes: null },
      { id: 's2', trip_id: TRIP_ID, label: 'Keep', phone: '118', notes: null },
    ])

    const { result } = renderHook(() => useSafetyContacts(TRIP_ID, FAKE_JWT))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteContact('s1')
    })

    expect(result.current.contacts).toHaveLength(1)
    expect(result.current.contacts[0].label).toBe('Keep')
  })
})
