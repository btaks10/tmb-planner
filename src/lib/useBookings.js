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

  return {
    bookings,
    bookingsByDayIndex,
    arrivalBooking,
    totals,
    gaps: GAPS,
    getFileUrl,
    loading,
    error,
  };
}
