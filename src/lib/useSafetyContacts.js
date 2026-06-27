import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import defaultContacts from '../data/safetySeed.json';

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
        } else {
          setContacts(data || []);
        }
      } catch (err) {
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
      console.error('createContact failed:', err);
      return null;
    }

    setContacts(prev => [...prev, data]);
    return data;
  }, []);

  const updateContact = useCallback(async (id, updates) => {
    if (!clientRef.current) return;

    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

    const { error: err } = await clientRef.current
      .from('safety_contacts')
      .update(updates)
      .eq('id', id);

    if (err) console.error('updateContact failed:', err);
  }, []);

  const deleteContact = useCallback(async (id) => {
    if (!clientRef.current) return;

    setContacts(prev => prev.filter(c => c.id !== id));

    const { error: err } = await clientRef.current
      .from('safety_contacts')
      .delete()
      .eq('id', id);

    if (err) console.error('deleteContact failed:', err);
  }, []);

  return { contacts, loading, error, createContact, updateContact, deleteContact };
}
