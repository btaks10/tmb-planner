/**
 * Offline tile cache management for the TMB trail map.
 * Uses the Cache API (same cache that Workbox CacheFirst targets)
 * to pre-download tiles for offline use.
 */

const CACHE_NAME = 'tmb-tiles-v1';

// TMB bounding box — covers the full trail with padding
const BBOX = { minLat: 45.70, maxLat: 46.06, minLng: 6.70, maxLng: 7.16 };
const ZOOM_RANGE = [10, 11, 12, 13, 14];

/** Convert lat/lng to tile x/y at a given zoom */
function latLngToTile(lat, lng, z) {
  const x = Math.floor(((lng + 180) / 360) * (1 << z));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * (1 << z)
  );
  return { x, y };
}

/**
 * Enumerate all tile URLs for the TMB bbox at the configured zoom range.
 * @param {string} urlTemplate - e.g. "https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=KEY"
 * @returns {string[]} Array of tile URLs
 */
export function getTileList(urlTemplate) {
  const urls = [];

  for (const z of ZOOM_RANGE) {
    const min = latLngToTile(BBOX.maxLat, BBOX.minLng, z); // NW corner
    const max = latLngToTile(BBOX.minLat, BBOX.maxLng, z); // SE corner

    for (let x = min.x; x <= max.x; x++) {
      for (let y = min.y; y <= max.y; y++) {
        urls.push(
          urlTemplate
            .replace('{z}', z)
            .replace('{x}', x)
            .replace('{y}', y)
            .replace('{s}', 'a') // pick a fixed subdomain for caching
        );
      }
    }
  }

  return urls;
}

/**
 * Warm the tile cache by fetching each tile into the Cache API.
 * Skips already-cached tiles. Reports progress via callback.
 * @param {string} urlTemplate
 * @param {(done: number, total: number) => void} onProgress
 */
export async function warmTiles(urlTemplate, onProgress) {
  const tiles = getTileList(urlTemplate);
  const total = tiles.length;
  const cache = await caches.open(CACHE_NAME);
  let done = 0;

  // Process in batches of 6 to avoid overwhelming the network
  const BATCH = 6;

  for (let i = 0; i < tiles.length; i += BATCH) {
    const batch = tiles.slice(i, i + BATCH);

    await Promise.all(
      batch.map(async (url) => {
        try {
          const cached = await cache.match(url);
          if (!cached) {
            const res = await fetch(url);
            if (res.ok) await cache.put(url, res);
          }
        } catch {
          // skip failed tiles silently
        } finally {
          done++;
          onProgress?.(done, total);
        }
      })
    );
  }
}

/**
 * Check how many tiles are already cached vs total.
 * @param {string} urlTemplate
 * @returns {{ cached: number, total: number }}
 */
export async function getCachedTileCount(urlTemplate) {
  const tiles = getTileList(urlTemplate);
  const total = tiles.length;

  try {
    const cache = await caches.open(CACHE_NAME);
    let cached = 0;

    for (const url of tiles) {
      if (await cache.match(url)) cached++;
    }

    return { cached, total };
  } catch {
    return { cached: 0, total };
  }
}
