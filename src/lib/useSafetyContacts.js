import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import defaultContacts from '../data/safetySeed.json';
import { idbPutAll, idbGetAll, idbPut, idbDelete, outboxPush } from './offlineStore';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createTripClient(jwt) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

export function useSafetyContacts(tripId, jwt) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!tripId || !jwt) return;
    clientRef.current = createTripClient(jwt);

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { data, error: err } = await clientRef.current
          .from('safety_contacts')
          .select('*')
          .eq('trip_id', tripId);

        if (err) throw err;

        // Seed defaults if table is empty for this trip
        if ((!data || data.length === 0) && !seededRef.current) {
          seededRef.current = true;
          const rows = defaultContacts.contacts.map(c => ({ ...c, trip_id: tripId }));
          const { data: seeded, error: seedErr } = await clientRef.current
            .from('safety_contacts')
            .insert(rows)
            .select();

          if (seedErr) throw seedErr;
          setContacts(seeded || []);
          if (seeded?.length) await idbPutAll('safety_contacts', seeded);
        } else {
          setContacts(data || []);
          if (data?.length) await idbPutAll('safety_contacts', data);
        }
      } catch (err) {
        // Serve from IDB when offline
        if (!navigator.onLine) {
          const cached = await idbGetAll('safety_contacts', tripId);
          if (cached.length) { setContacts(cached); return; }
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tripId, jwt]);

  const createContact = useCallback(async (contactData) => {
    if (!clientRef.current) return null;

    const { data, error: err } = await clientRef.current
      .from('safety_contacts')
      .insert({ ...contactData, trip_id: contactData.trip_id })
      .select()
      .single();

    if (err) {
      if (!navigator.onLine) {
        const temp = { ...contactData, id: `temp-${Date.now()}` };
        await outboxPush({ table: 'safety_contacts', action: 'insert', payload: contactData });
        setContacts(prev => [...prev, temp]);
        await idbPut('safety_contacts', temp);
        return temp;
      }
      console.error('createContact failed:', err);
      return null;
    }

    setContacts(prev => [...prev, data]);
    await idbPut('safety_contacts', data);
    return data;
  }, []);

  const updateContact = useCallback(async (id, updates) => {
    if (!clientRef.current) return;

    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

    // Write to IDB
    const all = await idbGetAll('safety_contacts', undefined);
    const existing = all.find(c => c.id === id);
    if (existing) await idbPut('safety_contacts', { ...existing, ...updates });

    const { error: err } = await clientRef.current
      .from('safety_contacts')
      .update(updates)
      .eq('id', id);

    if (err) {
      if (!navigator.onLine) {
        await outboxPush({ table: 'safety_contacts', action: 'update', id, payload: updates });
      } else {
        console.error('updateContact failed:', err);
      }
    }
  }, []);

  const deleteContact = useCallback(async (id) => {
    if (!clientRef.current) return;

    setContacts(prev => prev.filter(c => c.id !== id));
    await idbDelete('safety_contacts', id);

    const { error: err } = await clientRef.current
      .from('safety_contacts')
      .delete()
      .eq('id', id);

    if (err) {
      if (!navigator.onLine) {
        await outboxPush({ table: 'safety_contacts', action: 'delete', id });
      } else {
        console.error('deleteContact failed:', err);
      }
    }
  }, []);

  return { contacts, loading, error, createContact, updateContact, deleteContact };
}
