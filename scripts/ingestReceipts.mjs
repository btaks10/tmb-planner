#!/usr/bin/env node
/**
 * Ingest receipts manifest → Supabase bookings + documents + Storage.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/ingestReceipts.mjs
 *
 * Idempotent — safe to re-run. Upserts on (trip_id, slug) for bookings,
 * (storage_path) for documents, and { upsert: true } for storage uploads.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://zhnlbzvpobngocgskzpu.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const TRIP_ID = '171eb249-e6db-49c2-9695-29b7aee936ee';
const RECEIPTS_DIR = resolve(__dirname, '..', 'receipts');
const manifest = JSON.parse(readFileSync(resolve(RECEIPTS_DIR, 'receiptsManifest.json'), 'utf-8'));

async function uploadFile(localPath, storagePath) {
  const fileBuffer = readFileSync(localPath);
  const ext = localPath.split('.').pop().toLowerCase();
  const contentType = ext === 'pdf' ? 'application/pdf' : `image/${ext}`;

  const { error } = await supabase.storage
    .from('trip-files')
    .upload(storagePath, fileBuffer, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed (${storagePath}): ${error.message}`);
}

async function upsertBooking(b) {
  const row = {
    trip_id: TRIP_ID,
    slug: b.slug,
    place_name: b.label,
    location: b.location || null,
    type: b.type || null,
    phase: b.phase,
    day_index: b.dayIndex ?? null,
    end_waypoint_id: b.endWaypointId ?? null,
    check_in: b.checkIn || null,
    check_out: b.checkOut || null,
    night_date: b.checkIn || null,
    confirmation_no: b.confirmationNo || null,
    cost: b.amount ?? null,
    currency: b.currency || 'EUR',
    status: b.status || null,
    guests: b.guests || null,
    phone: b.phone || null,
    notes: b.notes || null,
    sort_order: b.order ?? 0,
  };

  const { data, error } = await supabase
    .from('bookings')
    .upsert(row, { onConflict: 'trip_id,slug' })
    .select('id')
    .single();

  if (error) throw new Error(`Booking upsert failed (${b.slug}): ${error.message}`);
  return data.id;
}

async function upsertDocument(tripId, bookingId, file, storagePath) {
  const row = {
    trip_id: tripId,
    booking_id: bookingId,
    title: file.name,
    kind: file.kind || null,
    storage_path: storagePath,
  };

  const { error } = await supabase
    .from('documents')
    .upsert(row, { onConflict: 'storage_path' });

  if (error) throw new Error(`Document upsert failed (${storagePath}): ${error.message}`);
}

async function main() {
  console.log('Starting receipt ingest...\n');

  let bookingCount = 0;
  let docCount = 0;

  // Process bookings
  for (const b of manifest.bookings) {
    const bookingId = await upsertBooking(b);
    bookingCount++;
    console.log(`  ✓ Booking: ${b.label} (${b.slug})`);

    for (const file of b.files || []) {
      const localPath = resolve(RECEIPTS_DIR, file.name);
      const storagePath = `trips/${TRIP_ID}/bookings/${b.slug}/${file.name}`;

      await uploadFile(localPath, storagePath);
      await upsertDocument(TRIP_ID, bookingId, file, storagePath);
      docCount++;
      console.log(`    📄 ${file.name}`);
    }
  }

  // Process reference files
  for (const ref of manifest.reference || []) {
    const localPath = resolve(RECEIPTS_DIR, ref.name);
    const storagePath = `trips/${TRIP_ID}/reference/${ref.name}`;

    await uploadFile(localPath, storagePath);
    await upsertDocument(TRIP_ID, null, ref, storagePath);
    docCount++;
    console.log(`  📄 Reference: ${ref.name}`);
  }

  console.log(`\nDone! ${bookingCount} bookings, ${docCount} documents.`);

  // Verify counts
  const { count: bCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('trip_id', TRIP_ID);
  const { count: dCount } = await supabase.from('documents').select('*', { count: 'exact', head: true }).eq('trip_id', TRIP_ID);
  console.log(`Verified: ${bCount} bookings, ${dCount} documents in DB.`);
}

main().catch((err) => {
  console.error('Ingest failed:', err);
  process.exit(1);
});
