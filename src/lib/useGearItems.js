import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createTripClient(jwt) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

export function useGearItems(tripId, jwt) {
  const [items, setItems] = useState([]);
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
          .from('gear_items')
          .select('*')
          .eq('trip_id', tripId)
          .order('category')
          .order('sort');

        if (err) throw err;
        setItems(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tripId, jwt]);

  const togglePacked = useCallback(async (id, currentValue) => {
    if (!clientRef.current) return;

    // Optimistic update
    setItems(prev => prev.map(it => it.id === id ? { ...it, packed: !currentValue } : it));

    const { error: err } = await clientRef.current
      .from('gear_items')
      .update({ packed: !currentValue, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (err) {
      // Rollback
      setItems(prev => prev.map(it => it.id === id ? { ...it, packed: currentValue } : it));
      console.error('togglePacked failed:', err);
    }
  }, []);

  const updateItem = useCallback(async (id, updates) => {
    if (!clientRef.current) return;

    setItems(prev => prev.map(it => it.id === id ? { ...it, ...updates } : it));

    const { error: err } = await clientRef.current
      .from('gear_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (err) console.error('updateItem failed:', err);
  }, []);

  return { items, loading, error, togglePacked, updateItem };
}
