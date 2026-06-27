import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { idbPutAll, idbGetAll, idbPut, idbDelete, outboxPush } from './offlineStore';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createTripClient(jwt) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

export function useTransportLegs(tripId, jwt) {
  const [legs, setLegs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!tripId || !jwt) return;
    clientRef.current = createTripClient(jwt);

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { data, error: err } = await clientRef.current
          .from('transport_legs')
          .select('*')
          .eq('trip_id', tripId)
          .order('day_index')
          .order('depart_time');

        if (err) throw err;
        setLegs(data || []);
        // Mirror to IDB
        if (data?.length) await idbPutAll('transport_legs', data);
      } catch (err) {
        // Serve from IDB when offline
        if (!navigator.onLine) {
          const cached = await idbGetAll('transport_legs', tripId);
          if (cached.length) { setLegs(cached); return; }
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tripId, jwt]);

  // Group legs by day_index
  const legsByDay = new Map();
  for (const leg of legs) {
    const day = leg.day_index ?? -1;
    if (!legsByDay.has(day)) legsByDay.set(day, []);
    legsByDay.get(day).push(leg);
  }

  const createLeg = useCallback(async (legData) => {
    if (!clientRef.current || !legData.trip_id) return;

    const { data, error: err } = await clientRef.current
      .from('transport_legs')
      .insert(legData)
      .select()
      .single();

    if (err) {
      if (!navigator.onLine) {
        await outboxPush({ table: 'transport_legs', action: 'insert', payload: legData });
        // Optimistic local insert with temp id
        const temp = { ...legData, id: `temp-${Date.now()}` };
        setLegs(prev => [...prev, temp].sort((a, b) => (a.day_index ?? 0) - (b.day_index ?? 0)));
        await idbPut('transport_legs', temp);
        return temp;
      }
      console.error('createLeg failed:', err);
      return null;
    }

    setLegs(prev => [...prev, data].sort((a, b) => (a.day_index ?? 0) - (b.day_index ?? 0)));
    await idbPut('transport_legs', data);
    return data;
  }, []);

  const updateLeg = useCallback(async (id, updates) => {
    if (!clientRef.current) return;

    const updated_at = new Date().toISOString();
    const payload = { ...updates, updated_at };
    setLegs(prev => prev.map(l => l.id === id ? { ...l, ...payload } : l));

    // Write to IDB
    const all = await idbGetAll('transport_legs', undefined);
    const existing = all.find(l => l.id === id);
    if (existing) await idbPut('transport_legs', { ...existing, ...payload });

    const { error: err } = await clientRef.current
      .from('transport_legs')
      .update(payload)
      .eq('id', id);

    if (err) {
      if (!navigator.onLine) {
        await outboxPush({ table: 'transport_legs', action: 'update', id, payload });
      } else {
        console.error('updateLeg failed:', err);
      }
    }
  }, []);

  const deleteLeg = useCallback(async (id) => {
    if (!clientRef.current) return;

    setLegs(prev => prev.filter(l => l.id !== id));
    await idbDelete('transport_legs', id);

    const { error: err } = await clientRef.current
      .from('transport_legs')
      .delete()
      .eq('id', id);

    if (err) {
      if (!navigator.onLine) {
        await outboxPush({ table: 'transport_legs', action: 'delete', id });
      } else {
        console.error('deleteLeg failed:', err);
      }
    }
  }, []);

  return { legs, legsByDay, loading, error, createLeg, updateLeg, deleteLeg };
}
