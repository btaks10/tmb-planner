/**
 * Tests for src/lib/useWeather.js — fetch + IndexedDB cache behaviour.
 * MSW intercepts Open-Meteo; fake-indexeddb backs the forecast cache.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import { WAYPOINTS } from '../../src/waypoints';
import { segmentData } from '../../src/segmentData';
import { useWeather } from '../../src/lib/useWeather';
import { getForecastPoints } from '../../src/lib/weather';
import { forecastPut, forecastGetAll, forecastClear } from '../../src/lib/forecastStore';

const SCENARIO = {
  name: '7-Day Classic',
  startDate: '2026-08-04',
  days: [6, 8, 12, 15, 21, 26, 33],
};

const POINTS = getForecastPoints(SCENARIO, WAYPOINTS, segmentData);
const ALL_KEYS = [...POINTS.days.map((p) => p.key), 'valley'];

function minimalForecast() {
  const hours = Array.from({ length: 24 }, (_, h) => h);
  return {
    hourly: {
      time: hours.map((h) => `2026-08-04T${String(h).padStart(2, '0')}:00`),
      cape: hours.map(() => 50),
      weather_code: hours.map(() => 1),
      wind_gusts_10m: hours.map(() => 20),
      temperature_2m: hours.map(() => 15),
      precipitation_probability: hours.map(() => 5),
      freezing_level_height: hours.map(() => 4200),
    },
  };
}

let requestCount = 0;
function useForecastHandler(respond) {
  server.use(
    http.get('https://api.open-meteo.com/v1/forecast', (info) => {
      requestCount++;
      return respond(info);
    })
  );
}

function setOnline(value) {
  Object.defineProperty(navigator, 'onLine', { value, writable: true, configurable: true });
}

async function seedCache(fetchedAt, marker = 'seeded') {
  for (const key of ALL_KEYS) {
    await forecastPut({ key, point: { key }, fetchedAt, data: { marker, ...minimalForecast() } });
  }
}

beforeEach(async () => {
  requestCount = 0;
  setOnline(true);
  await forecastClear();
});

afterEach(() => setOnline(true));

describe('useWeather', () => {
  it('fetches all 8 points, exposes them, and mirrors them to IndexedDB', async () => {
    useForecastHandler(() => HttpResponse.json(minimalForecast()));

    const { result } = renderHook(() => useWeather(SCENARIO, WAYPOINTS, segmentData));

    await waitFor(() => expect(Object.keys(result.current.forecasts)).toHaveLength(8));
    expect(requestCount).toBe(8);
    expect(result.current.error).toBeNull();
    expect(result.current.stale).toBe(false);
    expect(result.current.attribution).toContain('Open-Meteo');
    expect(result.current.forecasts['day-1'].point.name).toBe('Col du Bonhomme');

    const cached = await forecastGetAll();
    expect(cached.map((r) => r.key).sort()).toEqual([...ALL_KEYS].sort());
  });

  it('serves a fresh cache without touching the network', async () => {
    useForecastHandler(() => HttpResponse.json(minimalForecast()));
    const fetchedAt = Date.now() - 5 * 60 * 1000; // 5 min old < hourly refresh
    await seedCache(fetchedAt);

    const { result } = renderHook(() => useWeather(SCENARIO, WAYPOINTS, segmentData));

    await waitFor(() => expect(Object.keys(result.current.forecasts)).toHaveLength(8));
    expect(requestCount).toBe(0);
    expect(result.current.fetchedAt).toBe(fetchedAt);
    expect(result.current.forecasts.valley.data.marker).toBe('seeded');
  });

  it('serves the stale cache when every fetch fails, and labels it stale', async () => {
    useForecastHandler(() => new HttpResponse(null, { status: 500 }));
    const fetchedAt = Date.now() - 13 * 60 * 60 * 1000; // old enough to be stale + refetch
    await seedCache(fetchedAt);

    const { result } = renderHook(() => useWeather(SCENARIO, WAYPOINTS, segmentData));

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(Object.keys(result.current.forecasts)).toHaveLength(8); // cache survives
    expect(result.current.forecasts.valley.data.marker).toBe('seeded');
    expect(result.current.stale).toBe(true);
    expect(requestCount).toBe(8); // it did try
  });

  it('skips the network entirely while offline', async () => {
    useForecastHandler(() => HttpResponse.json(minimalForecast()));
    await seedCache(Date.now() - 13 * 60 * 60 * 1000); // would normally refetch
    setOnline(false);

    const { result } = renderHook(() => useWeather(SCENARIO, WAYPOINTS, segmentData));

    await waitFor(() => expect(Object.keys(result.current.forecasts)).toHaveLength(8));
    expect(requestCount).toBe(0);
    expect(result.current.stale).toBe(true);
  });

  it('refresh(true) is the download-all button: refetches despite a fresh cache', async () => {
    useForecastHandler(() => HttpResponse.json(minimalForecast()));
    await seedCache(Date.now(), 'old');

    const { result } = renderHook(() => useWeather(SCENARIO, WAYPOINTS, segmentData));
    await waitFor(() => expect(Object.keys(result.current.forecasts)).toHaveLength(8));
    expect(requestCount).toBe(0);

    await act(() => result.current.refresh(true));

    expect(requestCount).toBe(8);
    expect(result.current.forecasts.valley.data.marker).toBeUndefined(); // replaced
    const cached = await forecastGetAll();
    expect(cached.every((r) => r.data.marker === undefined)).toBe(true);
  });
});
