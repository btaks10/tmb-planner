// Pure departure-time engine — no forecast required.
//
// Static model: the Alpine convection clock. On a typical August day the
// atmosphere is stable in the morning, convection builds from ~13:00, and
// thunderstorms fire from ~15:00. The engine works backwards from that:
// every exposed segment must be cleared before the storm window, severe
// segments with an extra safety margin. A live forecast (slice 3) only
// shifts these deadlines — it never replaces this logic.
//
// All times are minutes from midnight. All functions are pure.

export const TIMING_DEFAULTS = {
  stormWindowStart: 15 * 60, // 15:00 — typical convective storm onset (Aug, Alps)
  severeMarginMin: 60,       // severe segments must be clear 1 h before the window
  heatCutoffStart: 11 * 60,  // start severe-heat climbs before 11:00
  arrivalDeadline: 18 * 60,  // refuge dinner — soft end-of-day constraint
  earliestStart: 5 * 60,     // won't recommend leaving before 05:00
  preferredStart: 8 * 60,    // default start when nothing forces earlier
  departureBuffer: 30,       // recommend leaving this early vs. the hard latest
  sleepInThreshold: 9 * 60,  // latest-minus-buffer past 09:00 ⇒ "sleep in"
  breakEveryMin: 120,        // 10 min break per 2 h walking…
  breakMin: 10,
  lunchMin: 30,              // …plus lunch on days with >5 h walking
  lunchThresholdMin: 300,
  paceMultiplier: 1,         // user pace vs. the base pace model
};

