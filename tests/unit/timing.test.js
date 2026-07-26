import { describe, it, expect } from 'vitest';
import { WAYPOINTS } from '../../src/waypoints';
import { segmentData } from '../../src/segmentData';
import {
  breakTimeFor,
  getDaySegments,
  computeDayPlan,
  computeTripPlans,
  fmtClock,
} from '../../src/lib/timing';

const SCENARIO = {
  name: '7-Day Classic',
  startDate: '2026-08-04',
  days: [6, 8, 12, 15, 21, 26, 33],
};

const plan = (i, opts) => computeDayPlan(i, SCENARIO, WAYPOINTS, segmentData, opts);

describe('breakTimeFor', () => {
  it('accrues 10 min per full 2 h of walking', () => {
    expect(breakTimeFor(170)).toBe(10);
    expect(breakTimeFor(270)).toBe(20);
  });

  it('adds lunch beyond 5 h walking', () => {
    expect(breakTimeFor(305)).toBe(50); // 2 breaks + lunch
    expect(breakTimeFor(510)).toBe(70); // 4 breaks + lunch
  });
});

describe('fmtClock', () => {
  it('formats minutes-from-midnight', () => {
    expect(fmtClock(480)).toBe('08:00');
    expect(fmtClock(660)).toBe('11:00');
    expect(fmtClock(275)).toBe('04:35');
  });
});

describe('getDaySegments', () => {
  it('returns the 6 segments of day 1 with metadata', () => {
    const segs = getDaySegments(0, SCENARIO, WAYPOINTS, segmentData);
    expect(segs.length).toBe(6);
    expect(segs[0].key).toBe('0-1');
    expect(segs[0].heat.level).toBe('moderate');
    expect(segs[5].exposure.level).toBe('moderate');
  });

  it('returns [] for out-of-range day', () => {
    expect(getDaySegments(9, SCENARIO, WAYPOINTS, segmentData)).toEqual([]);
  });
});

describe('computeDayPlan — static 7-day itinerary', () => {
  it('day 1 (Les Houches → La Balme): bound only by dinner, no storm constraints', () => {
    const p = plan(0);
    expect(p.constraints.filter(c => c.kind === 'storm')).toEqual([]);
    expect(p.critical.kind).toBe('arrival');
    expect(p.latestDeparture).toBe(500); // 18:00 − (510 walk + 70 breaks)
    expect(p.recommendedDeparture).toBe(470); // 07:50
    expect(p.sleepIn).toBe(false);
    // moderate exposure + heat surface as advisories, not constraints
    expect(p.advisories.some(a => a.kind === 'heat' && a.segmentKey === '0-1')).toBe(true);
    expect(p.advisories.some(a => a.kind === 'exposure' && a.segmentKey === '5-6')).toBe(true);
  });

  it('day 2 (La Balme → Les Chapieux): short day, engine says sleep in', () => {
    const p = plan(1);
    expect(p.critical.segmentKey).toBe('6-7'); // Col du Bonhomme, severe
    expect(p.critical.level).toBe('severe');
    expect(p.critical.clearBy).toBe(840); // 14:00 = storm window − 1 h margin
    expect(p.critical.enterBy).toBe(670); // 11:10 point of no return at La Balme
    expect(p.latestDeparture).toBe(660); // 11:00
    expect(p.recommendedDeparture).toBe(480); // preferred 08:00
    expect(p.sleepIn).toBe(true);
    expect(p.arrival).toBe(770); // 12:50
  });

  it('day 3 (Chapieux → Courmayeur): long day bound by dinner, not the col', () => {
    const p = plan(2);
    expect(p.critical.kind).toBe('arrival');
    expect(p.latestDeparture).toBe(485); // 08:05
    expect(p.recommendedDeparture).toBe(455); // 07:35
    expect(p.feasible).toBe(true);
    // Col de la Seigne still generates its own (looser) storm constraint
    const seigne = p.constraints.find(c => c.segmentKey === '9-10');
    expect(seigne.latestDeparture).toBe(535);
  });

  it('day 4 (Courmayeur → Elena): exposed balcony trail drives the start', () => {
    const p = plan(3);
    expect(p.critical.segmentKey).toBe('14-15');
    expect(p.latestDeparture).toBe(465); // clear Elena approach by 15:00
    expect(p.recommendedDeparture).toBe(435); // 07:15
    const heat = p.constraints.find(c => c.kind === 'heat');
    expect(heat.segmentKey).toBe('12-13'); // Bertone climb before 11:00
    expect(heat.startBy).toBe(660);
  });

  it('day 6 (Champex → Col de Balme): exposed final climb forces a dawn start', () => {
    const p = plan(5);
    expect(p.critical.segmentKey).toBe('25-26');
    expect(p.latestDeparture).toBe(370); // 06:10
    expect(p.recommendedDeparture).toBe(340); // 05:40
    expect(p.feasible).toBe(true);
    expect(p.sleepIn).toBe(false);
  });

  it('day 7 (Col de Balme → Les Houches): full walk is infeasible on the static clock', () => {
    const p = plan(6);
    expect(p.feasible).toBe(false);
    expect(p.recommendedDeparture).toBeNull();
    expect(p.arrival).toBeNull();
    expect(p.critical.segmentKey).toBe('31-32');
    expect(p.latestDeparture).toBeLessThan(300); // would need a pre-05:00 start
  });

  it('returns null for an out-of-range day', () => {
    expect(plan(9)).toBeNull();
  });
});

