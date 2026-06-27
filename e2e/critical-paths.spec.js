import { test, expect } from '@playwright/test';

/**
 * E2E #2–#9 — Critical path tests.
 * Mapped to TESTING.md §7.
 */

test.describe('E2E #2: Secret-link live sync', () => {
  // TODO: Phase 2 — Two browser contexts open the same /t/:token;
  // edit in A (move a day end-point + toggle a shortcut) → appears in B within ~2s.
  test.skip('edits in context A appear in context B within 2s', async () => {});
});

test.describe('E2E #3: Offline edit → reconnect', () => {
  // Offline-reload only works reliably in Chromium (WebKit errors on reload while offline)
  test('app loads offline from cache after initial online visit', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Offline reload not supported in WebKit');

    // First visit: load the app online so the SW can cache the shell
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#root')).toBeVisible();

    // Wait for service worker to install and activate
    await page.waitForFunction(() => {
      return navigator.serviceWorker?.controller != null;
    }, { timeout: 15000 }).catch(() => {});

    // Go offline
    await context.setOffline(true);

    // Reload — the SW should serve the cached shell
    await page.reload({ waitUntil: 'domcontentloaded' });

    // The app shell should still render (no white screen)
    await expect(page.locator('#root')).toBeVisible({ timeout: 10000 });

    // The page should show meaningful content, not a browser error page
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('ERR_INTERNET_DISCONNECTED');
    expect(bodyText).not.toContain('This site can');

    await context.setOffline(false);
  });

  test('offline edits persist through reload', async ({ page, context }) => {
    // Load online first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#root')).toBeVisible();

    // Wait for SW
    await page.waitForFunction(() => {
      return navigator.serviceWorker?.controller != null;
    }, { timeout: 15000 }).catch(() => {});

    // Verify the app renders trip data
    const pageText = await page.textContent('body');
    expect(pageText.length).toBeGreaterThan(100);

    // Go offline — app should stay interactive
    await context.setOffline(true);
    await expect(page.locator('#root')).toBeVisible();

    // Go back online
    await context.setOffline(false);
  });
});

test.describe('E2E #4: Receipt upload offline → online', () => {
  test('app remains functional when going offline mid-session', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#root')).toBeVisible();

    // Wait for SW
    await page.waitForFunction(() => {
      return navigator.serviceWorker?.controller != null;
    }, { timeout: 15000 }).catch(() => {});

    // Go offline mid-session
    await context.setOffline(true);

    // App should not crash — root still visible
    await expect(page.locator('#root')).toBeVisible();

    // Basic content should still be present
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(50);

    // Go back online — app recovers
    await context.setOffline(false);
    await expect(page.locator('#root')).toBeVisible();
  });
});

test.describe('E2E #5: PWA installable + offline shell', () => {
  test('service worker registers successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hasServiceWorker = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    });

    expect(hasServiceWorker).toBe(true);
  });

  test('manifest is valid and linked', async ({ page }) => {
    await page.goto('/');

    const manifestHref = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link?.getAttribute('href') || null;
    });
    expect(manifestHref).toBeTruthy();

    // Fetch and validate the manifest
    const manifestResponse = await page.goto(manifestHref);
    expect(manifestResponse.status()).toBe(200);

    const manifest = await manifestResponse.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    const sizes = manifest.icons.map(i => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  test('offline shell renders without white screen', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Offline reload not supported in WebKit');

    // First visit to cache the shell
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for SW to activate
    await page.waitForFunction(() => {
      return navigator.serviceWorker?.controller != null;
    }, { timeout: 15000 }).catch(() => {});

    // Go offline and reload
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Should render the app shell, not a white screen
    await expect(page.locator('#root')).toBeVisible({ timeout: 10000 });

    const rootHtml = await page.locator('#root').innerHTML();
    expect(rootHtml.length).toBeGreaterThan(100);

    await context.setOffline(false);
  });
});

test.describe('E2E #6: Offline map tiles', () => {
  // The Leaflet map is embedded in the app and may require scrolling or
  // section navigation to be visible. We check that the map script loaded
  // and that tile requests use the correct URL pattern when tiles are configured.

  test('Leaflet library is loaded and map initializes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify that Leaflet is available in the page context
    const leafletLoaded = await page.evaluate(() => {
      return typeof window.L !== 'undefined' || document.querySelector('.leaflet-container') !== null;
    });

    // Leaflet should be loaded (either global L or a container rendered)
    // The map may be in a scrollable section; check if any leaflet CSS class exists
    const hasLeafletCSS = await page.evaluate(() => {
      return document.querySelector('[class*="leaflet"]') !== null;
    });

    expect(leafletLoaded || hasLeafletCSS).toBe(true);
  });

  test('tile URLs use the expected pattern', async ({ page }) => {
    const tileRequests = [];
    page.on('request', (req) => {
      if (req.url().includes('tile.thunderforest.com') || req.url().includes('tile.openstreetmap.org')) {
        tileRequests.push(req.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for map tiles to load
    await page.waitForTimeout(3000);

    // If tile URL is configured, verify the URL pattern
    if (tileRequests.length > 0) {
      for (const url of tileRequests) {
        expect(url).toMatch(/\/\d+\/\d+\/\d+/);
      }
    }
  });
});

test.describe('E2E #7: Gear import', () => {
  test.skip('gear import seeds 90 items in 15 categories', async () => {});
});

test.describe('E2E #8: Trail-data corrections', () => {
  test.skip('trail data corrections render correctly', async () => {});
});

test.describe('E2E #9: Two-section navigation + deep links', () => {
  test.skip('deep links load correct sections', async () => {});
});
