import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { idbPutAll, idbGetAll, idbPut, outboxPush } from './offlineStore';

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
        // Mirror to IDB
        if (data?.length) await idbPutAll('gear_items', data);
      } catch (err) {
        // Serve from IDB when offline
        if (!navigator.onLine) {
          const cached = await idbGetAll('gear_items', tripId);
          if (cached.length) { setItems(cached); return; }
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tripId, jwt]);

  const togglePacked = useCallback(async (id, currentValue) => {
    if (!clientRef.current) return;

    const updated_at = new Date().toISOString();
    // Optimistic update
    setItems(prev => prev.map(it => it.id === id ? { ...it, packed: !currentValue, updated_at } : it));

    // Write to IDB immediately
    const item = (await idbGetAll('gear_items', undefined)).find(i => i.id === id);
    if (item) await idbPut('gear_items', { ...item, packed: !currentValue, updated_at });

    const { error: err } = await clientRef.current
      .from('gear_items')
      .update({ packed: !currentValue, updated_at })
      .eq('id', id);

    if (err) {
      if (!navigator.onLine) {
        await outboxPush({ table: 'gear_items', action: 'update', id, payload: { packed: !currentValue, updated_at } });
      } else {
        // Rollback
        setItems(prev => prev.map(it => it.id === id ? { ...it, packed: currentValue } : it));
        console.error('togglePacked failed:', err);
      }
    }
  }, []);

  const updateItem = useCallback(async (id, updates) => {
    if (!clientRef.current) return;

    const updated_at = new Date().toISOString();
    const payload = { ...updates, updated_at };
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...payload } : it));

    // Write to IDB
    const item = (await idbGetAll('gear_items', undefined)).find(i => i.id === id);
    if (item) await idbPut('gear_items', { ...item, ...payload });

    const { error: err } = await clientRef.current
      .from('gear_items')
      .update(payload)
      .eq('id', id);

    if (err) {
      if (!navigator.onLine) {
        await outboxPush({ table: 'gear_items', action: 'update', id, payload });
      } else {
        console.error('updateItem failed:', err);
      }
    }
  }, []);

  return { items, loading, error, togglePacked, updateItem };
}
