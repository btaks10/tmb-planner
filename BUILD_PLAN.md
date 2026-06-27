# TMB Planner — Build Plan: Live, Shared, Offline (v2)

**For:** Claude Code · **Repo:** `btaks10/tmb-planner` · **Local:** `~/Desktop/tmb-planner` · **Live:** https://tmb-planner.vercel.app
**Author of plan:** drafted with Bryan, 2026-06-27 · **Companion doc:** `TRAIL_DATA_AUDIT.md`

---

## How to use this document

Work **phase by phase, in order**. Each phase lists tasks, files to touch, and **acceptance criteria** — don't start the next phase until the current one's criteria pass (`npm run dev`, verify, commit). Phases 0–2 are the foundation and must land before 3–7. At the end, follow the existing `FEATURE_BRIEFS.md` end-of-session sweep to update the Notion Feature Briefs DB.

---

## 1. Goal & locked decisions

Turn the current single-user, localStorage-only itinerary tool into a **live, shareable, offline-capable** trip app for Bryan + Nick.

| Decision | Choice |
|---|---|
| Backend | **Supabase** (Postgres + Storage + Realtime). Already connected to the workspace. |
| Sharing | **Live shared trip via secret link, no logins.** Anyone with the unguessable URL sees + edits the same synced trip. |
| Offline | **Full PWA**: app shell + trip data + **TMB map tiles** cached; edits queue offline and sync on reconnect. |
| Sections | **Two top-level sections:** (1) *Trail & Plan*, (2) *Logistics & Packing*. |
| Gear | **One-time import** from the Notion Gear Checklist, then native in-app. |
| Trail data | **Audited** — apply corrections in `TRAIL_DATA_AUDIT.md` (Phase 5). |
| Hosting / stack | **Keep Vite + React 19 + Tailwind v4 + Leaflet on Vercel.** No framework migration. |

---

## 2. Guardrails (do not violate)

1. **Never lose the saved trip.** The current plan lives only in browser `localStorage['tmb-planner-data']` at the live site and is customized beyond code defaults. Before migrating, capture it (Phase 0) **and** commit a hard-coded fallback seed. The known saved plan is:
   ```json
   { "name": "7-Day Classic", "startDate": "2026-08-05",
     "daySplits": [6, 8, 12, 15, 21, 26, 33], "selectedShortcuts": {}, "useImperial": true }
   ```
   (Day endpoints: Refuge de la Balme → Les Chapieux → Courmayeur → Rifugio Elena → Champex-Lac → Col de Balme → Les Houches End. Differs from code `DEFAULT_DATA` `[6,8,12,15,21,28,33]` / `2026-08-01`.)
2. **Static route data stays in code.** `WAYPOINTS` (in `App.jsx`) and `segmentData.js` are *not* user data — keep them in the bundle so the trail works fully offline. Only **mutable, shared** data (trip settings, gear, bookings, documents, transport, contacts) goes in Supabase.
3. **Preserve current UX**: glassmorphism cards, day cards, shortcut math, imperial/metric toggle, existing Plan/Map/Elevation/Compare views.
4. **Don't commit secrets.** `.env*.local` is already gitignored. Use Vercel + Supabase env vars.

---

## 3. Target architecture

```
React (Vite SPA)  ──HTTPS──>  Supabase
  ├─ react-router-dom         ├─ Postgres (trip-scoped tables, RLS)
  ├─ @supabase/supabase-js    ├─ Storage bucket: trip-files (receipts/docs)
  ├─ Leaflet (+offline tiles) ├─ Realtime (live sync of trip tables)
  ├─ vite-plugin-pwa/Workbox  └─ Edge Function: trip-session (mints trip-scoped JWT)
  └─ IndexedDB (cache + offline write queue)
Static in-bundle: WAYPOINTS, segmentData.js  →  works with zero signal
```

### 3.1 Sharing & security (no logins) — capability URL + scoped JWT
- Each trip row has a random **`share_token`** (use `nanoid`, 21 chars). The share URL is `https://tmb-planner.vercel.app/t/<share_token>`.
- An **Edge Function `trip-session`** takes `{ token }`, looks up the trip with the service-role key, and returns a **short-lived JWT** signed with the project's JWT secret containing claims `{ role: "authenticated", trip_id, exp }`.
- The client attaches that JWT as the Supabase auth token (`supabase.realtime.setAuth(jwt)` + `Authorization: Bearer` header). **RLS policies** then gate every row by `trip_id = (auth.jwt() ->> 'trip_id')::uuid`. This gives capability-URL access (link = the credential) *and* keeps Realtime working.
- Tables are **deny-by-default** to the raw `anon` key; only the scoped JWT can read/write its trip. New-trip creation goes through an Edge Function (`create-trip`) so the `anon` key never needs table insert rights.
- *Fallback if Realtime+RLS proves fiddly:* poll trip tables every 10–15s while the tab is focused. Note this in the brief if used.

