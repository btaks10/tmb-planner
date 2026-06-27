import { http, HttpResponse } from 'msw'

// In-memory stores for each table (reset between tests via server.resetHandlers)
let gearStore = []
let transportStore = []
let safetyStore = []
let bookingsStore = []

export function seedGear(items) { gearStore = [...items] }
export function seedTransport(legs) { transportStore = [...legs] }
export function seedSafety(contacts) { safetyStore = [...contacts] }
export function seedBookings(bookings) { bookingsStore = [...bookings] }
export function resetStores() {
  gearStore = []
  transportStore = []
  safetyStore = []
  bookingsStore = []
}

let nextId = 1
function uuid() { return `mock-${nextId++}` }

// Supabase REST uses PostgREST conventions:
// GET /rest/v1/table?select=*&column=eq.value&order=col1.asc,col2.asc
// PATCH /rest/v1/table?id=eq.value  (update)
// POST /rest/v1/table  (insert, with Prefer: return=representation + select)
// DELETE /rest/v1/table?id=eq.value

export const handlers = [
  // --- trips (existing) ---
  http.get('*/rest/v1/trips', () => HttpResponse.json([])),

  // --- gear_items ---
  http.get('*/rest/v1/gear_items', ({ request }) => {
    const url = new URL(request.url)
    const tripFilter = url.searchParams.get('trip_id')
    let items = gearStore
    if (tripFilter) {
      const tripId = tripFilter.replace('eq.', '')
      items = items.filter(i => i.trip_id === tripId)
    }
    return HttpResponse.json(items)
  }),

  http.patch('*/rest/v1/gear_items', async ({ request }) => {
    const url = new URL(request.url)
    const idFilter = url.searchParams.get('id')
    const body = await request.json()
    if (idFilter) {
      const id = idFilter.replace('eq.', '')
      gearStore = gearStore.map(i => i.id === id ? { ...i, ...body } : i)
    }
    return HttpResponse.json({})
  }),

  // --- transport_legs ---
  http.get('*/rest/v1/transport_legs', ({ request }) => {
    const url = new URL(request.url)
    const tripFilter = url.searchParams.get('trip_id')
    let legs = transportStore
    if (tripFilter) {
      const tripId = tripFilter.replace('eq.', '')
      legs = legs.filter(l => l.trip_id === tripId)
    }
    return HttpResponse.json(legs)
  }),

  http.post('*/rest/v1/transport_legs', async ({ request }) => {
    const body = await request.json()
    const row = { id: uuid(), ...body }
    transportStore.push(row)
    return HttpResponse.json(row, {
      headers: { 'Content-Profile': 'public' },
    })
  }),

  http.patch('*/rest/v1/transport_legs', async ({ request }) => {
    const url = new URL(request.url)
    const idFilter = url.searchParams.get('id')
    const body = await request.json()
    if (idFilter) {
      const id = idFilter.replace('eq.', '')
      transportStore = transportStore.map(l => l.id === id ? { ...l, ...body } : l)
    }
    return HttpResponse.json({})
  }),

  http.delete('*/rest/v1/transport_legs', ({ request }) => {
    const url = new URL(request.url)
    const idFilter = url.searchParams.get('id')
    if (idFilter) {
      const id = idFilter.replace('eq.', '')
      transportStore = transportStore.filter(l => l.id !== id)
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // --- safety_contacts ---
  http.get('*/rest/v1/safety_contacts', ({ request }) => {
    const url = new URL(request.url)
    const tripFilter = url.searchParams.get('trip_id')
    let contacts = safetyStore
    if (tripFilter) {
      const tripId = tripFilter.replace('eq.', '')
      contacts = contacts.filter(c => c.trip_id === tripId)
    }
    return HttpResponse.json(contacts)
  }),

  http.post('*/rest/v1/safety_contacts', async ({ request }) => {
    const body = await request.json()
    // Could be array (seed) or single
    const rows = Array.isArray(body)
      ? body.map(c => ({ id: uuid(), ...c }))
      : [{ id: uuid(), ...body }]
    safetyStore.push(...rows)
    // Supabase returns array for multi-insert, single for single
    return HttpResponse.json(Array.isArray(body) ? rows : rows[0], {
      headers: { 'Content-Profile': 'public' },
    })
  }),

  http.patch('*/rest/v1/safety_contacts', async ({ request }) => {
    const url = new URL(request.url)
    const idFilter = url.searchParams.get('id')
    const body = await request.json()
    if (idFilter) {
      const id = idFilter.replace('eq.', '')
      safetyStore = safetyStore.map(c => c.id === id ? { ...c, ...body } : c)
    }
    return HttpResponse.json({})
  }),

  http.delete('*/rest/v1/safety_contacts', ({ request }) => {
    const url = new URL(request.url)
    const idFilter = url.searchParams.get('id')
    if (idFilter) {
      const id = idFilter.replace('eq.', '')
      safetyStore = safetyStore.filter(c => c.id !== id)
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // --- bookings (with documents join) ---
  http.get('*/rest/v1/bookings', () => {
    return HttpResponse.json(bookingsStore)
  }),
]
