import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

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
      } catch (err) {
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
      console.error('createLeg failed:', err);
      return null;
    }

    setLegs(prev => [...prev, data].sort((a, b) => (a.day_index ?? 0) - (b.day_index ?? 0)));
    return data;
  }, []);

  const updateLeg = useCallback(async (id, updates) => {
    if (!clientRef.current) return;

    setLegs(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));

    const { error: err } = await clientRef.current
      .from('transport_legs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (err) console.error('updateLeg failed:', err);
  }, []);

  const deleteLeg = useCallback(async (id) => {
    if (!clientRef.current) return;

    setLegs(prev => prev.filter(l => l.id !== id));

    const { error: err } = await clientRef.current
      .from('transport_legs')
      .delete()
      .eq('id', id);

    if (err) console.error('deleteLeg failed:', err);
  }, []);

  return { legs, legsByDay, loading, error, createLeg, updateLeg, deleteLeg };
}
