import { describe, it, expect } from 'vitest';
import { WAYPOINTS } from '../../src/waypoints';
import { segmentData } from '../../src/segmentData';
import { computeDayPlan } from '../../src/lib/timing';
import {
  WEATHER_DEFAULTS,
  OPEN_METEO_ATTRIBUTION,
  dayDateStr,
  getForecastPoints,
  buildForecastUrl,
  summarizeDay,
  adjustForForecast,
  tempAtAltitude,
  forecastIsStale,
} from '../../src/lib/weather';

const SCENARIO = {
  name: '7-Day Classic',
  startDate: '2026-08-04',
  days: [6, 8, 12, 15, 21, 26, 33],
};

// 24 hourly rows for one date; override individual arrays per hour.
function makeForecast(dateStr, overrides = {}) {
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const arr = (base, over = {}) => hours.map((h) => over[h] ?? base);
  return {
    hourly: {
      time: hours.map((h) => `${dateStr}T${String(h).padStart(2, '0')}:00`),
      cape: arr(50, overrides.cape),
      weather_code: arr(1, overrides.weather_code),
      wind_gusts_10m: arr(20, overrides.wind_gusts_10m),
      temperature_2m: arr(15, overrides.temperature_2m),
      precipitation_probability: arr(5, overrides.precipitation_probability),
      freezing_level_height: arr(4200, overrides.freezing_level_height),
    },
  };
}

describe('dayDateStr', () => {
  it('maps day indices onto the trip calendar', () => {
    expect(dayDateStr(SCENARIO, 0)).toBe('2026-08-04');
    expect(dayDateStr(SCENARIO, 6)).toBe('2026-08-10');
  });

  it('returns null without a start date', () => {
    expect(dayDateStr({}, 0)).toBeNull();
  });
});

describe('getForecastPoints', () => {
  const points = getForecastPoints(SCENARIO, WAYPOINTS, segmentData);

  it('returns one point per day plus a valley reference', () => {
    expect(points.days.length).toBe(7);
    expect(points.days.map((p) => p.key)).toEqual(
      ['day-0', 'day-1', 'day-2', 'day-3', 'day-4', 'day-5', 'day-6']);
    expect(points.valley.key).toBe('valley');
    expect(points.valley.name).toBe('Les Houches');
    expect(points.valley.elevation).toBe(1007);
  });

  it('severe cols win: day 2 anchors on Col du Bonhomme (highPoint, not a waypoint)', () => {
    const p = points.days[1];
    expect(p.name).toBe('Col du Bonhomme');
    expect(p.elevation).toBe(2329);
    expect(p.lat).toBeCloseTo(45.735, 3);
  });

  it('day 5 anchors on Grand Col Ferret, the highest col of the route', () => {
    expect(points.days[4].name).toBe('Grand Col Ferret');
    expect(points.days[4].elevation).toBe(2537);
  });

  it('day 7 prefers the severe Tête aux Vents over higher exposed ground', () => {
    expect(points.days[6].name).toBe('Tête aux Vents');
    expect(points.days[6].elevation).toBe(2132);
  });

  it('a day without storm terrain falls back to its highest waypoint', () => {
    // Day 1 has only moderate exposure → highest waypoint 0–6 is Hôtel du Prarion
    expect(points.days[0].name).toBe('Hôtel du Prarion');
    expect(points.days[0].elevation).toBe(1860);
  });

  it('exposed-only days use the higher segment endpoint (day 6 → Col de Balme)', () => {
    expect(points.days[5].name).toBe('Col de Balme');
    expect(points.days[5].elevation).toBe(2191);
  });

  it('returns null without scenario days', () => {
    expect(getForecastPoints(null, WAYPOINTS, segmentData)).toBeNull();
  });
});

describe('buildForecastUrl', () => {
  it('builds a keyless best_match request with elevation downscaling', () => {
    const url = buildForecastUrl({ lat: 45.735, lng: 6.7066, elevation: 2329 });
    expect(url).toContain('https://api.open-meteo.com/v1/forecast?');
    expect(url).toContain('latitude=45.735');
    expect(url).toContain('longitude=6.7066');
    expect(url).toContain('elevation=2329');
    expect(url).toContain('cape');
    expect(url).toContain('wind_gusts_10m');
    expect(url).toContain('freezing_level_height');
    expect(url).toContain('timezone=Europe%2FParis');
    expect(url).toContain('forecast_days=7');
    expect(url).toContain('models=best_match');
    expect(url).not.toContain('apikey');
  });
});

describe('summarizeDay', () => {
  it('takes CAPE from the convective window only', () => {
    const data = makeForecast('2026-08-05', { cape: { 9: 800, 15: 600 } });
    const s = summarizeDay(data, '2026-08-05');
    expect(s.maxCape).toBe(600); // 800 at 09:00 is pre-convective noise
  });

  it('collects storm hours, gusts, temps, precip and freezing level', () => {
    const data = makeForecast('2026-08-05', {
      weather_code: { 16: 95, 17: 96 },
      wind_gusts_10m: { 13: 75 },
      temperature_2m: { 14: 31 },
      precipitation_probability: { 8: 90, 15: 80 },
      freezing_level_height: { 4: 3800 },
    });
    const s = summarizeDay(data, '2026-08-05');
    expect(s.stormHours).toEqual([16, 17]);
    expect(s.maxGust).toBe(75);
    expect(s.maxTemp).toBe(31);
    expect(s.maxPrecipProbPM).toBe(80); // 90 at 08:00 is outside the window
    expect(s.minFreezingLevel).toBe(3800);
  });

  it('returns null for a date beyond the forecast range', () => {
    const data = makeForecast('2026-08-05');
    expect(summarizeDay(data, '2026-08-12')).toBeNull();
    expect(summarizeDay(null, '2026-08-05')).toBeNull();
  });
});

