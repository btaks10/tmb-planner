# Sprint: Per-day maps

**Owner:** Primary (`App.jsx` + components). UI-only — no data-model changes. Match the alpine-poster styling. **Depends on:** the map crash fix (`skipsToWaypoint`) landing first, and ideally items 8 (from-start distance/time) + 9 (water) from `SPRINT_LODGING_POLISH.md`, which this reuses.

**Goal:** give every hiking day its own map that plots that day's route and **all the spots along the way** (sights, food/refuges, shortcuts, water), reusing the existing Leaflet map, tile layer, and offline cache.

---

## 1. DayMap component
Add `<DayMap dayIndex={i} />`, shown inside each hiking day's expanded card as a new **"Map" sub-tab** (alongside Segments / Sights / Food / Shortcuts / Water). It renders:
- **The day's route** — polyline of that day's waypoints (start → end), in the day's accent color (reuse the `daySegments` geometry, scoped to this one day).
- **Start & end markers** — the day's starting waypoint and its end/accommodation, labeled.
- **All POIs along the day**, each with its type icon (match the list views):
  - **Sights** → use the explicit `coordinates` in the data.
  - **Food/refuges, shortcuts, water** → **interpolate lat/lng from `position`** between the segment's bounding waypoints: `lat = fromWp.lat + position·(toWp.lat − fromWp.lat)` (same for lng). Add a shared helper `poiLatLng(item, fromWp, toWp)`.
- **Auto-fit bounds** to the day's route + its POIs.
- **Tap a POI →** popup with name, type, the **"≈ X km · Y h from [day start]"** (reuse item 8's calc), a short description, and the potable flag for water. Respect the imperial/metric toggle.
- **Tiles:** reuse the app's tile config (Thunderforest → OSM fallback) and the **offline tile cache** so day maps work offline too.

## 2. Performance & reliability (multiple maps — important)
- **Lazy-mount:** instantiate a DayMap only when its day is expanded **and** its Map tab is active; unmount on collapse / tab-switch. Never have 7+ live Leaflet instances at once (also avoids the "map container already initialized" error).
- Reuse the **defensive POI resolution** from the crash fix — skip any POI whose coordinates can't resolve; one bad item must never crash the map. Wrap each DayMap in the existing `MapErrorBoundary`.
- Give each DayMap a stable unique container key/id.

## 3. Bookend days (Travel / Rest / Return)
No trail route — show a **single location pin** (Chamonix for Travel/Rest; Geneva↔Barcelona for Return) + the accommodation marker, or omit the map. Do **not** draw a route polyline for these.

## 4. Consistency
- Alpine-poster styling: palette, per-day accent colors, Oswald labels in popups; icons consistent with the Sights/Food/Water/Shortcut list views.

## Guardrails
- Land the `skipsToWaypoint` map fix first; reuse existing tile/offline/POI logic — don't duplicate it.
- UI-only; Primary owns `App.jsx`; commit scoped; run solo with QA paused, then have QA add tests.

## Acceptance
- Expanding a hiking day → **Map** tab shows that day's route + start/end + all its sights/food/water/shortcut POIs, auto-fitted.
- Food/water/shortcut POIs interpolate from `position`; sights use their coordinates; popups show the from-start distance/time.
- Only one DayMap is mounted at a time; malformed POIs are skipped (no crash); it works offline on cached tiles.
- Bookend days show a simple pin, not a broken route.
