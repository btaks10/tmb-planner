import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create an authenticated Supabase client with a trip-scoped JWT
function createTripClient(jwt) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

export function useTrip(shareToken) {
  const [trip, setTrip] = useState(null);
  const [jwt, setJwt] = useState(null);
  const [loading, setLoading] = useState(!!shareToken);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);
  const saveTimeoutRef = useRef(null);
  const tripRef = useRef(null);
  const clientRef = useRef(null);
  const channelRef = useRef(null);
  const refreshTimerRef = useRef(null);

  // Exchange share token for JWT + trip data
  const loadTrip = useCallback(async (token) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/trip-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) throw new Error('Trip not found');

      const data = await res.json();
      if (!data.jwt || !data.trip) throw new Error('Invalid session response');

      setJwt(data.jwt);
      setTrip(data.trip);
      tripRef.current = data.trip;
      clientRef.current = createTripClient(data.jwt);

      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new trip via Edge Function
  const createTrip = useCallback(async (tripData) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-trip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(tripData),
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      if (result.jwt) {
        setJwt(result.jwt);
        clientRef.current = createTripClient(result.jwt);
      }
      setTrip(result.trip);
      tripRef.current = result.trip;

      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced save to Supabase
  const updateTrip = useCallback(
    (updates) => {
      if (!tripRef.current?.id || !clientRef.current) return;

      // Optimistic local update
      const merged = { ...tripRef.current, ...updates };
      setTrip(merged);
      tripRef.current = merged;

      // Debounce the write
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setSyncing(true);
          const { error: err } = await clientRef.current
            .from('trips')
            .update(updates)
            .eq('id', tripRef.current.id);

          if (err) console.error('Sync error:', err);
        } catch (err) {
          console.error('Sync failed:', err);
        } finally {
          setSyncing(false);
        }
      }, 500);
    },
    [] // stable — reads from refs
  );

  // Load trip when shareToken is provided
  useEffect(() => {
    if (shareToken) {
      loadTrip(shareToken);
    }
  }, [shareToken, loadTrip]);

  // Realtime subscription with polling fallback
  useEffect(() => {
    if (!trip?.id || !jwt || !clientRef.current) return;

    let polling = false;
    let pollInterval = null;

    // Try Realtime first
    const channel = clientRef.current
      .channel(`trip-sync-${trip.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${trip.id}` },
        (payload) => {
          // Only apply if it's a remote change (different updated_at)
          if (payload.new && payload.new.updated_at !== tripRef.current?.updated_at) {
            setTrip(payload.new);
            tripRef.current = payload.new;
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Fallback to polling
          console.warn('Realtime failed, falling back to polling');
          setConnected(false);
          polling = true;
          startPolling();
        }
      });

    channelRef.current = channel;

    function startPolling() {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        try {
          const { data, error: err } = await clientRef.current
            .from('trips')
            .select('*')
            .eq('id', tripRef.current?.id)
            .single();

          if (!err && data && data.updated_at !== tripRef.current?.updated_at) {
            setTrip(data);
            tripRef.current = data;
          }
        } catch (_) {
          // silent
        }
      }, 10_000);
    }

    return () => {
      if (channelRef.current) {
        clientRef.current?.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [trip?.id, jwt]);

  // Refresh JWT every 50 minutes (expires in 60)
  useEffect(() => {
    if (!shareToken || !jwt) return;

    refreshTimerRef.current = setInterval(() => {
      loadTrip(shareToken);
    }, 50 * 60 * 1000);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [shareToken, jwt, loadTrip]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return {
    trip,
    jwt,
    loading,
    error,
    syncing,
    connected,
    updateTrip,
    createTrip,
    loadTrip,
    shareToken: trip?.share_token || shareToken,
  };
}