describe('computeDayPlan — options', () => {
  it('paceMultiplier slows the hiker and tightens the latest departure', () => {
    const p = plan(1, { paceMultiplier: 1.2 });
    expect(p.walkMin).toBe(324); // 204 + 120
    expect(p.latestDeparture).toBe(626); // 840 − (204 + 10)
    expect(p.critical.segmentKey).toBe('6-7');
  });

  it('an earlier storm window shifts everything back', () => {
    const p = plan(1, { stormWindowStart: 13 * 60 }); // storms from 13:00
    expect(p.latestDeparture).toBe(540); // clear Bonhomme by 12:00
    expect(p.sleepIn).toBe(false);
  });

  it('timeline hits the shelter before the deadline at the recommended start', () => {
    const p = plan(1);
    const croix = p.timeline.find(t => t.name === 'Refuge de la Croix du Bonhomme');
    expect(croix.at).toBeLessThanOrEqual(p.critical.clearBy);
    expect(p.timeline[p.timeline.length - 1].at).toBe(p.arrival);
  });
});

describe('computeDayPlan — shortcuts', () => {
  it('checked shortcuts reduce distance, elevation, and walking time', () => {
    const p = plan(0, { selectedShortcuts: { '0-1-Téléphérique du Prarion': true } });
    const seg = p.segments[0];
    expect(seg.walkMin).toBe(50); // 140 − 90
    expect(seg.dist).toBe(1.0); // 6.0 − 5.0
    expect(seg.ascent).toBe(80); // 680 − 600
    expect(seg.appliedShortcuts).toEqual(['Téléphérique du Prarion']);
    expect(p.walkMin).toBe(420); // 510 − 90
    // shorter day → later start allowed: 18:00 − (420 + 60) = 10:00
    expect(p.latestDeparture).toBe(600);
    expect(p.recommendedDeparture).toBe(480);
    expect(p.sleepIn).toBe(true);
  });

  it('unchecked shortcuts change nothing', () => {
    const base = plan(0);
    const p = plan(0, { selectedShortcuts: { '0-1-Téléphérique du Prarion': false } });
    expect(p.walkMin).toBe(base.walkMin);
    expect(p.latestDeparture).toBe(base.latestDeparture);
  });

  it('Flégère lift makes day 7 feasible and drops the ladders constraint', () => {
    const p = plan(6, { selectedShortcuts: { '28-29-Télécabine de la Flégère': true } });
    expect(p.feasible).toBe(true);
    expect(p.walkMin).toBe(555); // 675 − 120
    // Tête aux Vents severe constraint is gone — the lift bypasses it
    expect(p.constraints.find(c => c.segmentKey === '28-29')).toBeUndefined();
    expect(p.critical.segmentKey).toBe('31-32'); // Bellachat traverse now binds
    expect(p.latestDeparture).toBe(405); // 06:45
    expect(p.recommendedDeparture).toBe(375); // 06:15
  });

  it('Flégère + Brévent lifts relax day 7 further', () => {
    const p = plan(6, {
      selectedShortcuts: {
        '28-29-Télécabine de la Flégère': true,
        '30-31-Téléphérique du Brévent': true,
      },
    });
    expect(p.walkMin).toBe(495); // 675 − 120 − 60
    expect(p.constraints.find(c => c.segmentKey === '30-31')).toBeUndefined();
    expect(p.latestDeparture).toBe(465); // 07:45, bound by Bellachat traverse
    expect(p.recommendedDeparture).toBe(435); // 07:15
    expect(p.feasible).toBe(true);
  });

  it('Val Ferret low route removes the balcony constraint on day 4 — sleep in', () => {
    const p = plan(3, { selectedShortcuts: { '14-15-Low route via Val Ferret': true } });
    expect(p.constraints.find(c => c.kind === 'storm' && c.segmentKey === '14-15')).toBeUndefined();
    expect(p.critical.segmentKey).toBe('13-14'); // Bertone→Bonatti now binds
    expect(p.latestDeparture).toBe(615); // 10:15
    expect(p.sleepIn).toBe(true);
    expect(p.recommendedDeparture).toBe(480);
  });

  it('partial lifts do NOT clear exposure (Charamillon gondola only goes partway up)', () => {
    const p = plan(5, { selectedShortcuts: { '25-26-Télécabine Les Tseppes': true } });
    const c = p.constraints.find(x => x.segmentKey === '25-26');
    expect(c).toBeDefined(); // still must clear Col de Balme by 15:00
    expect(p.walkMin).toBe(425); // 470 − 45: time still counts
    expect(p.latestDeparture).toBe(415); // 06:55 — later than 06:10, still early
  });

  it('savings larger than the segment clamp at zero', () => {
    const p = plan(6, { selectedShortcuts: { '31-32-Téléphérique du Brévent (descent)': true } });
    const seg = p.segments.find(s => s.key === '31-32');
    expect(seg.walkMin).toBe(0); // 50 − 120 → clamped
    expect(seg.descent).toBe(0); // 403 − 1500 → clamped
    expect(p.constraints.find(c => c.segmentKey === '31-32')).toBeUndefined();
  });
});

describe('computeTripPlans', () => {
  it('returns a plan per day', () => {
    const plans = computeTripPlans(SCENARIO, WAYPOINTS, segmentData);
    expect(plans.length).toBe(7);
    expect(plans.filter(p => p?.feasible).length).toBe(6); // all but day 7
  });
});