export function fmtClock(min) {
  if (min == null || !Number.isFinite(min)) return '—';
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Break time accrued after `walkMin` minutes of walking. */
export function breakTimeFor(walkMin, opts = {}) {
  const o = { ...TIMING_DEFAULTS, ...opts };
  const breaks = Math.floor(walkMin / o.breakEveryMin) * o.breakMin;
  const lunch = walkMin > o.lunchThresholdMin ? o.lunchMin : 0;
  return breaks + lunch;
}

/** Segments (with exposure/heat/highPoint metadata) covered by a scenario day. */
export function getDaySegments(dayIndex, scenario, waypoints, segmentData, opts = {}) {
  if (!scenario?.days || !waypoints?.length) return [];
  const o = { ...TIMING_DEFAULTS, ...opts };
  const startId = dayIndex === 0 ? 0 : scenario.days[dayIndex - 1];
  const endId = scenario.days[dayIndex];
  if (endId == null) return [];

  const segs = [];
  for (let id = startId; id < endId; id++) {
    const fromWp = waypoints[id];
    const toWp = waypoints[id + 1];
    const key = `${id}-${id + 1}`;
    const meta = segmentData?.[key] ?? {};
    segs.push({
      key,
      fromWp,
      toWp,
      dist: +(toWp.cumDist - fromWp.cumDist).toFixed(1),
      ascent: toWp.ascent - fromWp.ascent,
      descent: toWp.descent - fromWp.descent,
      walkMin: Math.round((toWp.cumTime - fromWp.cumTime) * o.paceMultiplier),
      exposure: meta.exposure ?? null,
      heat: meta.heat ?? null,
      highPoint: meta.highPoint ?? null,
    });
  }
  return segs;
}

/**
 * Compute the static timing plan for one day.
 *
 * Constraints generated:
 * - severe exposure  → clear segment by stormWindowStart − severeMarginMin
 * - exposed exposure → clear segment by stormWindowStart
 * - severe heat      → start segment by heatCutoffStart
 * - arrival          → reach the day's end by arrivalDeadline
 * (moderate exposure and non-severe heat become advisories, not constraints)
 *
 * Each constraint's latestDeparture = deadline − (cum walking to that point
 * + breaks accrued by then). The day's latestDeparture is the minimum.
 */
export function computeDayPlan(dayIndex, scenario, waypoints, segmentData, opts = {}) {
  const o = { ...TIMING_DEFAULTS, ...opts };
  const segments = getDaySegments(dayIndex, scenario, waypoints, segmentData, opts);
  if (!segments.length) return null;

  const walkMin = segments.reduce((s, seg) => s + seg.walkMin, 0);
  const breakMin = breakTimeFor(walkMin, o);
  const totalMin = walkMin + breakMin;

  const constraints = [];
  const advisories = [];

  let cumWalk = 0;
  for (const seg of segments) {
    const cumWalkAtStart = cumWalk;
    const cumWalkAtEnd = cumWalk + seg.walkMin;

    if (seg.exposure) {
      const { level, shelter, note } = seg.exposure;
      if (level === 'severe' || level === 'exposed') {
        const clearBy = level === 'severe'
          ? o.stormWindowStart - o.severeMarginMin
          : o.stormWindowStart;
        constraints.push({
          kind: 'storm',
          level,
          segmentKey: seg.key,
          label: seg.highPoint?.name ?? `${seg.fromWp.name} → ${seg.toWp.name}`,
          shelter,
          note: note ?? null,
          clearBy,
          // point of no return: last moment you should ENTER this segment
          enterBy: clearBy - seg.walkMin,
          latestDeparture: clearBy - (cumWalkAtEnd + breakTimeFor(cumWalkAtEnd, o)),
        });
      } else {
        advisories.push({ kind: 'exposure', segmentKey: seg.key, level, shelter });
      }
    }

    if (seg.heat) {
      if (seg.heat.level === 'severe') {
        constraints.push({
          kind: 'heat',
          level: 'severe',
          segmentKey: seg.key,
          label: `${seg.fromWp.name} → ${seg.toWp.name}`,
          startBy: o.heatCutoffStart,
          latestDeparture: o.heatCutoffStart - (cumWalkAtStart + breakTimeFor(cumWalkAtStart, o)),
        });
      } else {
        advisories.push({ kind: 'heat', segmentKey: seg.key, ...seg.heat });
      }
    }

    cumWalk = cumWalkAtEnd;
  }

  constraints.push({
    kind: 'arrival',
    segmentKey: segments[segments.length - 1].key,
    label: `Reach ${segments[segments.length - 1].toWp.name} by dinner`,
    clearBy: o.arrivalDeadline,
    latestDeparture: o.arrivalDeadline - totalMin,
  });

  const critical = constraints.reduce((a, b) =>
    b.latestDeparture < a.latestDeparture ? b : a);
  const latestDeparture = critical.latestDeparture;
  const feasible = latestDeparture >= o.earliestStart;

  const comfortable = latestDeparture - o.departureBuffer;
  const recommendedDeparture = feasible
    ? Math.max(o.earliestStart, Math.min(o.preferredStart, comfortable))
    : null;
  const sleepIn = feasible && comfortable >= o.sleepInThreshold;

  // Timeline: clock time at each waypoint boundary at the recommended departure
  let timeline = null;
  if (feasible) {
    timeline = [{ name: segments[0].fromWp.name, at: recommendedDeparture }];
    let walked = 0;
    for (const seg of segments) {
      walked += seg.walkMin;
      timeline.push({
        name: seg.toWp.name,
        at: recommendedDeparture + walked + breakTimeFor(walked, o),
      });
    }
  }

  return {
    dayIndex,
    startWp: segments[0].fromWp,
    endWp: segments[segments.length - 1].toWp,
    segments,
    walkMin,
    breakMin,
    totalMin,
    constraints,
    advisories,
    critical,
    latestDeparture,
    recommendedDeparture,
    arrival: feasible ? recommendedDeparture + totalMin : null,
    sleepIn,
    feasible,
    timeline,
  };
}

/** Plans for every day of the scenario. */
export function computeTripPlans(scenario, waypoints, segmentData, opts = {}) {
  if (!scenario?.days) return [];
  return scenario.days.map((_, i) =>
    computeDayPlan(i, scenario, waypoints, segmentData, opts));
}
