# TMB Planner — QA & Test Program

**Companion to:** `BUILD_PLAN.md` (phases + acceptance criteria) and `TRAIL_DATA_AUDIT.md` (data corrections).
**Drafted:** 2026-06-27.

This is the test plan the build follows. **Claude Code** writes/runs the automated tests *per phase* (tests ship with the feature on the same branch). A separate reviewer (Cowork/Claude) verifies diffs against the per-phase matrix and runs Supabase security advisors independently. Don't start a parallel test agent on the same branch — it causes conflicts and churn.

---

## 1. Philosophy

- **Test pyramid:** many fast unit tests on pure logic → fewer component tests → a focused set of E2E flows for the things that can only be verified end-to-end (sync, offline, uploads, migration).
- **Automate the regressions that would ruin the trip** (the *Must-Not-Break* suite, §9). Everything else is best-effort.
- **A test ships with its feature.** No phase is "done" until its acceptance tests are green (§8).
- Don't chase coverage % on UI; chase **critical-path E2E** + high coverage on pure logic.

---

## 2. Tooling

| Layer | Tool | Why |
|---|---|---|
| Unit / integration runner | **Vitest** | Vite-native, fast, same config as the app |
| Component tests | **React Testing Library** + `@testing-library/user-event` | user-centric DOM assertions |
| Network mocking | **MSW** (Mock Service Worker) | mock Supabase REST/Storage without a live DB |
| E2E | **Playwright** | multi-context (live sync), offline emulation, PWA, mobile viewports |
| Coverage | `@vitest/coverage-v8` | logic coverage gate |
| A11y | `@axe-core/playwright` | catch obvious accessibility breaks |
| PWA/perf | Playwright + **Lighthouse** (CI) | installability, offline shell, perf budget |

Install:
```bash
npm i -D vitest @vitest/coverage-v8 jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  msw @playwright/test @axe-core/playwright
npx playwright install --with-deps
```

`package.json` scripts:
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:cov": "vitest run --coverage",
  "e2e": "playwright test",
  "e2e:ui": "playwright test --ui"
}
```

---

## 3. Layout & conventions

```
src/
  lib/                # ← extract pure logic here so it's unit-testable
    format.js         # formatTime, formatDistance(Value), formatElevation(Value), unit helpers
    itinerary.js      # day aggregation, shortcut savings math, totals
    share.js          # encode/decode share payload, token generation
    migrate.js        # localStorage → trip object mapping
  __tests__/          # *.test.js(x) co-located or here
