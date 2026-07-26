import { describe, it, expect } from 'vitest';
import { WAYPOINTS } from '../../src/waypoints';
import { segmentData } from '../../src/segmentData';

// Guards the route-data invariants documented in src/waypoints.js.
// If any of these fail after an edit, the data is internally inconsistent —
// fix the data, don't loosen the test.

const BASE_ALT = 1007; // Les Houches, start + end of the loop

describe('WAYPOINTS internal consistency', () => {
  it('has 34 waypoints with sequential ids', () => {
    expect(WAYPOINTS.length).toBe(34);
    WAYPOINTS.forEach((wp, i) => expect(wp.id).toBe(i));
  });

  it('altitude closes at every waypoint: altitude === 1007 + cumAscent − cumDescent', () => {
    for (const wp of WAYPOINTS) {
      expect(BASE_ALT + wp.ascent - wp.descent, `waypoint ${wp.id} (${wp.name})`).toBe(wp.altitude);
    }
  });

  it('the loop closes: total ascent === total descent, end altitude === start altitude', () => {
    const last = WAYPOINTS[WAYPOINTS.length - 1];
    expect(last.ascent).toBe(last.descent);
    expect(last.altitude).toBe(WAYPOINTS[0].altitude);
  });

  it('cumulative fields are monotonic', () => {
    for (let i = 1; i < WAYPOINTS.length; i++) {
      const prev = WAYPOINTS[i - 1];
      const cur = WAYPOINTS[i];
      expect(cur.cumDist, `cumDist ${prev.id}→${cur.id}`).toBeGreaterThan(prev.cumDist);
      expect(cur.cumTime, `cumTime ${prev.id}→${cur.id}`).toBeGreaterThan(prev.cumTime);
      expect(cur.ascent, `ascent ${prev.id}→${cur.id}`).toBeGreaterThanOrEqual(prev.ascent);
      expect(cur.descent, `descent ${prev.id}→${cur.id}`).toBeGreaterThanOrEqual(prev.descent);
    }
  });

  it('segment times follow the pace model (12 min/km + 1 min/10 m up + 1 min/25 m down, rounded to 5)', () => {
    for (let i = 1; i < WAYPOINTS.length; i++) {
      const prev = WAYPOINTS[i - 1];
      const cur = WAYPOINTS[i];
      const dist = cur.cumDist - prev.cumDist;
      const asc = cur.ascent - prev.ascent;
      const desc = cur.descent - prev.descent;
      const model = dist * 12 + asc / 10 + desc / 25;
      const actual = cur.cumTime - prev.cumTime;
      // rounded to the nearest 5 min → max deviation 2.5
      expect(Math.abs(actual - model), `segment ${prev.id}-${cur.id}`).toBeLessThanOrEqual(2.6);
    }
  });
});

describe('segmentData weather/timing fields', () => {
  it('every segment key maps to consecutive waypoint ids', () => {
    for (const key of Object.keys(segmentData)) {
      const [from, to] = key.split('-').map(Number);
      expect(to).toBe(from + 1);
      expect(WAYPOINTS[from]).toBeDefined();
      expect(WAYPOINTS[to]).toBeDefined();
    }
  });

  it('the four col segments carry a highPoint above the segment start', () => {
    // Note: highPoint is not always above the segment END — e.g. Col du Bonhomme
    // (2329) is crossed en route to the higher Croix du Bonhomme refuge (2433).
    for (const key of ['6-7', '9-10', '15-16', '28-29']) {
      const seg = segmentData[key];
      const [from] = key.split('-').map(Number);
      expect(seg.highPoint, `highPoint on ${key}`).toBeDefined();
      expect(seg.highPoint.altitude).toBeGreaterThan(WAYPOINTS[from].altitude);
      expect(seg.highPoint.position).toBeGreaterThan(0);
      expect(seg.highPoint.position).toBeLessThan(1);
      expect(seg.exposure.level).toBe('severe');
    }
  });

  it('exposure fields are well-formed where present', () => {
    const levels = ['moderate', 'exposed', 'severe'];
    for (const [key, seg] of Object.entries(segmentData)) {
      if (!seg.exposure) continue;
      expect(levels, `exposure.level on ${key}`).toContain(seg.exposure.level);
      expect(seg.exposure.exitMin, `exposure.exitMin on ${key}`).toBeGreaterThan(0);
      expect(typeof seg.exposure.shelter, `exposure.shelter on ${key}`).toBe('string');
    }
  });
});
