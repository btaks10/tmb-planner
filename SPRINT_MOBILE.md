# Sprint: Mobile + map polish

**Owner:** Primary (`App.jsx`). UI/behavior only — no data-model changes. Desktop (md+) unchanged unless noted. Reproduce mobile items at a **375px viewport** on the real `/t/<token>` URL. Run solo (QA paused); commit each item separately.

---

## 1. Reclaim space in the itinerary day list (mobile)
The left gutter (day medallion ~line 1962 + the dashed trail line) eats ~20% of width and truncates route names (~line 1203). The important content is the route + the expand/endpoint toggle.
- **Hide the dashed trail line on mobile** (keep desktop). Section headers + the card stack already convey sequence.
- **Replace the 44px medallion-in-a-gutter** with a thin **left border in the day's accent color** + a small **inline day chip** in the header ("1" badge or "DAY 1" caption) before the route. Keep the full medallion + trail line on desktop.
- **Full-width cards on mobile** so route names stop truncating; the start→end + endpoint dropdown + stat chips get the space.
- Keep the collapsed row a large tap target; endpoint dropdown stays prominent and ≥44px tappable. Tighten mobile vertical padding.

## 2. Fix: no bookings show on mobile
Bookings render on desktop but not mobile. Check in order:
1. **Trip identity (most likely).** The mobile bottom-nav `navigate()` (line ~4666) preserves the share token only `if (urlToken)` — bare URL loads a different/empty trip → no bookings. Make the token persist across all mobile navigation, and have the bare URL resolve to the saved trip. Confirm mobile + desktop are on the same trip (`171eb249…`).
2. **Data/auth.** Confirm `useBookings` actually loads on mobile (token→JWT exchange + fetch succeed), not just an empty array.
3. **Layout clipping.** Ensure cards aren't hidden behind the **fixed bottom nav** (line ~4650) — add bottom padding (`pb` + `env(safe-area-inset-bottom)`); check for zero-height grids / overflow clipping.

## 3. Remove the scenario selector from the UI
The scenario/trip-name pill (e.g. "TMB 2026" — the `activeScenario.name` pill ~line 3806, plus the scenario switcher ~line 3687, near the KM/MI + Share toolbar above the itinerary) takes prominent space, especially on mobile, and is redundant now (single trip; Compare + add-scenario already removed).
- **Remove the scenario selector/pill from the UI** (at least on mobile; fine to remove on desktop too). Keep the single active trip/scenario working — this is purely removing the selector chrome. The trip name can live in the hero header instead.

## 4. POI icons on the map pins (DayMap + Route Map)
Make the map readable without the legend by putting the type icon on each pin.
- Replace the plain colored CircleMarkers with Leaflet **divIcon** markers: a colored circle in the type's accent color containing that type's icon (Camera = sight, Utensils/Home = food/refuge, Droplet = water, Zap/CableCar = shortcut). Keep the Start/End endpoint markers.
- Drive **both** pin color and icon from the single `poi-type → { color, icon, label }` map (one source of truth, already created for the legend).
- Keep markers tappable with the same popups; keep the glyph legible on the colored circle (white or dark-enough icon per color).
- Slim the legend to just **Start/End** (or remove it) — the per-type rows are now redundant.

## Guardrails
- UI/behavior only; Primary owns `App.jsx`; run solo with QA paused; commit each item separately.

## Acceptance
- Mobile day list: no route-name truncation at 375px; each day identifiable by chip + accent color; trail line/medallion gone on mobile, intact on desktop.
- Bookings render on mobile on the shared `/t/<token>` trip (same data as desktop); not clipped behind the bottom nav.
- Scenario selector/pill no longer shown (mobile at least); the single trip still works.
- Every POI pin shows its type icon; legend reduced to Start/End or removed.
- QA: tests for bookings-visible-on-mobile, no truncation at 375px, and POI pin icons.
