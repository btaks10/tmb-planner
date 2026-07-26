// IndexedDB cache for Open-Meteo forecasts — same idb pattern as
// offlineStore.js, but a separate database: forecasts are ephemeral,
// per-device data and must never ride along in the Supabase sync path.
//
// Record shape: { key, point, fetchedAt, data }
//   key       — forecast point key ('day-0' … 'day-6', 'valley')
//   point     — { key, dayIndex, name, lat, lng, elevation }
//   fetchedAt — epoch ms of the fetch
//   data      — raw Open-Meteo response JSON

import { openDB } from 'idb';

const DB_NAME = 'tmb-weather';
const DB_VERSION = 1;
const STORE = 'forecasts';

/** Returns false when IndexedDB is unavailable (e.g. jsdom tests). */
function idbAvailable() {
  return typeof indexedDB !== 'undefined';
}

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    },
  });
}

export async function forecastPut(record) {
  if (!idbAvailable()) return;
  const db = await getDB();
  await db.put(STORE, record);
}

export async function forecastGet(key) {
  if (!idbAvailable()) return null;
  const db = await getDB();
  return (await db.get(STORE, key)) ?? null;
}

export async function forecastGetAll() {
  if (!idbAvailable()) return [];
  const db = await getDB();
  return db.getAll(STORE);
}

export async function forecastClear() {
  if (!idbAvailable()) return;
  const db = await getDB();
  await db.clear(STORE);
}