### 3.2 Offline-first
- **vite-plugin-pwa** (Workbox): precache the app shell; runtime-cache Supabase GETs `NetworkFirst`, Storage files `CacheFirst`.
- **Local mirror in IndexedDB**: on load, hydrate UI from cache, then refresh from network. All reads tolerate `offline`.
- **Write queue (outbox)**: when offline, enqueue mutations in IndexedDB; replay on `online` / Background Sync. Conflict policy = **last-write-wins by `updated_at`** (acceptable for 2 people; document the caveat).
- **Offline map tiles**: a **"Download offline map"** button pre-fetches tiles for the TMB bbox **lat 45.70–46.06, lng 6.70–7.16, zoom 10–14** into Cache Storage; Leaflet reads cache-first when offline. Use the **[`leaflet.offline`](https://github.com/allartk/leaflet.offline)** plugin or a Workbox route on the tile URL + a warm-up fetch.
  - **Tile provider matters:** OSM's public tiles forbid bulk caching. Use a keyed provider whose terms allow offline use — **Thunderforest "Outdoors"** (hiking-oriented), **MapTiler**, or **Stadia Maps** free tier. Put the URL + key in `VITE_MAP_TILE_URL` / `VITE_MAP_TILE_KEY`.

---

## 4. Database schema (Supabase) — starting SQL

> Apply via the Supabase migration tool. Enable RLS on every trip-scoped table. `gen_random_uuid()` requires `pgcrypto` (on by default in Supabase).

```sql
-- TRIPS (one row per shared itinerary)
create table trips (
  id uuid primary key default gen_random_uuid(),
  share_token text unique not null,
  name text not null default 'TMB 2026',
  start_date date not null,
  day_splits jsonb not null,          -- e.g. [6,8,12,15,21,26,33]
  selected_shortcuts jsonb not null default '{}'::jsonb,
  use_imperial boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table gear_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  category text, name text not null, qty int default 1,
  priority text, status text, packed boolean default false, cost numeric,
  where_to_buy text, notes text, sort int default 0,
  updated_at timestamptz default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  night_date date, place_name text not null, location text,
  type text,                          -- hotel | refuge | gite | lodge
  check_in date, check_out date,
  confirmation_no text, booking_url text, phone text,
  cost numeric, currency text default 'EUR', notes text,
  updated_at timestamptz default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  title text not null,
  kind text,                          -- receipt | ticket | insurance | passport | other
  storage_path text not null,         -- path in 'trip-files' bucket
  booking_id uuid references bookings(id) on delete set null,
  uploaded_at timestamptz default now()
);

create table transport_legs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  day_index int, name text not null,
  type text,                          -- bus | lift | train | taxi | shuttle
  from_place text, to_place text, depart_time text,
  cost numeric, currency text default 'EUR', info text, url text,
  updated_at timestamptz default now()
);

create table safety_contacts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  label text not null, phone text, notes text
);

-- RLS: every trip-scoped table gated by the JWT's trip_id claim
alter table trips enable row level security;
alter table gear_items enable row level security;
alter table bookings enable row level security;
alter table documents enable row level security;
alter table transport_legs enable row level security;
alter table safety_contacts enable row level security;

create policy trip_self on trips
  for all using (id = (auth.jwt() ->> 'trip_id')::uuid)
  with check (id = (auth.jwt() ->> 'trip_id')::uuid);

-- Repeat for child tables, gating on trip_id:
create policy trip_children on gear_items
  for all using (trip_id = (auth.jwt() ->> 'trip_id')::uuid)
  with check (trip_id = (auth.jwt() ->> 'trip_id')::uuid);
-- (… same policy shape for bookings, documents, transport_legs, safety_contacts)
```

**Storage:** create a private bucket `trip-files`. Object path convention `trips/<trip_id>/<uuid>-<filename>`. Add a Storage RLS policy allowing access when the path's first segments resolve to the JWT's `trip_id` (or proxy uploads/downloads through an Edge Function if path-based RLS is awkward).

---

## 5. Phased implementation

### Phase 0 — Preserve & provision (½ day)
- [ ] **Capture the live saved trip**: open the live site, read `localStorage['tmb-planner-data']`, save it to `src/data/savedTripCapture.json`. *(Bryan can have Claude-in-Cowork grab this from his browser and hand it over.)*
- [x] **Done (this session):** fallback trip seed at `src/data/seedTrip.json`; packing seed at `src/data/gearSeed.json` (90 items, 15 categories); raw provenance `src/data/gear-source.notion.csv`.
- [ ] Create/confirm the Supabase project; add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` to `.env.local` and Vercel.
- [ ] `npm i @supabase/supabase-js react-router-dom nanoid idb vite-plugin-pwa leaflet.offline`
- **Acceptance:** app still builds/runs; seed JSON present; Supabase reachable from a throwaway test query.

### Phase 1 — Backend foundation (1 day)
- [ ] Apply the schema migration (§4) + RLS + `trip-files` bucket.
- [ ] Add `src/lib/supabase.js` (client) and Edge Functions `trip-session` (mint JWT) and `create-trip` (insert trip + token, return token+JWT).
- [ ] Seed the canonical trip from `savedTripCapture.json` (fallback `seedTrip.json`) → get its `share_token`.
- **Acceptance:** calling `trip-session` with the token returns a JWT; an authed client can read the trip row; anon (no JWT) cannot.

### Phase 2 — Live state + secret-link sharing (1–2 days)
- [ ] Add routing: `/` (creates or resumes a trip) and `/t/:token` (loads a shared trip). On load, exchange token → JWT → hydrate state.
- [ ] Replace `localStorage` trip state in `App.jsx` with Supabase-backed state (keep IndexedDB as the offline cache, Phase 6). Persist `day_splits`, `selected_shortcuts`, `use_imperial`, `name`, `start_date`.
- [ ] Wire **Realtime** subscriptions on `trips` (+ child tables) so Bryan and Nick see each other's edits live.
- [ ] Replace the existing **snapshot share** (`encodeScenarioForShare`/`?trip=`) with a **"Share live trip"** action that copies `/t/:token`. Keep a one-time importer for any old `?trip=` links.
- [ ] **One-time migration UI**: if `localStorage['tmb-planner-data']` exists and isn't migrated, offer "Import my saved trip" → `create-trip`, then mark migrated.
- **Acceptance:** edit on device A appears on device B within ~1–2s; the saved plan (dates + day splits) matches the screenshot exactly; refresh persists; the old localStorage trip migrates without loss.

### Phase 3 — Restructure into two sections (½–1 day)
- [ ] Add a top-level segmented control: **Trail & Plan** | **Logistics & Packing** (deep-linkable, e.g. `/t/:token/trail`, `/t/:token/logistics`).
- [ ] Move existing **Plan / Map / Elevation / Compare** under *Trail & Plan* as sub-tabs (reuse current `view` logic).
- [ ] Scaffold *Logistics & Packing* with sub-tabs: **Bookings · Packing · Transport · Documents & Safety**.
- **Acceptance:** both sections reachable on desktop + mobile; existing trail views unchanged in behavior.

### Phase 4 — Logistics & Packing modules (2–3 days)
- [ ] **Bookings + receipts**: per-night cards (seed Bryan's 9 nights). Upload receipts/confirmations to `trip-files`; show thumbnails/links; fields per `bookings`. *(Receipts are the headline storage goal.)*
- [ ] **Packing**: gear checklist with packed toggles, grouped by category, a progress bar, and a status filter (Need to Buy / Bought / Not Bringing). **One-time import** from `src/data/gearSeed.json` (90 items; §6).
- [ ] **Transport**: per-day legs seeded from `TRAIL_DATA_AUDIT.md` (the Les Chapieux navette, lifts, PostBus). Editable.
- [ ] **Documents & Safety**: documents vault (tickets/insurance/passports) + emergency contacts & refuge phone numbers; all offline-readable.
- **Acceptance:** upload a receipt offline→online and it persists + syncs to the other device; gear list imported; transport legs show correct 2026 prices/times.

### Phase 5 — Apply trail-data corrections (½ day)
- [ ] Apply every ✅ correction in `TRAIL_DATA_AUDIT.md` §3 to `segmentData.js` (Prarion €18.90; add Bellevue; rewrite Les Chapieux navette €8 + times; Forclaz→Trient PostBus; Flégère/Brévent descent options).
- [ ] Add a header link to live trail conditions (autourdumontblanc.com) and the weather/water/CHF notes (§4–5 of the audit).
- [ ] Add `bookingUrl`/`phone` to refuge entries where known.
- **Acceptance:** spot-check 5 corrected values against the audit; live-conditions link works.

### Phase 6 — Mobile polish + offline PWA (2 days)
- [ ] Add `vite-plugin-pwa` (manifest, icons, installable). Precache app shell.
- [ ] IndexedDB mirror + **offline write queue** with replay on reconnect (last-write-wins by `updated_at`).
- [ ] **"Download offline map"**: warm the TMB bbox tiles (zoom 10–14) into cache via `leaflet.offline`; Leaflet serves cache-first offline. Configure tile provider via env (Thunderforest/MapTiler/Stadia).
- [ ] Mobile pass: verify 44px touch targets, the portal dropdowns, map gestures, and section nav on a phone viewport.
- **Acceptance:** in airplane mode the app opens, shows the plan + map tiles + gear/bookings, accepts edits; edits sync when back online; "Install app" works on iOS/Android.

### Phase 7 — QA, acceptance & deploy (½–1 day)
- [ ] Two-device sync test; offline→online edit/upload test; fresh `/t/:token` load test.
- [ ] Confirm the saved trip is intact and correct.
- [ ] `npm run build` clean; deploy to Vercel; set all env vars in Vercel.
- [ ] Update Notion **Feature Briefs** per `FEATURE_BRIEFS.md` (one brief per new feature: Live Sync, Secret-Link Sharing, Bookings+Receipts, Packing Import, Transport, Documents/Safety, Offline PWA, Offline Maps).
- **Acceptance:** production URL works on mobile, installable, offline-capable, shareable; Feature Briefs updated.

---

## 6. Notion gear import (one-time)

Source: **Notion Gear Checklist** DB (`https://www.notion.so/fe0da907bf864cb28396aa91a195942a`) — fields: item, quantity, priority, packed, cost, where to buy.

Two ways to do it (pick one):
- **A — Seed file (DONE, recommended):** `src/data/gearSeed.json` already holds all **90 items** (raw CSV kept as `gear-source.notion.csv`). 17 items lacked a Notion category and were given inferred ones (`category_inferred: true`) — adjustable in-app. Claude Code bulk-inserts `items[]` into `gear_items` in `create-trip`; map each item's `status` → the new `status` column.
- **B — Notion API:** Claude Code fetches once via the Notion API using `NOTION_TOKEN` + the data-source ID, mapping properties → `gear_items`. Use only if you want re-runnable imports.

After import, gear is **native in-app** (edits don't push back to Notion).

---

## 7. Environment variables

| Var | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | client + Vercel | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | client + Vercel | anon key (RLS-gated) |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions only | token lookup / trip creation |
| `SUPABASE_JWT_SECRET` | Edge Functions only | sign trip-scoped JWTs |
| `VITE_MAP_TILE_URL` | client + Vercel | offline-friendly tile template |
| `VITE_MAP_TILE_KEY` | client + Vercel | tile provider API key |
| `NOTION_TOKEN` | local only (import B) | optional one-time gear import |
| `VERCEL_OIDC_TOKEN` | existing | deploy auth (unchanged) |

---

## 8. Risks & open decisions

- **No-login security = link is the password.** Anyone with `/t/:token` can edit. Acceptable for a private 2-person trip; mitigate with a long token and an optional "rotate link" action. If stronger control is wanted later, add light email/Google auth (the schema already supports adding a `members` table).
- **Offline conflict resolution** is last-write-wins; fine for two people rarely editing the same field offline. Note it; revisit if it bites.
- **Tile licensing**: must use a provider that permits caching (don't bulk-cache OSM public tiles).
- **Realtime + RLS with a custom JWT** can be finicky — fall back to polling (§3.1) if needed and record it in the Feature Brief.
- **Verify-before-departure items** live in `TRAIL_DATA_AUDIT.md` §7.

---

## 9. Suggested commit sequence
`feat: supabase client + schema` → `feat: trip-session edge fn + RLS` → `feat: live trip state + realtime` → `feat: secret-link sharing + migration` → `feat: two-section nav` → `feat: bookings + receipts` → `feat: packing import` → `feat: transport + audit data` → `feat: documents + safety` → `feat: PWA offline + offline maps` → `chore: QA + deploy`.
