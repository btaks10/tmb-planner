import { openDB } from 'idb';

const DB_NAME = 'tmb-offline';
const DB_VERSION = 1;

const STORES = ['trips', 'gear_items', 'bookings', 'transport_legs', 'safety_contacts'];

/** Returns false when IndexedDB is unavailable (e.g. jsdom tests). */
function idbAvailable() {
  return typeof indexedDB !== 'undefined';
}

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: 'id' });
          if (name !== 'trips') store.createIndex('trip_id', 'trip_id');
        }
      }
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'queueId', autoIncrement: true });
      }
    },
  });
}

// ── Read helpers ──

export async function idbGetAll(store, tripId) {
  if (!idbAvailable()) return [];
  const db = await getDB();
  if (store === 'trips') {
    const all = await db.getAll(store);
    return tripId ? all.filter(r => r.id === tripId) : all;
  }
  return db.getAllFromIndex(store, 'trip_id', tripId);
}

// ── Write helpers ──

export async function idbPut(store, record) {
  if (!idbAvailable()) return;
  const db = await getDB();
  await db.put(store, record);
}

export async function idbPutAll(store, records) {
  if (!idbAvailable()) return;
  const db = await getDB();
  const tx = db.transaction(store, 'readwrite');
  for (const r of records) tx.store.put(r);
  await tx.done;
}

export async function idbDelete(store, id) {
  if (!idbAvailable()) return;
  const db = await getDB();
  await db.delete(store, id);
}

// ── Outbox (offline write queue) ──

export async function outboxPush(entry) {
  if (!idbAvailable()) return;
  const db = await getDB();
  await db.add('outbox', { ...entry, created_at: Date.now() });
}

export async function outboxDrain() {
  if (!idbAvailable()) return [];
  const db = await getDB();
  return db.getAll('outbox');
}

export async function outboxRemove(queueId) {
  if (!idbAvailable()) return;
  const db = await getDB();
  await db.delete('outbox', queueId);
}

export async function outboxCount() {
  if (!idbAvailable()) return 0;
  const db = await getDB();
  return db.count('outbox');
}
