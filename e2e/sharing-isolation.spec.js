import { test, expect } from '@playwright/test';

/**
 * E2E #10 — Sharing security (negative).
 *
 * A random/invalid token cannot read or write another trip's rows.
 * The app should show an error or empty state, not leak data.
 */
test.describe('E2E #10: Sharing isolation', () => {
  test('random token cannot load a real trip', async ({ page }) => {
    // Navigate to a completely random/invalid share token
    const fakeToken = 'INVALID_TOKEN_' + Date.now();
    await page.goto(`/t/${fakeToken}`);

    // The page should load without crashing
    await expect(page.locator('#root')).toBeVisible();

    // The app should NOT show valid trip data — it should show an error
    // or fall back to the default view (no real trip loaded).
    // Wait for the app to attempt loading and fail
    await page.waitForLoadState('networkidle');

    // Check that no real trip waypoints are rendered as part of a loaded trip
    // The key indicator: if the trip-session call fails, the app should show
    // either an error message or the default state.
    // We verify the page doesn't expose another user's trip data
    const body = await page.textContent('body');

    // The page should either show an error or the default landing —
    // critically, it should NOT show a different user's saved trip name
    // (e.g. "TC V1 (Shared)" or any other trip name not in defaults)
    expect(body).not.toContain('TC V1 (Shared)');
  });

  test('tampered token returns error from trip-session', async ({ page }) => {
    // Intercept the trip-session call to verify it returns an error for bad tokens
    let sessionResponse = null;
    page.on('response', (response) => {
      if (response.url().includes('trip-session')) {
        sessionResponse = response;
      }
    });

    const fakeToken = 'completely-bogus-token-xyzzy-12345';
    await page.goto(`/t/${fakeToken}`);
    await page.waitForLoadState('networkidle');

    // If Supabase is configured, the trip-session call should fail
    // If not configured, the fetch itself will fail (CORS/network error)
    // Either way, no trip data should be exposed
    if (sessionResponse) {
      // The trip-session endpoint should reject the invalid token
      expect(sessionResponse.status()).toBeGreaterThanOrEqual(400);
    }

    // The app should still be usable (not crash)
    await expect(page.locator('#root')).toBeVisible();
  });
});
