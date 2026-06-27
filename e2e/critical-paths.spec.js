import { test } from '@playwright/test';

/**
 * E2E #2–#9 — Stubbed critical path tests.
 * These are mapped to the full TESTING.md §7 suite.
 * Each will be implemented when the corresponding feature lands.
 */

test.describe('E2E #2: Secret-link live sync', () => {
  // TODO: Phase 2 — Two browser contexts open the same /t/:token;
  // edit in A (move a day end-point + toggle a shortcut) → appears in B within ~2s.
  test.skip('edits in context A appear in context B within 2s', async () => {});
});

test.describe('E2E #3: Offline edit → reconnect', () => {
  // TODO: Phase 4 — Context goes offline; toggle gear packed + edit a booking;
  // reload offline shows the edits from cache; go online → edits persist.
  test.skip('offline edits persist after reconnect', async () => {});
});

test.describe('E2E #4: Receipt upload offline → online', () => {
  // TODO: Phase 4 — Attach a receipt while offline (queued) → reconnect →
  // file appears in Storage and on the other device.
  test.skip('offline receipt upload syncs on reconnect', async () => {});
});

test.describe('E2E #5: PWA installable + offline shell', () => {
  // TODO: Phase 6 — SW registers; manifest valid; in offline mode the app opens
  // and shows Plan + Gear + Bookings (no white screen).
  test.skip('PWA installs and opens offline', async () => {});
});

test.describe('E2E #6: Offline map tiles', () => {
  // TODO: Phase 6 — Tap "Download offline map" → go offline →
  // Leaflet still renders TMB-bbox tiles (zoom 10–14).
  test.skip('offline map tiles render after download', async () => {});
});

test.describe('E2E #7: Gear import', () => {
  // TODO: Phase 4 — Fresh trip seeds 90 gear items, 15 categories;
  // counts match gearSeed.json.
  test.skip('gear import seeds 90 items in 15 categories', async () => {});
});

test.describe('E2E #8: Trail-data corrections', () => {
  // TODO: Phase 5 — Spot-check rendered values from the audit:
  // Les Chapieux navette €8 with times; Prarion €18.90;
  // Flégère/Brévent descent options on the final stage.
  test.skip('trail data corrections render correctly', async () => {});
});

test.describe('E2E #9: Two-section navigation + deep links', () => {
  // TODO: Phase 3 — /t/:token/trail and /t/:token/logistics load the
  // right section on desktop + mobile viewport.
  test.skip('deep links load correct sections', async () => {});
});
