// Open-Meteo forecast layer — pure logic, no network, no React.
//
// The static plan in timing.js is the baseline; a live forecast only ADJUSTS
// it (shifts the storm window, raises heat/wind warnings) and never replaces
// it. Everything here is unit-testable with synthetic forecast JSON.
//
// API choice (see SPRINT_WEATHER_TIMING.md §6): Open-Meteo, keyless + CORS,
// `best_match` model (AROME 1 km over the Alps inside 48 h). Data is
// CC BY 4.0 — the UI must show OPEN_METEO_ATTRIBUTION.

import { TIMING_DEFAULTS, getDaySegments } from './timing';

export const OPEN_METEO_ATTRIBUTION = 'Weather data by Open-Meteo.com (CC BY 4.0)';
export const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

export const WEATHER_DEFAULTS = {
  forecastDays: 7,
  timezone: 'Europe/Paris',       // FR/IT/CH all share CET/CEST — pinned explicitly
  hourlyVars: [
    'temperature_2m',
    'precipitation_probability',
    'weather_code',
    'cape',
    'wind_gusts_10m',
    'freezing_level_height',
  ],
  // Alpine CAPE bands (J/kg), calibrated lower than flatland guides because
  // orographic lifting fires storms at lower instability over the massif:
  capeQuietMax: 100,              // < 100  → stable day, clock relaxes 1 h
  capeNormalMax: 400,             // 100–400 → standard convection clock
  capeActiveMax: 1000,            // 400–1000 → shift the whole clock 1 h earlier
                                  // ≥ 1000  → cols treated as closed after noon
  relaxShiftMin: 60,
  activeShiftMin: -60,
  extremeStormStart: 13 * 60,     // ≥1000 J/kg: storm window from 13:00 (severe clear by 12:00)
  gustWarnKmh: 60,                // col-crossing wind warning threshold
  heatWarnC: 28,                  // valley max that raises the heat flag
  lapseCPerKm: 6.5,               // dry-adiabatic-ish lapse for derived col temps
  convectiveWindowStartHour: 12,  // hours scanned for CAPE / storm signal
  convectiveWindowEndHour: 21,
  confidentDays: 4,               // beyond this many days out: trend only, no adjustment
  refreshAfterMs: 60 * 60 * 1000,      // opportunistic refresh at most hourly
  staleAfterMs: 12 * 60 * 60 * 1000,   // label forecasts older than 12 h as stale
};

const SEVERITY_RANK = { severe: 2, exposed: 1 };

