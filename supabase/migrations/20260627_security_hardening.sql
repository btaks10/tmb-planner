-- Security hardening migration (applied 2026-06-27 via Supabase MCP)
--
-- 1. Revoke direct execute on mint_trip_jwt from anon/authenticated/public
--    Edge function calls it via service_role client — unaffected.
-- 2. Set search_path on update_updated_at trigger function
-- 3. Wrap auth.jwt() as (select auth.jwt()) in all 9 RLS policies
-- 4. Add indexes on all FK columns

-- 1. Revoke anon/authenticated access to mint_trip_jwt
REVOKE EXECUTE ON FUNCTION public.mint_trip_jwt(uuid) FROM anon, authenticated, public;

-- 2. Harden update_updated_at: set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- 3. Harden RLS policies: (select auth.jwt()) prevents per-row re-evaluation
--    Public tables (6 policies)
DROP POLICY IF EXISTS trip_self ON trips;
CREATE POLICY trip_self ON trips FOR ALL USING (
  id = ((select auth.jwt()) ->> 'trip_id')::uuid
) WITH CHECK (
  id = ((select auth.jwt()) ->> 'trip_id')::uuid
);

DROP POLICY IF EXISTS trip_children ON gear_items;
CREATE POLICY trip_children ON gear_items FOR ALL USING (
  trip_id = ((select auth.jwt()) ->> 'trip_id')::uuid
) WITH CHECK (
  trip_id = ((select auth.jwt()) ->> 'trip_id')::uuid
);

DROP POLICY IF EXISTS trip_bookings ON bookings;
CREATE POLICY trip_bookings ON bookings FOR ALL USING (
  trip_id = ((select auth.jwt()) ->> 'trip_id')::uuid
) WITH CHECK (
  trip_id = ((select auth.jwt()) ->> 'trip_id')::uuid
);

DROP POLICY IF EXISTS trip_documents ON documents;
CREATE POLICY trip_documents ON documents FOR ALL USING (
  trip_id = ((select auth.jwt()) ->> 'trip_id')::uuid
) WITH CHECK (
  trip_id = ((select auth.jwt()) ->> 'trip_id')::uuid
);

DROP POLICY IF EXISTS trip_transport ON transport_legs;
CREATE POLICY trip_transport ON transport_legs FOR ALL USING (
  trip_id = ((select auth.jwt()) ->> 'trip_id')::uuid
) WITH CHECK (
  trip_id = ((select auth.jwt()) ->> 'trip_id')::uuid
);

DROP POLICY IF EXISTS trip_safety ON safety_contacts;
CREATE POLICY trip_safety ON safety_contacts FOR ALL USING (
  trip_id = ((select auth.jwt()) ->> 'trip_id')::uuid
) WITH CHECK (
  trip_id = ((select auth.jwt()) ->> 'trip_id')::uuid
);

-- Storage policies (3 policies)
DROP POLICY IF EXISTS trip_files_select ON storage.objects;
CREATE POLICY trip_files_select ON storage.objects FOR SELECT USING (
  bucket_id = 'trip-files'
  AND (storage.foldername(name))[2] = ((select auth.jwt()) ->> 'trip_id')
);

DROP POLICY IF EXISTS trip_files_insert ON storage.objects;
CREATE POLICY trip_files_insert ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'trip-files'
  AND (storage.foldername(name))[2] = ((select auth.jwt()) ->> 'trip_id')
);

DROP POLICY IF EXISTS trip_files_update ON storage.objects;
CREATE POLICY trip_files_update ON storage.objects FOR UPDATE USING (
  bucket_id = 'trip-files'
  AND (storage.foldername(name))[2] = ((select auth.jwt()) ->> 'trip_id')
);

-- 4. Add indexes on FK columns
CREATE INDEX IF NOT EXISTS idx_gear_items_trip_id ON gear_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_documents_trip_id ON documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_documents_booking_id ON documents(booking_id);
CREATE INDEX IF NOT EXISTS idx_transport_legs_trip_id ON transport_legs(trip_id);
CREATE INDEX IF NOT EXISTS idx_safety_contacts_trip_id ON safety_contacts(trip_id);
