import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransportTab from '../../src/components/TransportTab'

const SAMPLE_LEGS = [
  { id: 't1', trip_id: 'trip-1', day_index: 0, name: 'Téléphérique du Prarion', type: 'lift', from_place: 'Les Houches', to_place: 'Prarion', depart_time: null, cost: 18.90, currency: 'EUR', info: 'Optional shortcut', url: null },
  { id: 't2', trip_id: 'trip-1', day_index: 1, name: 'Chapieux Navette', type: 'shuttle', from_place: 'Nant Borrant', to_place: 'Les Chapieux', depart_time: '17:20', cost: 8.00, currency: 'EUR', info: 'Evening shuttles', url: null },
  { id: 't3', trip_id: 'trip-1', day_index: 4, name: 'PostBus La Fouly', type: 'bus', from_place: 'La Fouly', to_place: 'Champex-Lac', depart_time: null, cost: 8.40, currency: 'CHF', info: null, url: 'https://www.postauto.ch' },
]

function buildLegsByDay(legs) {
  const map = new Map()
  for (const leg of legs) {
    const day = leg.day_index ?? -1
    if (!map.has(day)) map.set(day, [])
    map.get(day).push(leg)
  }
  return map
}

function renderTab(overrides = {}) {
  const legsByDay = buildLegsByDay(overrides.legs || SAMPLE_LEGS)
  const props = {
    legs: SAMPLE_LEGS,
    legsByDay,
    loading: false,
    error: null,
    tripId: 'trip-1',
    onCreateLeg: vi.fn(),
    onUpdateLeg: vi.fn(),
    onDeleteLeg: vi.fn(),
    ...overrides,
  }
  // Ensure legsByDay is always correct for the legs being rendered
  if (!overrides.legsByDay) {
    props.legsByDay = legsByDay
  }
  return { ...render(<TransportTab {...props} />), props }
}

describe('TransportTab', () => {
  it('renders day headers for all 7 days', () => {
    renderTab()
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByText(`Day ${i}`)).toBeInTheDocument()
    }
  })

  it('renders route labels on day headers', () => {
    renderTab()
    expect(screen.getByText('Les Houches → Les Contamines')).toBeInTheDocument()
    expect(screen.getByText('Les Contamines → Les Chapieux')).toBeInTheDocument()
  })

  it('renders transport leg cards', () => {
    renderTab()
    expect(screen.getByText('Téléphérique du Prarion')).toBeInTheDocument()
    expect(screen.getByText('Chapieux Navette')).toBeInTheDocument()
    expect(screen.getByText('PostBus La Fouly')).toBeInTheDocument()
  })

  it('shows from → to for each leg', () => {
    renderTab()
    expect(screen.getByText(/Les Houches → Prarion/)).toBeInTheDocument()
    expect(screen.getByText(/Nant Borrant → Les Chapieux/)).toBeInTheDocument()
  })

  it('shows cost badges with correct currency', () => {
    renderTab()
    expect(screen.getByText('€18.90')).toBeInTheDocument()
    expect(screen.getByText('€8.00')).toBeInTheDocument()
    expect(screen.getByText('CHF 8.40')).toBeInTheDocument()
  })

  it('shows departure time when present', () => {
    renderTab()
    expect(screen.getByText(/at 17:20/)).toBeInTheDocument()
  })

  it('shows info text', () => {
    renderTab()
    expect(screen.getByText('Optional shortcut')).toBeInTheDocument()
    expect(screen.getByText('Evening shuttles')).toBeInTheDocument()
  })

  it('shows external link when url present', () => {
    renderTab()
    const link = screen.getByText('Timetable')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', 'https://www.postauto.ch')
  })

  it('shows "No transport needed" for empty days', () => {
    renderTab()
    // Days 3, 4 (index 2, 3) have no legs — should show the empty message
    // Actually day 5 (index 4) has a leg, but days 3 and 4 don't
    const emptyMessages = screen.getAllByText(/No transport needed/)
    expect(emptyMessages.length).toBeGreaterThanOrEqual(1)
  })

  it('has Add button per day', () => {
    renderTab()
    const addButtons = screen.getAllByText('Add')
    expect(addButtons).toHaveLength(9) // Travel + 7 hike days + Return
  })

  it('calls onCreateLeg when Add is clicked', async () => {
    const user = userEvent.setup()
    const { props } = renderTab()

    const addButtons = screen.getAllByText('Add')
    await user.click(addButtons[0])

    expect(props.onCreateLeg).toHaveBeenCalledWith(
      expect.objectContaining({
        trip_id: 'trip-1',
        day_index: -1,
        name: 'New transport',
        type: 'bus',
      })
    )
  })

  it('enters edit mode on leg card click', async () => {
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByText('Téléphérique du Prarion'))

    // Should show edit fields
    expect(screen.getByDisplayValue('Téléphérique du Prarion')).toBeInTheDocument()
    expect(screen.getByDisplayValue('18.9')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    renderTab({ loading: true })
    expect(screen.getByText('Loading transport...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    renderTab({ error: 'DB connection failed' })
    expect(screen.getByText('Error: DB connection failed')).toBeInTheDocument()
  })
})
