import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DocumentsSafetyTab from '../../src/components/DocumentsSafetyTab'

const SAMPLE_BOOKINGS = [
  {
    id: 'b1',
    place_name: 'Hôtel Les Houches',
    documents: [
      { id: 'd1', title: 'Booking Confirmation', kind: 'confirmation', storage_path: 'trips/t1/confirm.pdf' },
      { id: 'd2', title: 'Payment Receipt', kind: 'receipt', storage_path: 'trips/t1/receipt.pdf' },
    ],
  },
  {
    id: 'b2',
    place_name: 'Refuge de la Balme',
    documents: [
      { id: 'd3', title: 'Refuge Reservation', kind: 'confirmation', storage_path: 'trips/t1/balme.pdf' },
    ],
  },
  {
    id: 'b3',
    place_name: 'No-docs booking',
    documents: [],
  },
]

const SAMPLE_CONTACTS = [
  { id: 'c1', label: 'European Emergency', phone: '112', notes: 'Works everywhere' },
  { id: 'c2', label: 'PGHM Chamonix', phone: '+33 4 50 53 16 89', notes: 'Mountain rescue' },
  { id: 'c3', label: 'Trail Conditions', phone: null, notes: 'Check autourdumontblanc.com' },
]

function renderTab(overrides = {}) {
  const props = {
    bookings: SAMPLE_BOOKINGS,
    contacts: SAMPLE_CONTACTS,
    getFileUrl: vi.fn(async () => 'https://signed-url.example.com/file.pdf'),
    contactsLoading: false,
    contactsError: null,
    tripId: 'trip-1',
    onCreateContact: vi.fn(),
    onUpdateContact: vi.fn(),
    onDeleteContact: vi.fn(),
    ...overrides,
  }
  return { ...render(<DocumentsSafetyTab {...props} />), props }
}

describe('DocumentsSafetyTab', () => {
  // --- Documents Vault ---
  describe('Documents vault', () => {
    it('renders the Documents Vault header', () => {
      renderTab()
      expect(screen.getByText('Documents Vault')).toBeInTheDocument()
    })

    it('shows total document count', () => {
      renderTab()
      expect(screen.getByText('3 files')).toBeInTheDocument()
    })

    it('groups documents by kind', () => {
      renderTab()
      // Two confirmation docs, one receipt
      expect(screen.getByText(/Confirmation \(2\)/)).toBeInTheDocument()
      expect(screen.getByText(/Receipt \(1\)/)).toBeInTheDocument()
    })

    it('renders each document row with title', () => {
      renderTab()
      expect(screen.getByText('Booking Confirmation')).toBeInTheDocument()
      expect(screen.getByText('Payment Receipt')).toBeInTheDocument()
      expect(screen.getByText('Refuge Reservation')).toBeInTheDocument()
    })

    it('has View buttons for each document', () => {
      renderTab()
      const viewButtons = screen.getAllByText('View')
      expect(viewButtons).toHaveLength(3)
    })

    it('calls getFileUrl when View is clicked', async () => {
      const user = userEvent.setup()

      // Mock window.open
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

      const { props } = renderTab()

      const viewButtons = screen.getAllByText('View')
      await user.click(viewButtons[0])

      expect(props.getFileUrl).toHaveBeenCalledWith('trips/t1/confirm.pdf')
      // Wait for the async resolution to call window.open
      await vi.waitFor(() => {
        expect(openSpy).toHaveBeenCalledWith('https://signed-url.example.com/file.pdf', '_blank')
      })

      openSpy.mockRestore()
    })

    it('shows empty vault message when no documents', () => {
      renderTab({ bookings: [] })
      expect(screen.getByText(/No documents uploaded yet/)).toBeInTheDocument()
    })
  })

  // --- Emergency Contacts ---
  describe('Emergency contacts', () => {
    it('renders the Emergency Contacts header', () => {
      renderTab()
      expect(screen.getByText('Emergency Contacts')).toBeInTheDocument()
    })

    it('renders all contacts', () => {
      renderTab()
      expect(screen.getByText('European Emergency')).toBeInTheDocument()
      expect(screen.getByText('PGHM Chamonix')).toBeInTheDocument()
      expect(screen.getByText('Trail Conditions')).toBeInTheDocument()
    })

    it('renders phone numbers as tel: links', () => {
      renderTab()
      const phoneLink = screen.getByText('112')
      expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:112')

      const pghmLink = screen.getByText('+33 4 50 53 16 89')
      expect(pghmLink.closest('a')).toHaveAttribute('href', 'tel:+33 4 50 53 16 89')
    })

    it('shows notes text', () => {
      renderTab()
      expect(screen.getByText('Works everywhere')).toBeInTheDocument()
      expect(screen.getByText('Mountain rescue')).toBeInTheDocument()
      expect(screen.getByText('Check autourdumontblanc.com')).toBeInTheDocument()
    })

    it('has Add contact button', () => {
      renderTab()
      expect(screen.getByText('Add contact')).toBeInTheDocument()
    })

    it('calls onCreateContact when Add is clicked', async () => {
      const user = userEvent.setup()
      const { props } = renderTab()

      await user.click(screen.getByText('Add contact'))

      expect(props.onCreateContact).toHaveBeenCalledWith(
        expect.objectContaining({
          trip_id: 'trip-1',
          label: 'New Contact',
        })
      )
    })

    it('enters edit mode on contact click', async () => {
      const user = userEvent.setup()
      renderTab()

      await user.click(screen.getByText('European Emergency'))

      // Should show edit inputs
      expect(screen.getByDisplayValue('European Emergency')).toBeInTheDocument()
      expect(screen.getByDisplayValue('112')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('shows contacts loading state', () => {
      renderTab({ contactsLoading: true, contacts: [] })
      expect(screen.getByText('Loading contacts...')).toBeInTheDocument()
    })

    it('shows contacts error state', () => {
      renderTab({ contactsError: 'Permission denied', contacts: [] })
      expect(screen.getByText('Error: Permission denied')).toBeInTheDocument()
    })
  })
})
