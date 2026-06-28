# Sprint: Lodging modal + polish pass

**Owner:** Primary (you own `App.jsx` + components). Run with **QA paused** (this touches App.jsx broadly); QA updates tests after. Styling/structure/UI only — **do not change trip math, Supabase, the offline layer, sharing, or receipts ingestion.** Match the look in `design/mockup.html`.

---

## 1. Lodging → booking modal (+ upload/remove docs, + "in progress" state)
- Make the **stay/lodging tag on every itinerary card** (Travel, Rest, the 7 hike days, Return) a button that opens a **modal** with that booking's details. Data exists via `useBookings` (place_name, type, location, check_in/out, status, confirmation_no, pin, cost, currency, phone, booking_url, notes) and the linked `documents` (by `booking_id`).
- Modal contents: header (place, type, status pill, location) · dates + nights · confirmation # + PIN · cost + currency · phone (`tel:`) · booking link · notes · **attached documents** as thumbnails → view full-size via signed URL (reuse the viewer in `DocumentsSafetyTab`).
- **Upload document** AND **remove document** controls in the modal (add to / delete from `trip-files` Storage + the `documents` row).
- **"In progress" when info is missing:** if a booking has no documents and/or missing key fields (e.g. the Lykke receipt, or the return flight), show an **"In progress" / "Needs info"** state in the modal (with an upload/add prompt) **and** swap the card's stay-tag pill from "Booked" to a muted **"In progress"** badge. (So incomplete items are visually obvious.)
- Reuse the `ShareModal` scaffold (focus trap, Esc, click-outside). Style in the alpine-poster system. On mobile: bottom sheet / full-screen, safe-area insets, 44px targets. `stopPropagation` so opening the modal doesn't toggle the card's expand.

## 2. Contrast fixes — text on dark fills (Images 1 & 2)
- **Stat ribbon** (165 km · 9K m climb · 7 trail days · 7 refuges): the numbers are dark rust on dark pine — unreadable. Use **cream/gold** numbers on the pine bar.
- **Trip pill "TMB 2026"**: dark text on the pine pill — unreadable. Lighten to cream/gold.
- General: audit all text-on-colored-fill for **WCAG AA** contrast — no dark-on-dark anywhere.

## 3. Fix the blank Map view (Image 3)
- It's a client-side failure (no server errors in Vercel). Reproduce locally (`npm run dev` → Map tab), read the **browser console** for the real error, and fix it.
- **Add an error boundary** around the Map view so a map failure degrades to a friendly message instead of a white screen.
- **Verify `VITE_MAP_TILE_URL` / `VITE_MAP_TILE_KEY` are set in Vercel project env** (they exist in local `.env.local` but are likely missing in prod — a common cause). Also confirm the Leaflet container has a non-zero height and Leaflet CSS is imported.

## 4. Tuck away Compare + Add-new-trip
- Hide/remove the **Compare** view and the **"+" add-trip** control (and any new-scenario UI). Single-trip focus now. (Keep the code paths if trivial, but they shouldn't be reachable in the UI.)

## 5. Logistics medallion colors match the Trail tab (Image 4)
- The numbered medallions in the Logistics/itinerary list are all green. Map each to the **same per-day accent color and number used on the Trail tab** (the earthy stage rotation `[pine, forest, moss, amber, clay, rust, gold]` by day index). Day N must look identical across both tabs.

## 6. Cost summary → bottom + itemized toggle
- Move the cost summary to the **bottom of the page**.
- Make it an **itemized breakdown inside a toggle** (collapsed by default; expand to show line items — lodging per night, transport legs, etc., with per-currency subtotals EUR + CHF and a grand total).

## 7. Transport — load everything required (not just Prarion)
Populate the Transport section comprehensively from the trip's `selected_shortcuts` + `TRAIL_DATA_AUDIT.md` + the bookings:
- **Selected shortcuts (4 currently chosen)** — surface all of them as committed transport:
  - `Téléphérique du Prarion` (Day 1, Les Houches → Col de Voza)
  - `Bus from Ferret` (Swiss side)
  - `PostBus La Fouly → Champex`
  - `Train to Chamonix / Les Houches` (final day)
- **Flights:** Barcelona → Geneva (outbound, Aug 2) and Geneva → Barcelona (return, Aug 11) — show as legs; mark "to add" until booked.
- **Geneva airport transfers** both ends (Geneva ⇄ Chamonix).
- **Les Chapieux ↔ Bourg-St-Maurice navette** (Day 2/3 hinge; €8, times from the audit).
- Pull prices/times from `TRAIL_DATA_AUDIT.md`; anything unbooked → "to add" state. Keep transport legs editable.

---

## Guardrails
- UI/structure only — no changes to trip math, Supabase schema, offline layer, sharing, or receipts ingestion.
- Primary is sole `App.jsx` editor; run with QA paused. When done, tell QA to update class/snapshot tests + add: booking-modal opens with fields + a document, upload/remove doc, and the "in progress" state.
- Keep everything working: sharing link, receipts, packing, transport, documents, offline, map.
- Commit logically per item.

## Acceptance
- Clicking any lodging tag opens a styled modal with that booking's info + receipts; upload and remove both work; bookings with missing info show "in progress" (card + modal).
- Stat ribbon and trip pill text are clearly readable (AA).
- Map view renders (and never white-screens — error boundary in place); tile env confirmed in Vercel.
- Compare + add-trip are gone from the UI.
- Logistics medallions match the Trail tab's day colors/numbers exactly.
- Cost summary sits at the bottom, collapsed, expands to an itemized EUR+CHF breakdown.
- Transport lists all 4 selected shortcuts + flights + Geneva transfers + the Les Chapieux navette.
- `npm run build` green; tests updated (with QA).
