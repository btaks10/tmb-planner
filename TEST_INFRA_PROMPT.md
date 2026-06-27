# Claude Code — Test Infrastructure Setup (runbook)

> Give this to Claude Code to stand up the test harness defined in `TESTING.md`.
> Can be run by the **main build agent**, or by a **parallel agent in an isolated git worktree** — see the **Parallelization** notes at the bottom. The **testability refactor (Step 6) is main-agent-only.**

---

Paste everything below into Claude Code:

---

Set up the automated test infrastructure for this repo per `TESTING.md`. This is scaffolding only — net-new files plus `package.json` deps/scripts. Do **not** change app behavior. After setup, prove the harness runs, commit, and stop.

**Guardrails**
- Only create the files listed here + add deps/scripts to `package.json`.
- Do **not** modify `src/App.jsx`, `src/segmentData.js`, or any feature code in this task — except Step 6 *if and only if* you are the main build agent (the one already editing `App.jsx`).
- Don't commit secrets. Test DB creds live in `.env.test.local` (gitignored).

**Step 1 — Install dev dependencies**
```bash
npm i -D vitest @vitest/coverage-v8 jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  msw @playwright/test @axe-core/playwright
npx playwright install --with-deps
```

**Step 2 — Add scripts to `package.json`**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
  }
}
```

**Step 3 — Create config + setup files**

`vitest.config.js`
```js
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js',
    include: ['src/**/*.test.{js,jsx}', 'tests/unit/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      reportsDirectory: './coverage',
      thresholds: { lines: 80, functions: 80, statements: 80 },
    },
  },
})
```

`tests/setup.js`
```js
import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

`tests/msw/handlers.js`
```js
import { http, HttpResponse } from 'msw'
// Mock Supabase REST/Storage here. Expand per TESTING.md as the data layer lands.
export const handlers = [
  http.get('*/rest/v1/trips', () => HttpResponse.json([])),
]
```

`tests/msw/server.js`
```js
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
export const server = setupServer(...handlers)
```

`playwright.config.js`
```js
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'html' : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
})
```

**Step 4 — Fixtures + smoke tests (prove the harness)**

`tests/fixtures/savedTrip.legacy.json` — the golden legacy `localStorage` shape used to prove migration never loses the trip:
```json
{
  "scenarios": [
    { "id": 1, "name": "7-Day Classic", "startDate": "2026-08-05", "days": [6, 8, 12, 15, 21, 26, 33] }
  ],
  "activeScenarioId": 1,
  "selectedShortcuts": {}
}
```
> Note: confirm whether the real capture also persists `useImperial`; if so, add it here.

`tests/unit/smoke.test.js`
```js
import { describe, it, expect } from 'vitest'

describe('test harness', () => {
  it('runs unit tests', () => {
    expect(1 + 1).toBe(2)
  })
})
```

`e2e/smoke.spec.js`
```js
import { test, expect } from '@playwright/test'

test('app boots', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#root')).toBeVisible()
})
```

**Step 5 — gitignore + CI**

Append to `.gitignore`:
```
coverage
playwright-report
test-results
.env.test.local
```

Create `.github/workflows/ci.yml`:
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
      - run: npm run e2e
        env:
          VITE_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          VITE_MAP_TILE_URL: ${{ secrets.TEST_MAP_TILE_URL }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report }
```

**Step 6 — Testability refactor (MAIN BUILD AGENT ONLY — skip if you're a parallel/worktree agent)**
Extract the pure helpers out of `src/App.jsx` into `src/lib/` and import them back (no behavior change):
- `src/lib/format.js` → `formatTime`, `formatDistance`, `formatDistanceValue`, `formatElevation`, `formatElevationValue`, `getDistanceUnit`, `getElevationUnit`, `KM_TO_MI`, `M_TO_FT`
- `src/lib/share.js` → `encodeScenarioForShare`, `decodeScenarioFromUrl`, plus the token generator
- `src/lib/itinerary.js` → the per-day distance/ascent/descent/time + shortcut-savings aggregation
- `src/lib/migrate.js` → legacy `localStorage` → trip-object mapping
Then add the unit tests from `TESTING.md` §5 against these modules.

**Step 7 — Acceptance (must pass before committing)**
- `npm run test` → smoke unit test green
- `npm run e2e` → smoke E2E green (build + preview boots)
- `npm run lint` → clean
- Commit: `chore: scaffold test infrastructure (vitest + playwright + msw + ci)`

After this, write real tests **per phase** following `TESTING.md` (§5–§8) and keep the Must-Not-Break suite (§9) green.

---

## Parallelization — can a separate agent do this at the same time?

**Yes, with limits.** Splitting by *file ownership* is what keeps two agents from corrupting each other:

- **Safe to parallelize:** every net-new file above (`vitest.config.js`, `playwright.config.js`, `tests/**`, `e2e/**`, `.github/workflows/ci.yml`). These don't exist in the main build, so there's no collision.
- **Conflict zone:** `package.json` / `package-lock.json` (both agents add deps) and **`src/App.jsx`** (the Step 6 refactor moves code the main agent is actively rewriting). Two agents touching these on the same branch *will* conflict.

**Recommended setup if you parallelize:** isolate the test agent in its own git worktree + branch so the two never share a filesystem:
```bash
# from ~/Desktop/tmb-planner
git worktree add ../tmb-planner-tests test-infra
# open a second Claude Code in ~/Desktop/tmb-planner-tests, give it THIS runbook
# tell it: "you are the parallel/worktree agent — SKIP Step 6"
```
Then merge when it's green:
```bash
git checkout main && git merge test-infra   # resolve the package.json/lock conflict (trivial)
git worktree remove ../tmb-planner-tests
```
- The parallel agent does Steps 1–5 + 7 (skip Step 6).
- The **main agent owns Step 6** (the refactor) because it owns `App.jsx`.
- Expect one small `package.json`/lockfile merge conflict — easy to resolve.

**Simplest path (no merge friction):** just let the main build agent run this whole runbook between phases. The infra is ~20 minutes of scaffolding; parallelizing it mostly saves wall-clock at the cost of a merge. Worth it only if the main agent is deep in a long phase and you want the harness sooner.
