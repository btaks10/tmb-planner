# Redesign: "Alpine Poster" trail-guide UI — deploy app-wide

**Owner:** Primary agent (you own `App.jsx` + components). **Reference:** open `design/mockup.html` — that's the exact target (desktop + a mobile frame). `design/mockup-v1-calmer.html` is a calmer variant for comparison; **build to `mockup.html`**.

**Goal:** replace the current glassmorphism / dark-slate-gradient / rainbow-day-color look with the trail-guide "alpine poster" system, across the whole app, desktop + mobile. **This is a styling + structure pass — do NOT change data hooks, Supabase wiring, the offline layer, sharing, receipts, or trip math.** Everything keeps working.

---

## 1. Design tokens

**Fonts** — add to `index.html` `<head>` (Google Fonts): `Anton`, `Oswald` (500/600/700), `Archivo` (400/500/600). Map them:
- `--font-poster: 'Anton'` — hero headline
- `--font-display: 'Oswald'` — routes, stats, labels, nav (condensed, uppercase)
- `--font-body: 'Archivo'` — body copy

**Colors** (Tailwind v4 is CSS-first — add these via `@theme` in `src/index.css`, so `bg-tmb-pine`, `text-tmb-ink`, etc. auto-generate; the legacy `tailwind.config.js` is mostly ignored in v4):
```
pine #1c3a2a · forest #2e5039 · moss #6b8c54 · gold #e3a93c · amber #cf7d2c
rust #a83f24 · clay #bf6334 · cream #f6eedd · paper #fffaef · kraft #e9d8b4
ink #2a2720 · muted #7a6e52 · line #dcc699 · line2 #ece0c2
```
**Stage accent rotation** (replace the rainbow `DAY_COLORS`): `[pine, forest, moss, amber, clay, rust, gold]` — cycle per day. Earthy, never neon.

Radius: cards ~13px, medallions circular. Soft shadows are allowed (this is the real app, not the chat widget) — keep them subtle.

> **Fastest path:** redefine the shared `GlassCard` component and the `DAY_COLORS` array *in place* with the new styles, so every consumer updates at once — then fine-tune individual surfaces. Search for `backdrop-blur`, `bg-white/5`, `bg-gradient-to`, `from-emerald`, `slate-9` and replace systematically.

## 2. App shell + hero
- Background: **cream** (`--cream`) with a faint **topographic contour** texture (subtle, low-opacity SVG/CSS) — not the dark slate gradient.
- **Alpine hero header** (port the SVG from `design/mockup.html`): layered mountain ridgelines, sunrise sky (dawn-blue → pine → amber → gold), sun disc, snow caps, grain. Overlay: kicker (countries), `Anton` title "Tour du Mont Blanc", subtitle "Aug 2–11", and the circular **route stamp** ("TMB · 2026 · 7 days").
- **Stat ribbon** under the hero (pine bg): 170 km · 10K climb · 7 trail days · 8 refuges.

## 3. Two-section nav
- Keep **Trail & Plan** / **Logistics & Packing**. Style as letterpress tabs: `Oswald` uppercase, kraft bar, **rust** underline on active.

## 4. Day cards (the core)
Restyle `ExpandableDayCard` to match the mockup:
- A dashed **trail line** runs down the itinerary; a circular **day medallion** (Oswald number, stage-color fill, cream ring, soft shadow) sits on the line.
- Card = header strip (route `start → end` in Oswald + date) → body with **stat chips** (Dist / ↑Ascent / ↓Descent / Time; hairline dividers; **moss** for ascent, **rust** for descent) → a **filled mini elevation profile** (area chart) → a **refuge/stay tag** (hut icon + accommodation name + "Booked" pill).
- **Elevation profiles must be generated from real waypoint altitudes** for each day's segment — the mockup's paths are placeholders.
- Preserve ALL existing behavior: expand/collapse, endpoint dropdown, shortcuts math, imperial/metric toggle, add/remove day.

## 5. Trip spans Barcelona → Barcelona (Aug 2–11)
Render non-hiking **bookend entries** in the itinerary, derived from the bookings already tagged `phase`:
- `arrival` (Hotel Le Chamonix, Aug 2–4) → a **Travel** card (Aug 2, Barcelona → Chamonix, plane icon) + a **Rest & acclimatize** card (Aug 3–4, sun icon). No hike stats — show the stay + a short note.
- `stage` → the 7 hiking days, numbering **unchanged (1–7)**.
- `departure` → a **Return** card (Aug 11, Chamonix → Barcelona) with the flight as a "to add" slot.
- Trip's displayed date range / header = earliest booking check-in (Aug 2) → latest checkout (Aug 11). Bookends are labeled by purpose, **not numbered**. Don't touch the waypoint/segment logic — bookends are presentational entries around it.

## 6. Restyle everything else to match
- **Map view:** full-bleed; restyle controls/markers to the palette; keep Leaflet + offline tiles.
- **Elevation view, Compare view, Journey Summary table:** same tokens (cream/paper surfaces, Oswald headers, moss/rust accents).
- **Logistics tabs** (`PackingTab`, `TransportTab`, `DocumentsSafetyTab`): cards, badges, progress bars, category headers in the new system; hut/transport icons.
- **Modals (Share, etc.), dropdowns, toasts:** repaint to the palette.

## 7. Mobile
- **Bottom tab bar** (thumb-reachable): Trail / Map / Gear / Logistics with icons; active = rust. Replaces top tabs on mobile.
- Full-bleed map; **sticky day header**; condensed stat chips; swipe between days (nice-to-have).
- **Safe-area insets** (`env(safe-area-inset-*)`) for notch/home bar; 44px+ touch targets.
- Keep the PWA install prompt; set `theme-color` to pine.

## Guardrails
- Styling/structure only — no changes to data hooks, Supabase, offline, sharing, receipts, or trip math.
- You're the sole `App.jsx` editor. **Tell QA when done** — class/snapshot-based tests will need updating; that's QA's lane, not yours.
- Keep contrast/accessibility: cream + ink is strong; for text on colored fills use a dark-enough shade of that hue; maintain focus states.
- Commit logically: `tokens` → `shell + hero` → `day cards + trail line` → `Aug 2–11 bookends` → `logistics tabs` → `map/elevation/compare` → `mobile nav`. Keep `design/mockup.html` in the repo as the reference.

## Acceptance
- App visually matches `design/mockup.html` on desktop **and** mobile.
- Zero glassmorphism, zero dark-slate gradient, zero rainbow day colors left anywhere.
- Trip shows the full **Aug 2–11** arc with Travel / Rest / Return bookends; hike days still 1–7.
- All features still work: sharing link, receipts on day cards, packing, transport, documents, offline, map.
- `npm run build` green; tests updated and green (coordinate with QA).
