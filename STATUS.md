# TMB Planner — Multi-Agent Coordination (READ-ONLY)

Multiple agents share this repo on `main`. This is the shared brain. **Read it — do not edit or overwrite it** (it was clobbered once already). It is now committed so it persists; Bryan + the Cowork reviewer maintain it.

## Golden rules
- Commit **only your own files**, explicit paths: `git add <file>`. **Never `git add -A` / `git add .`**.
- **Never run `git checkout` / `restore` / `stash` / `clean` on shared files** — you'll wipe another window's uncommitted work (this already happened to STATUS.md + nearly to BUILD_PLAN.md).
- Stay in your lane. One file = one owner.

## Lanes / ownership
| Agent | Owns | Never touch |
|---|---|---|
| **Primary Build (main)** | `src/App.jsx` (SOLE editor), `src/components/*`, `src/sections/*`, `src/lib/use*.js`, `scripts/`, `package.json`, DB migrations | `segmentData.js`, `tests/`, `e2e/` |
| **QA / Test** | `tests/`, `e2e/`, vitest/playwright config | `App.jsx`, feature components, `segmentData.js`, migrations |
| **Phase 5 (data)** | `src/segmentData.js` — ✅ DONE, agent can close | everything else |

## Database / Supabase
- ✅ **Canonical trip:** `171eb249-e6db-49c2-9695-29b7aee936ee` ("TC V1 (Shared)", day_splits `[6,8,12,15,21,26,33]`; 90 gear / 8 bookings / 11 docs). Duplicate resolved — no stray.
- Only **Primary Build** runs migrations. QA must use a **separate test project** (`.env.test.local`) — never the real one.

## Current state
- ✅ On `main`: Supabase + schema, live state + secret-link sharing + migration, two-section nav, test harness + lib refactor, Phase 5 trail-data (`b9df8b2`, verified), **Phase 4a bookings + receipts (`c111b8e`, verified — 8 bookings stage-linked)**.
- ✅ **Phase 4b components built + committed (`516fd4f`) by the QA window:** PackingTab / TransportTab / DocumentsSafetyTab + hooks (useGearItems/useTransportLegs/useSafetyContacts) + seeds — **NOT yet wired into App.jsx**.
- 🔄 **Primary Build:** wire the 3 tabs into App.jsx (~L3718-3727) + Phase 5 App.jsx leftovers (refuge `bookingUrl`/`phone`, live trail-conditions header link). Sole App.jsx editor.
- 🔄 **QA:** back to writing tests for the new modules; keep the Must-Not-Break suite green.
- 🅿️ **Phase 5 agent:** done — close it.
- ⏭ **Phase 6 (PWA + offline):** needs its **own worktree** (adds `package.json` deps); don't start in this shared tree.

## Integration checkpoint (when remaining slices land)
1. Each agent commits its own files, scoped. `git status` clean.
2. `npm run lint && npm run test && npm run e2e && npm run build` green on main.
3. Reviewer verifies Supabase schema/RLS + reads the combined diff.
4. `git push origin main`.

## Housekeeping
- Add `.claude/` to `.gitignore`.
- `receipts/` stays gitignored (personal docs); only `receipts/.gitignore` is tracked.