/** 'YYYY-MM-DD' for a scenario day (startDate + dayIndex, UTC math like itinerary.js). */
export function dayDateStr(scenario, dayIndex) {
  if (!scenario?.startDate) return null;
  const d = new Date(`${scenario.startDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dayIndex);
  return d.toISOString().slice(0, 10);
}

/**
 * Representative forecast points: one per day plus one valley reference.
 *
 * Per day, the decision point is the highest storm-relevant location — the
 * highPoint of the most severe exposed/severe segment when one exists,
 * otherwise the day's highest waypoint. The valley point (waypoint 0,
 * Les Houches 1007 m) anchors the heat rule.
 *
 * Returns { days: [{ key, dayIndex, name, lat, lng, elevation }], valley }.
 */
export function getForecastPoints(scenario, waypoints, segmentData) {
  if (!scenario?.days || !waypoints?.length) return null;

  const days = scenario.days.map((_, dayIndex) => {
    const segs = getDaySegments(dayIndex, scenario, waypoints, segmentData);

    // Storm-relevant segments, best first: severe over exposed, then highest.
    const refAlt = (s) =>
      s.highPoint?.altitude ?? Math.max(s.fromWp.altitude, s.toWp.altitude);
    const storm = segs
      .filter((s) => SEVERITY_RANK[s.exposure?.level])
      .sort((a, b) =>
        (SEVERITY_RANK[b.exposure.level] - SEVERITY_RANK[a.exposure.level]) ||
        (refAlt(b) - refAlt(a)));

    let point;
    if (storm.length) {
      const s = storm[0];
      point = s.highPoint
        ? { name: s.highPoint.name, lat: s.highPoint.lat, lng: s.highPoint.lng, elevation: s.highPoint.altitude }
        : (() => {
            const wp = s.toWp.altitude >= s.fromWp.altitude ? s.toWp : s.fromWp;
            return { name: wp.name, lat: wp.lat, lng: wp.lng, elevation: wp.altitude };
          })();
    } else {
      // No storm terrain this day — take the day's highest waypoint.
      const startId = dayIndex === 0 ? 0 : scenario.days[dayIndex - 1];
      const endId = scenario.days[dayIndex];
      let wp = waypoints[startId];
      for (let id = startId; id <= endId; id++) {
        if (waypoints[id].altitude > wp.altitude) wp = waypoints[id];
      }
      point = { name: wp.name, lat: wp.lat, lng: wp.lng, elevation: wp.altitude };
    }

    return { key: `day-${dayIndex}`, dayIndex, ...point };
  });

  const v = waypoints[0];
  const valley = { key: 'valley', dayIndex: null, name: v.name, lat: v.lat, lng: v.lng, elevation: v.altitude };

  return { days, valley };
}

/** Full Open-Meteo request URL for one point (keyless, hourly, best_match). */
export function buildForecastUrl(point, opts = {}) {
  const o = { ...WEATHER_DEFAULTS, ...opts };
  const params = new URLSearchParams({
    latitude: String(point.lat),
    longitude: String(point.lng),
    elevation: String(point.elevation), // statistical downscaling — matters in 1500 m relief
    hourly: o.hourlyVars.join(','),
    timezone: o.timezone,
    forecast_days: String(o.forecastDays),
    models: 'best_match',
  });
  return `${OPEN_METEO_URL}?${params}`;
}

/**
 * Distil one calendar day out of an Open-Meteo hourly response.
 * Returns null when the date isn't covered (beyond forecast range).
 */
export function summarizeDay(data, dateStr, opts = {}) {
  const o = { ...WEATHER_DEFAULTS, ...opts };
  const h = data?.hourly;
  if (!h?.time || !dateStr) return null;

  const idx = [];
  for (let i = 0; i < h.time.length; i++) {
    if (h.time[i].startsWith(dateStr)) idx.push(i);
  }
  if (!idx.length) return null;

  const hourOf = (i) => Number(h.time[i].slice(11, 13));
  const inWindow = (i) => {
    const hr = hourOf(i);
    return hr >= o.convectiveWindowStartHour && hr < o.convectiveWindowEndHour;
  };
  const maxOf = (arr, indices) => {
    let m = null;
    for (const i of indices) {
      const v = arr?.[i];
      if (v != null && (m == null || v > m)) m = v;
    }
    return m;
  };
  const minOf = (arr, indices) => {
    let m = null;
    for (const i of indices) {
      const v = arr?.[i];
      if (v != null && (m == null || v < m)) m = v;
    }
    return m;
  };

  const windowIdx = idx.filter(inWindow);
  const stormHours = idx
    .filter((i) => h.weather_code?.[i] >= 95 && h.weather_code?.[i] <= 99)
    .map(hourOf);

  return {
    date: dateStr,
    maxCape: maxOf(h.cape, windowIdx),
    stormHours,
    maxGust: maxOf(h.wind_gusts_10m, idx),
    maxTemp: maxOf(h.temperature_2m, idx),
    maxPrecipProbPM: maxOf(h.precipitation_probability, windowIdx),
    minFreezingLevel: minOf(h.freezing_level_height, idx),
  };
}

/**
 * Turn a day's forecast into an adjustment of the static plan.
 *
 * - CAPE band sets the storm-window shift (quiet relaxes, active/extreme tighten)
 * - forecast thunderstorm hours can only TIGHTEN the window, never loosen it
 * - gusts ≥ 60 km/h and valley max ≥ 28 °C raise warnings regardless of band
 * - beyond `confidentDays` days out: report the band as a trend, adjust nothing
 *
 * Returns { band, confidence, relaxed, shiftMin, stormWindowStart, warnings }.
 * `stormWindowStart` (min from midnight, or null) feeds computeDayPlan opts.
 */
export function adjustForForecast({ pointSummary, valleySummary, daysOut = 0 }, opts = {}) {
  const o = { ...WEATHER_DEFAULTS, ...opts };
  const baseWindow = TIMING_DEFAULTS.stormWindowStart;

  const warnings = [];
  if (valleySummary?.maxTemp != null && valleySummary.maxTemp >= o.heatWarnC) {
    warnings.push({ kind: 'heat', valleyMaxC: valleySummary.maxTemp });
  }
  if (pointSummary?.maxGust != null && pointSummary.maxGust >= o.gustWarnKmh) {
    warnings.push({ kind: 'wind', maxGustKmh: pointSummary.maxGust });
  }

  let band = 'unknown';
  let shiftMin = 0;
  const cape = pointSummary?.maxCape;
  if (cape != null) {
    if (cape < o.capeQuietMax) { band = 'quiet'; shiftMin = o.relaxShiftMin; }
    else if (cape < o.capeNormalMax) { band = 'normal'; }
    else if (cape < o.capeActiveMax) { band = 'active'; shiftMin = o.activeShiftMin; }
    else { band = 'extreme'; shiftMin = o.extremeStormStart - baseWindow; }
  }

  const confidence = daysOut > o.confidentDays ? 'low' : 'high';

  let stormWindowStart = null;
  if (confidence === 'high' && band !== 'unknown') {
    stormWindowStart = baseWindow + shiftMin;
    if (pointSummary.stormHours?.length) {
      stormWindowStart = Math.min(stormWindowStart, Math.min(...pointSummary.stormHours) * 60);
    }
  }

  return {
    band,
    confidence,
    relaxed: band === 'quiet' && confidence === 'high',
    shiftMin,
    stormWindowStart,
    warnings,
  };
}

/** Derived temperature at altitude via lapse rate (°C). */
export function tempAtAltitude(valleyTempC, valleyAltM, targetAltM, opts = {}) {
  const o = { ...WEATHER_DEFAULTS, ...opts };
  return valleyTempC - ((targetAltM - valleyAltM) / 1000) * o.lapseCPerKm;
}

/** True when a cached forecast is old enough to deserve a stale label. */
export function forecastIsStale(fetchedAt, now = Date.now(), opts = {}) {
  const o = { ...WEATHER_DEFAULTS, ...opts };
  if (fetchedAt == null) return true;
  return now - fetchedAt > o.staleAfterMs;
}
