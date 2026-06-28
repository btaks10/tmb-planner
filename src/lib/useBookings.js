import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { idbPutAll, idbGetAll } from './offlineStore';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createTripClient(jwt) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

const GAPS = [
  { label: 'Lykke Hôtel & Spa — actual booking receipt', phase: 'stage', dayIndex: 7, status: 'missing', action: 'Confirm reservation; upload real confirmation/receipt.' },
  { label: 'Flight Barcelona → Geneva (outbound)', phase: 'arrival', status: 'missing', action: 'Add flight + upload boarding pass / e-ticket.' },
  { label: 'Flight Geneva → Barcelona (return, Aug 11)', phase: 'departure', status: 'missing', action: 'Confirm return flight; upload e-ticket.' },
  { label: 'Geneva airport transfers (both ends)', phase: 'logistics', status: 'missing', action: 'Arrange and upload confirmations.' },
];

export function useBookings(tripId, jwt) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const urlCacheRef = useRef(new Map());
  const clientRef = useRef(null);

  useEffect(() => {
    if (!tripId || !jwt) return;
    clientRef.current = createTripClient(jwt);

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { data, error: err } = await clientRef.current
          .from('bookings')
          .select('*, documents(*)')
          .eq('trip_id', tripId)
          .order('sort_order');

        if (err) throw err;
        setBookings(data || []);
        // Mirror to IDB
        if (data?.length) await idbPutAll('bookings', data);
      } catch (err) {
        // Serve from IDB when offline
        if (!navigator.onLine) {
          const cached = await idbGetAll('bookings', tripId);
          if (cached.length) { setBookings(cached); return; }
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tripId, jwt]);

  const bookingsByDayIndex = new Map();
  let arrivalBooking = null;
  const totals = { eur: 0, chf: 0 };

  for (const b of bookings) {
    if (b.day_index != null) bookingsByDayIndex.set(b.day_index, b);
    if (b.phase === 'arrival') arrivalBooking = b;
    if (b.cost != null) {
      if ((b.currency || 'EUR').toUpperCase() === 'CHF') totals.chf += Number(b.cost);
      else totals.eur += Number(b.cost);
    }
  }

  const getFileUrl = useCallback(async (storagePath) => {
    if (!clientRef.current || !storagePath) return null;
    const cached = urlCacheRef.current.get(storagePath);
    if (cached && cached.expires > Date.now()) return cached.url;

    const { data, error: err } = await clientRef.current.storage
      .from('trip-files')
      .createSignedUrl(storagePath, 3600);

    if (err || !data?.signedUrl) return null;
    urlCacheRef.current.set(storagePath, { url: data.signedUrl, expires: Date.now() + 3500_000 });
    return data.signedUrl;
  }, []);

  // Upload a document file to a booking
  const uploadDocument = useCallback(async (bookingId, bookingSlug, file) => {
    if (!clientRef.current || !tripId) return null;
    const storagePath = `trips/${tripId}/bookings/${bookingSlug}/${file.name}`;

    // Upload to trip-files storage
    const { error: uploadErr } = await clientRef.current.storage
      .from('trip-files')
      .upload(storagePath, file, { upsert: true });
    if (uploadErr) throw uploadErr;

    // Insert documents row
    const kind = file.name.match(/receipt/i) ? 'receipt' : file.name.match(/confirm/i) ? 'confirmation' : 'other';
    const { data, error: dbErr } = await clientRef.current
      .from('documents')
      .insert({ booking_id: bookingId, title: file.name, kind, storage_path: storagePath })
      .select()
      .single();
    if (dbErr) throw dbErr;

    // Update local state
    setBookings(prev => prev.map(b =>
      b.id === bookingId
        ? { ...b, documents: [...(b.documents || []), data] }
        : b
    ));
    return data;
  }, [tripId]);

  // Remove a document (storage + row)
  const removeDocument = useCallback(async (bookingId, docId, storagePath) => {
    if (!clientRef.current) return;

    // Delete storage object
    if (storagePath) {
      await clientRef.current.storage.from('trip-files').remove([storagePath]);
    }

    // Delete documents row
    const { error: dbErr } = await clientRef.current
      .from('documents')
      .delete()
      .eq('id', docId);
    if (dbErr) throw dbErr;

    // Update local state
    setBookings(prev => prev.map(b =>
      b.id === bookingId
        ? { ...b, documents: (b.documents || []).filter(d => d.id !== docId) }
        : b
    ));
    urlCacheRef.current.delete(storagePath);
  }, []);

  return {
    bookings,
    bookingsByDayIndex,
    arrivalBooking,
    totals,
    gaps: GAPS,
    getFileUrl,
    uploadDocument,
    removeDocument,
    loading,
    error,
  };
}
