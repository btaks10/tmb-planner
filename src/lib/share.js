/**
 * Encode a scenario for sharing via URL query param (legacy snapshot link).
 * Produces a base64-encoded JSON payload with compact keys.
 */
export function encodeScenarioForShare(scenario, selectedShortcuts) {
  const payload = {
    n: scenario.name,
    s: scenario.startDate,
    d: scenario.days,
    sc: selectedShortcuts || {},
  };
  return btoa(JSON.stringify(payload));
}

/**
 * Decode a scenario from a legacy ?trip= URL param.
 * Returns { name, startDate, days, selectedShortcuts } or a safe fallback on bad input.
 */
export function decodeScenarioFromUrl(encodedString, defaultDays) {
  try {
    const decoded = JSON.parse(atob(encodedString));
    return {
      name: (decoded.n || 'Shared Trip') + ' (Imported)',
      startDate: decoded.s || '2026-08-01',
      days: decoded.d || defaultDays || [6, 8, 12, 15, 21, 28, 33],
      selectedShortcuts: decoded.sc || {},
    };
  } catch {
    return {
      name: 'Shared Trip (Imported)',
      startDate: '2026-08-01',
      days: defaultDays || [6, 8, 12, 15, 21, 28, 33],
      selectedShortcuts: {},
    };
  }
}

/**
 * Generate a URL-safe random token for share links.
 * Uses crypto.getRandomValues for security; length ≥ 21 chars, URL-safe.
 */
export function generateShareToken(length = 21) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => chars[v % chars.length]).join('');
}
