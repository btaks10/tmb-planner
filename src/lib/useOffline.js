import { useState, useEffect, useCallback } from 'react';
import { outboxDrain, outboxRemove } from './offlineStore';

/**
 * Returns current online/offline status.
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}

/**
 * Drains the outbox FIFO, replaying each entry via the supplied Supabase client.
 * Stops on first failure so ordering is preserved.
 * Returns { replayed: number, failed: boolean }.
 */
export async function replayOutbox(client) {
  if (!client) return { replayed: 0, failed: false };

  const entries = await outboxDrain();
  if (!entries.length) return { replayed: 0, failed: false };

  let replayed = 0;

  for (const entry of entries) {
    try {
      const { table, action, id, payload } = entry;

      let result;
      if (action === 'insert') {
        result = await client.from(table).insert(payload);
      } else if (action === 'update') {
        result = await client.from(table).update(payload).eq('id', id);
      } else if (action === 'delete') {
        result = await client.from(table).delete().eq('id', id);
      } else if (action === 'upsert') {
        result = await client.from(table).upsert(payload);
      }

      if (result?.error) throw result.error;

      await outboxRemove(entry.queueId);
      replayed++;
    } catch (err) {
      console.warn('Outbox replay stopped at entry', entry.queueId, err);
      return { replayed, failed: true };
    }
  }

  return { replayed, failed: false };
}
