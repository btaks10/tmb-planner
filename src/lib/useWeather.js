// Forecast fetching + offline cache hook.
//
// Behaviour (SPRINT_WEATHER_TIMING.md §6):
// - loads cached forecasts from IndexedDB first — the app always has an answer
// - refreshes opportunistically when online, at most hourly
// - serves stale data freely when offline or when every fetch fails
// - `refresh(true)` is the "download all forecasts" button for refuge wifi

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  WEATHER_DEFAULTS,
  OPEN_METEO_ATTRIBUTION,
  getForecastPoints,
  buildForecastUrl,
  forecastIsStale,
} from './weather';
import { forecastPut, forecastGetAll } from './forecastStore';

export function useWeather(scenario, waypoints, segmentData, opts = {}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const o = useMemo(() => ({ ...WEATHER_DEFAULTS, ...opts }), [JSON.stringify(opts)]);

  const points = useMemo(
    () => getForecastPoints(scenario, waypoints, segmentData),
    [scenario, waypoints, segmentData]
  );

  const [forecasts, setForecasts] = useState({}); // key → { key, point, fetchedAt, data }
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async (force = false) => {
    if (!points) return;

    // 1. Serve the cache immediately.
    const cached = await forecastGetAll();
    let cacheAge = null;
    if (cached.length) {
      cacheAge = Math.min(...cached.map((r) => r.fetchedAt));
      setForecasts(Object.fromEntries(cached.map((r) => [r.key, r])));
      setFetchedAt(cacheAge);
    }

    // 2. Decide whether to hit the network.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    if (!force && cacheAge != null && Date.now() - cacheAge < o.refreshAfterMs) return;

    // 3. Fetch every point; keep whatever succeeds, cache stays for the rest.
    setLoading(true);
    setError(null);
    const all = [...points.days, points.valley];
    const results = await Promise.allSettled(
      all.map(async (pt) => {
        const res = await fetch(buildForecastUrl(pt, o));
        if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
        return { key: pt.key, point: pt, fetchedAt: Date.now(), data: await res.json() };
      })
    );

    const ok = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    for (const record of ok) await forecastPut(record);

    if (ok.length) {
      setForecasts((prev) => ({
        ...prev,
        ...Object.fromEntries(ok.map((r) => [r.key, r])),
      }));
      setFetchedAt(Math.max(...ok.map((r) => r.fetchedAt)));
    }
    if (!ok.length) {
      const firstErr = results.find((r) => r.status === 'rejected');
      setError(firstErr?.reason?.message ?? 'Forecast fetch failed');
    }
    setLoading(false);
  }, [points, o]);

  useEffect(() => { refresh(false); }, [refresh]);

  return {
    points,
    forecasts,
    fetchedAt,
    stale: forecastIsStale(fetchedAt, Date.now(), o),
    loading,
    error,
    refresh,
    attribution: OPEN_METEO_ATTRIBUTION,
  };
}
