# Claude Code — kickoff prompt for TMB Planner

> Copy everything in the block below into Claude Code from inside `~/Desktop/tmb-planner`.

---

You're working on the **TMB Planner** app at `~/Desktop/tmb-planner` (React 19 + Vite + Tailwind v4 + Leaflet, deployed on Vercel). I want to upgrade it from a single-user localStorage tool into a **live, shareable, offline** trip app for me and my hiking partner Nick.

**Read these first, in full, before writing any code:**
1. `BUILD_PLAN.md` — the phased implementation plan: architecture, Supabase schema, phases, and acceptance criteria. Follow it in order.
2. `TRAIL_DATA_AUDIT.md` — verified 2026 trail/transport corrections to apply in Phase 5.
3. `TESTING.md` — the QA & test program; write and run tests per phase as you build.

**Data already prepared for you (`src/data/`):**
- `gearSeed.json` — my packing list, **90 items** with category/priority/status/cost. Use it for the Phase 4 packing import.
- `seedTrip.json` — fallback of my saved itinerary (start Aug 5, day splits `[6,8,12,15,21,26,33]`, imperial). **Guardrail: never lose this.**
- `gear-source.notion.csv` — raw provenance; don't edit.

**Hard guardrails (do not violate):**
- Do NOT lose my saved trip. Use `seedTrip.json` as the fallback; when I paste the real localStorage capture, prefer it.
- Keep Vite + React + Tailwind + Leaflet on Vercel — no framework migration.
- Preserve the existing UX: glass cards, day cards, shortcut math, imperial/metric toggle, and the Plan / Map / Elevation / Compare views.
- Keep static route data (`WAYPOINTS` in `App.jsx`, `segmentData.js`) in the bundle so the trail works fully offline. Only mutable/shared data goes to Supabase.
- Never commit secrets; use env vars.

**How to work:**
- Go phase by phase from `BUILD_PLAN.md`. Do **Phase 0 → Phase 2**, then **pause** and tell me exactly how to test live sync + the secret share link before continuing.
- After each phase: run `npm run dev`, verify that phase's acceptance criteria, then commit using the message from `BUILD_PLAN.md` §9.
- Before anything destructive (DB migrations, deleting/replacing big chunks of code), show me the plan/diff and wait for my OK.
- When in doubt, ask me one focused question instead of guessing.
- **Test as you build:** for each phase add the unit/component/E2E tests from `TESTING.md`, and keep the Must-Not-Break suite (§9) green before moving on.

**What I need to give you — ask me for these now, with instructions on where to find each:**
- Supabase: project URL, anon key, service-role key, and JWT secret (for the `trip-session` edge function).
- A map-tile provider API key for offline maps — recommend one of Thunderforest / MapTiler / Stadia and tell me how to get a free key.
- The real `localStorage['tmb-planner-data']` value from the live site (I'll paste it).

**To start:** read the two docs + the three seed files, give me a short summary of the plan as you understand it, list the exact env values you need from me, and propose your Phase 0 steps. Don't write code until I confirm. At the end of the session, follow `FEATURE_BRIEFS.md` to log what you built.