e2e/                  # Playwright specs (*.spec.js)
tests/fixtures/       # seed payloads, sample receipt image, mock Supabase handlers
```

> **Testability refactor (do this in Phase 1):** the helpers `formatTime`, `formatDistance(Value)`, `formatElevation(Value)`, `getDistanceUnit/getElevationUnit`, `encodeScenarioForShare`, `decodeScenarioFromUrl`, and the day-savings aggregation are currently defined **inside `App.jsx`** and aren't exported. Extract them to `src/lib/*` and import back into `App.jsx`. No behavior change, but it makes the core math unit-testable.

---

## 4. Test data & environments

- **Unit/component:** no network — mock Supabase with **MSW**. Use fixtures in `tests/fixtures/`.
- **Integration/E2E:** use a **dedicated Supabase test project** (or local `supabase start`) — never prod. Store its URL/keys as CI secrets and in `.env.test.local`.
- **Per-run isolation:** each E2E run creates its own trip (fresh `share_token`) and **tears it down** after (delete the trip; `on delete cascade` clears children + Storage objects via a cleanup hook).
- **Golden fixture:** `tests/fixtures/savedTrip.legacy.json` = the exact legacy `localStorage` shape (name `7-Day Classic`, `days:[6,8,12,15,21,26,33]`, start `2026-08-05`) used to prove migration.

---

## 5. Unit tests (pure logic)

- **format.js**
  - `formatTime(150) === "2h 30m"`, `formatTime(120) === "2h"`, `formatTime(0) === "0h"`.
  - km→mi: `formatDistanceValue(10, true) === "6.2"`; m→ft: `formatElevationValue(1000, true) === 3281`.
  - unit suffix helpers return `mi/km`, `ft/m` correctly.
- **itinerary.js**
  - day distance/ascent/descent/time computed from `WAYPOINTS` deltas match expected for known splits.
  - **shortcut savings** subtract correctly (time/distance/ascent/descent) and never produce negative totals.
  - whole-trip totals = sum of days; with default splits totals ≈ 165 km / ~8,600 m ascent / ~9,960 m descent (sanity bounds).
- **share.js**
  - `decode(encode(x)) === x` round-trip; malformed input → safe fallback (no throw).
  - token generator: length ≥ 21, URL-safe, collision-free across 10k samples.
- **migrate.js**
  - legacy fixture → trip object with identical `daySplits`, `startDate`, `selectedShortcuts`, `useImperial`.

**Gate:** ≥ 80% line coverage on `src/lib/`.

---

## 6. Component tests (RTL)

- **Day card**: renders day number/date/route; changing the end-point dropdown calls `updateDay`; delete asks confirm then removes.
- **Shortcut toggle**: toggling updates the displayed adjusted stats and shows the savings row.
- **Imperial/metric toggle**: flips all visible units.
- **Gear checklist**: renders 90 items grouped into 15 categories; status filter (Need to Buy / Bought / Not Bringing) filters; packed toggle updates progress.
- **Bookings**: shows night cards; receipt picker accepts a file and lists it.
- **Empty/error states**: offline banner shows when `navigator.onLine === false`; failed load shows retry, not a blank screen.

---

## 7. Integration & E2E (Playwright) — critical paths

> These are the flows that matter. Each is a numbered spec in `e2e/`.

1. **Saved-trip migration (MUST-NOT-LOSE).** Seed `localStorage` with the legacy fixture → load app → a Supabase trip exists with identical name/startDate/daySplits/shortcuts → reload → same trip → the 7 day-endpoints equal `[Refuge de la Balme, Les Chapieux, Courmayeur, Rifugio Elena, Champex-Lac, Col de Balme, Les Houches (End)]`.
2. **Secret-link live sync.** Two browser contexts open the same `/t/:token`; edit in A (move a day end-point + toggle a shortcut) → appears in B within ~2 s.
3. **Offline edit → reconnect.** Context goes offline; toggle gear packed + edit a booking; reload offline shows the edits from cache; go online → edits persist to server and propagate to a second context.
4. **Receipt upload offline → online.** Attach a receipt while offline (queued) → reconnect → file appears in Storage and on the other device; thumbnail/link renders.
5. **PWA installable + offline shell.** SW registers; manifest valid; in offline mode the app opens and shows Plan + Gear + Bookings (no white screen).
6. **Offline map tiles.** Tap "Download offline map" → go offline → Leaflet still renders TMB-bbox tiles (zoom 10–14); no broken-tile errors.
7. **Gear import.** Fresh trip seeds 90 gear items, 15 categories; counts match `gearSeed.json`.
8. **Trail-data corrections.** Spot-check rendered values from the audit: Les Chapieux navette €8 with 17:20/17:50/18:20 + 06:45 morning; Prarion €18.90; Flégère/Brévent descent options present on the final stage.
9. **Two-section navigation + deep links.** `/t/:token/trail` and `/t/:token/logistics` load the right section on desktop + a mobile viewport.
10. **Sharing security (negative).** A random/invalid token cannot read or write another trip's rows (RLS denies); tampering with the JWT `trip_id` claim is rejected.

---

## 8. Per-phase acceptance test matrix

| Phase | Must pass before "done" |
|---|---|
| 0 — Preserve & provision | seeds present; `migrate.js` unit test green; app still builds |
| 1 — Backend foundation | `trip-session` returns a JWT for a valid token; authed read works; **anon read denied** (E2E #10) |
| 2 — Live state + sharing | E2E #1 (migration), #2 (live sync); reload persists |
| 3 — Two sections | E2E #9; existing trail views unchanged (component tests still green) |
| 4 — Logistics modules | E2E #3, #4, #7; bookings/receipt component tests |
| 5 — Trail data | E2E #8; itinerary unit tests still green after data edits |
| 6 — Offline PWA | E2E #5, #6; Lighthouse PWA pass; offline shell |
| 7 — QA & deploy | full suite green in CI; Supabase advisors clean; manual checklist (§10) done |

---

## 9. Must-Not-Break regression suite

Run on **every** push. If any fail, stop and fix before merging:

- [ ] Saved trip migrates with identical data (E2E #1)
- [ ] Live sync delivers edits across two sessions (E2E #2)
- [ ] Offline edits don't get lost — they queue and sync (E2E #3)
- [ ] Receipts uploaded offline survive reconnect (E2E #4)
- [ ] App opens offline (E2E #5) and map tiles render offline (E2E #6)
- [ ] One trip's token can't access another trip's data (E2E #10)
- [ ] Shortcut math + unit conversions correct (unit suite)

---

## 10. Manual QA checklist (the stuff automation can't feel)

**Devices:** test on a real iPhone (Safari) and an Android (Chrome).

- [ ] iOS "Add to Home Screen" installs; launches full-screen; opens offline
- [ ] Android "Install app" works; opens offline
- [ ] Real **airplane mode**: plan, gear, bookings, and map all usable; edits sync on reconnect
- [ ] Map: pinch-zoom/pan smooth on touch; offline tiles cover the whole route
- [ ] Receipt upload from phone camera/photo library works; large (~10 MB) image OK
- [ ] Two real phones on the same link: edits feel live; no data clobbering
- [ ] Flaky network (toggle wifi mid-edit): no lost writes, no duplicate rows
- [ ] Day 7 (longest day) renders the Flégère/Brévent bail-out options
- [ ] Currency/notes show CHF flag for the Swiss legs

---

## 11. Non-functional gates

- **Performance/PWA (Lighthouse in CI):** PWA installable; Performance ≥ 80 mobile; offline start works.
- **Accessibility:** axe scan on each main view — no serious/critical violations; dropdowns/toggles keyboard-operable; 44px touch targets (already a pattern in the code).
- **Security:** run **Supabase advisors** after each migration (`get_advisors` security + performance); RLS enabled on every trip-scoped table; service-role key / JWT secret never in `VITE_`/client bundle (grep the build output to confirm).

---

## 12. CI — GitHub Actions (outline)

`.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run test:cov
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run e2e
        env:
          VITE_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          VITE_MAP_TILE_URL: ${{ secrets.TEST_MAP_TILE_URL }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report }
```
Add a Lighthouse job (e.g. `treosh/lighthouse-ci-action`) against the built preview once the PWA lands in Phase 6.

---

## 13. Definition of Done (every phase)

1. Lint clean (`npm run lint`).
2. New code has unit/component tests; `src/lib/` coverage ≥ 80%.
3. The phase's E2E scenarios (from §8) pass locally + in CI.
4. The **Must-Not-Break** suite (§9) is green.
5. Supabase advisors clean (if the phase touched the DB).
6. Manual checklist items relevant to the phase done.
7. Feature Brief updated per `FEATURE_BRIEFS.md`.