describe('adjustForForecast — CAPE bands', () => {
  const sum = (cape, extra = {}) => ({ maxCape: cape, stormHours: [], ...extra });

  it('quiet (<100): relaxes the storm window by 1 h and says so', () => {
    const a = adjustForForecast({ pointSummary: sum(50) });
    expect(a.band).toBe('quiet');
    expect(a.relaxed).toBe(true);
    expect(a.stormWindowStart).toBe(16 * 60);
  });

  it('normal (100–400): keeps the static clock', () => {
    const a = adjustForForecast({ pointSummary: sum(200) });
    expect(a.band).toBe('normal');
    expect(a.relaxed).toBe(false);
    expect(a.stormWindowStart).toBe(15 * 60);
  });

  it('active (400–1000): shifts the clock an hour earlier', () => {
    const a = adjustForForecast({ pointSummary: sum(600) });
    expect(a.band).toBe('active');
    expect(a.stormWindowStart).toBe(14 * 60);
  });

  it('extreme (≥1000): cols closed after noon', () => {
    const a = adjustForForecast({ pointSummary: sum(1500) });
    expect(a.band).toBe('extreme');
    expect(a.stormWindowStart).toBe(13 * 60); // severe clear-by = 12:00 after margin
  });

  it('forecast thunderstorm hours tighten but never loosen the window', () => {
    const tightened = adjustForForecast({ pointSummary: sum(50, { stormHours: [14, 15] }) });
    expect(tightened.stormWindowStart).toBe(14 * 60); // quiet CAPE overruled by Wx code

    const later = adjustForForecast({ pointSummary: sum(600, { stormHours: [18] }) });
    expect(later.stormWindowStart).toBe(14 * 60); // 18:00 storms don't relax an active day
  });

  it('beyond 4 days out: trend only, no adjustment', () => {
    const a = adjustForForecast({ pointSummary: sum(1500), daysOut: 5 });
    expect(a.band).toBe('extreme');
    expect(a.confidence).toBe('low');
    expect(a.stormWindowStart).toBeNull();
    expect(a.relaxed).toBe(false);
  });

  it('missing forecast: unknown band, static plan untouched', () => {
    const a = adjustForForecast({ pointSummary: null });
    expect(a.band).toBe('unknown');
    expect(a.stormWindowStart).toBeNull();
  });
});

describe('adjustForForecast — warnings', () => {
  it('raises a wind warning at ≥60 km/h gusts regardless of CAPE', () => {
    const a = adjustForForecast({ pointSummary: { maxCape: 50, stormHours: [], maxGust: 72 } });
    expect(a.warnings).toContainEqual({ kind: 'wind', maxGustKmh: 72 });
    expect(a.relaxed).toBe(true); // storm picture can still be quiet
  });

  it('raises a heat warning when the valley max hits 28 °C', () => {
    const a = adjustForForecast({
      pointSummary: { maxCape: 200, stormHours: [] },
      valleySummary: { maxTemp: 31 },
    });
    expect(a.warnings).toContainEqual({ kind: 'heat', valleyMaxC: 31 });
  });

  it('no warnings on a benign day', () => {
    const a = adjustForForecast({
      pointSummary: { maxCape: 200, stormHours: [], maxGust: 30 },
      valleySummary: { maxTemp: 22 },
    });
    expect(a.warnings).toEqual([]);
  });
});

describe('forecast adjustments feed the timing engine', () => {
  const planWith = (adj) =>
    computeDayPlan(1, SCENARIO, WAYPOINTS, segmentData,
      adj.stormWindowStart != null ? { stormWindowStart: adj.stormWindowStart } : {});

  it('a quiet day relaxes day 2: Bonhomme deadline moves to 15:00', () => {
    const adj = adjustForForecast({ pointSummary: { maxCape: 50, stormHours: [] } });
    const p = planWith(adj);
    expect(p.critical.segmentKey).toBe('6-7');
    expect(p.latestDeparture).toBe(720); // 12:00, up from 11:00 static
    expect(p.sleepIn).toBe(true);
  });

  it('an active day tightens day 2 by an hour', () => {
    const adj = adjustForForecast({ pointSummary: { maxCape: 600, stormHours: [] } });
    expect(planWith(adj).latestDeparture).toBe(600); // 10:00
  });

  it('an extreme day closes the col after noon', () => {
    const adj = adjustForForecast({ pointSummary: { maxCape: 1500, stormHours: [] } });
    const p = planWith(adj);
    expect(p.critical.clearBy).toBe(720); // Bonhomme clear by 12:00
    expect(p.latestDeparture).toBe(540); // 09:00
  });
});

describe('tempAtAltitude', () => {
  it('applies a 6.5 °C/km lapse', () => {
    expect(tempAtAltitude(32, 1000, 2500)).toBeCloseTo(22.25, 2);
    expect(tempAtAltitude(20, 1007, 1007)).toBe(20);
  });
});

describe('forecastIsStale', () => {
  const now = Date.parse('2026-08-04T20:00:00Z');

  it('null → stale, fresh → not, >12 h → stale', () => {
    expect(forecastIsStale(null, now)).toBe(true);
    expect(forecastIsStale(now - 60 * 60 * 1000, now)).toBe(false);
    expect(forecastIsStale(now - 13 * 60 * 60 * 1000, now)).toBe(true);
  });
});

describe('attribution', () => {
  it('carries the CC BY line the UI must display', () => {
    expect(OPEN_METEO_ATTRIBUTION).toContain('Open-Meteo');
    expect(OPEN_METEO_ATTRIBUTION).toContain('CC BY');
    expect(WEATHER_DEFAULTS.timezone).toBe('Europe/Paris');
  });
});
