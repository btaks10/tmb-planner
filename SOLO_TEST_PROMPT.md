# Solo CC — comprehensive test-setup prompt

> Paste the block below into the Solo Claude Code agent (running in `~/Desktop/tmb-planner`).
> It's self-contained; the referenced docs are already in this folder.

---

You're working in the **TMB Planner** repo (`~/Desktop/tmb-planner` — React 19 + Vite + Tailwind v4 + Leaflet; Supabase backend is being added; deployed on Vercel). Your entire job this session is to **stand up the automated test program and write the first real tests.** Work only on tests, test infrastructure, and the testability refactor — do not change app features or behavior.

**Read these first (all present in this folder):**
- `TESTING.md` — the QA program: tooling, per-phase acceptance matrix, the Must-Not-Break suite, fixtures.
- `TEST_INFRA_PROMPT.md` — the exact infra runbook: dependencies, full config-file contents, CI, smoke tests.
- `BUILD_PLAN.md` — context on the architecture, phases, and guardrails (skim).
- `FEATURE_BRIEFS.md` — the end-of-session documentation rule.

**Do this, in order:**

1. **Scaffold the harness** — execute `TEST_INFRA_PROMPT.md` Steps 1–5 and 7 exactly: install Vitest + @vitest/coverage-v8 + jsdom + React Testing Library + user-event + MSW + Playwright + axe; create `vitest.config.js`, `tests/setup.js`, `tests/msw/{handlers,server}.js`, `playwright.config.js`, `tests/fixtures/savedTrip.legacy.json`, `tests/unit/smoke.test.js`, `e2e/smoke.spec.js`; add the `package.json` scripts; update `.gitignore`; add `.github/workflows/ci.yml`.

2. **Testability refactor** (`TEST_INFRA_PROMPT.md` Step 6) — extract the pure helpers out of `src/App.jsx` into `src/lib/`, importing them back with **no behavior change**:
   - `src/lib/format.js` → `formatTime`, `formatDistance`, `formatDistanceValue`, `formatElevation`, `formatElevationValue`, `getDistanceUnit`, `getElevationUnit`, `KM_TO_MI`, `M_TO_FT`
   - `src/lib/share.js` → `encodeScenarioForShare`, `decodeScenarioFromUrl`, token generator
   - `src/lib/itinerary.js` → per-day distance/ascent/descent/time + shortcut-savings aggregation
   - `src/lib/migrate.js` → legacy `localStorage` → trip-object mapping
   - **Guard:** if another agent is actively editing `App.jsx` right now, pause it first or skip this step and tell me — don't fight a concurrent editor.

3. **Real unit tests** (`TESTING.md` §5) for those modules: time/unit conversions; day + whole-trip math against `WAYPOINTS` (sanity bounds ~165 km / ~8,600 m↑ / ~9,960 m↓ on default splits); shortcut savings never go negative; share `decode(encode(x)) === x` + safe fallback on bad input; migration from `tests/fixtures/savedTrip.legacy.json` yields identical `daySplits`/`startDate`/`selectedShortcuts`. **Target ≥ 80% coverage on `src/lib/`.**

4. **Core E2E** (`TESTING.md` §7): implement **#1 saved-trip migration (must-not-lose)** and **#10 sharing isolation (negative — a wrong token can't read another trip)**. Stub #2–#9 as `test.skip` with TODO comments so the full suite is mapped.

5. **DB-dependent tests** use a **separate Supabase test project** via `.env.test.local` — never prod. If those keys aren't present, ask me for them before writing DB-touching tests.

**Guardrails:**
- Don't revert or "clean up" uncommitted feature work from the build — write tests around the current code.
- Never commit secrets; keep test creds in `.env.test.local`.
- Keep existing app behavior identical (the refactor is a move, not a rewrite).

**Acceptance before you stop:**
- `npm run lint` clean; `npm run test` green (smoke + lib unit tests, ≥ 80% lib coverage); `npm run e2e` green (migration + isolation passing, others skipped).
- Commit: `test: scaffold harness + lib refactor + core unit/e2e`.
- Update the relevant Feature Brief per `FEATURE_BRIEFS.md`.

Then summarize what you built and which **Must-Not-Break** items (TESTING.md §9) are now covered vs. still stubbed.
