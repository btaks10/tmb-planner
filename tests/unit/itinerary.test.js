import { describe, it, expect } from 'vitest';
import {
  getDayData,
  getTotals,
  getShortcutSavings,
  getDaySavings,
} from '../../src/lib/itinerary';

// Real route data — single source of truth (no drifting test mirror)
import { WAYPOINTS } from '../../src/waypoints';

const DEFAULT_SPLITS = [6, 8, 12, 15, 21, 26, 33];
const DEFAULT_SCENARIO = {
  name: '7-Day Classic',
  startDate: '2026-08-04',
  days: DEFAULT_SPLITS,
};

describe('getDayData', () => {
  it('returns correct number of days', () => {
    const days = getDayData(DEFAULT_SCENARIO, WAYPOINTS);
    expect(days.length).toBe(7);
  });

  it('computes day 1 stats correctly (Les Houches → Refuge de la Balme)', () => {
    const days = getDayData(DEFAULT_SCENARIO, WAYPOINTS);
    const day1 = days[0];
    expect(day1.startWp.name).toBe('Les Houches');
    expect(day1.endWp.name).toBe('Refuge de la Balme');
    expect(parseFloat(day1.distance)).toBeCloseTo(25.8, 1);
    expect(day1.time).toBe(510);
    expect(day1.ascent).toBe(1615);
    expect(day1.descent).toBe(916);
  });

  it('computes correct dates from startDate', () => {
    const days = getDayData(DEFAULT_SCENARIO, WAYPOINTS);
    expect(days[0].date.toISOString().slice(0, 10)).toBe('2026-08-04');
    expect(days[1].date.toISOString().slice(0, 10)).toBe('2026-08-05');
    expect(days[6].date.toISOString().slice(0, 10)).toBe('2026-08-10');
  });

  it('returns empty array for null scenario', () => {
    expect(getDayData(null, WAYPOINTS)).toEqual([]);
  });

  it('returns empty array for null waypoints', () => {
    expect(getDayData(DEFAULT_SCENARIO, null)).toEqual([]);
  });

  it('day endpoints match the known itinerary', () => {
    const days = getDayData(DEFAULT_SCENARIO, WAYPOINTS);
    const endNames = days.map(d => d.endWp.name);
    expect(endNames).toEqual([
      'Refuge de la Balme',
      'Les Chapieux',
      'Courmayeur',
      'Rifugio Elena',
      'Champex-Lac',
      'Col de Balme',
      'Les Houches (End)',
    ]);
  });
});

describe('getTotals', () => {
  it('sums all days correctly', () => {
    const days = getDayData(DEFAULT_SCENARIO, WAYPOINTS);
    const totals = getTotals(days);

    // Corrected route data (2026-07): 170.2 km, ±9508 m (loop closes)
    expect(totals.distance).toBeCloseTo(170.2, 0);
    expect(totals.ascent).toBe(9508);
    expect(totals.descent).toBe(9508);
  });

  it('total time equals cumulative time of last waypoint', () => {
    const days = getDayData(DEFAULT_SCENARIO, WAYPOINTS);
    const totals = getTotals(days);
    expect(totals.time).toBe(3375);
  });

  it('returns zeros for empty array', () => {
    const totals = getTotals([]);
    expect(totals.distance).toBe(0);
    expect(totals.time).toBe(0);
    expect(totals.ascent).toBe(0);
    expect(totals.descent).toBe(0);
  });
});

describe('getShortcutSavings', () => {
  const mockSegmentData = {
    '0-1': {
      shortcuts: [
        { name: 'Téléphérique du Prarion', timeSaved: 90, distanceSaved: 5.0, ascentSaved: 600, descentSaved: 0 },
      ],
    },
    '16-17': {
      shortcuts: [
        { name: 'Bus from Ferret', timeSaved: 30, distanceSaved: 2.0, ascentSaved: 0, descentSaved: 0 },
      ],
    },
  };

  it('aggregates savings from selected shortcuts', () => {
    const selected = {
      '0-1-Téléphérique du Prarion': true,
      '16-17-Bus from Ferret': true,
    };
    const savings = getShortcutSavings(selected, mockSegmentData);
    expect(savings.timeSaved).toBe(120);
    expect(savings.distanceSaved).toBe(7.0);
    expect(savings.ascentSaved).toBe(600);
    expect(savings.descentSaved).toBe(0);
  });

  it('ignores unselected shortcuts', () => {
    const selected = {
      '0-1-Téléphérique du Prarion': false,
      '16-17-Bus from Ferret': true,
    };
    const savings = getShortcutSavings(selected, mockSegmentData);
    expect(savings.timeSaved).toBe(30);
  });

  it('returns zeros for empty selection', () => {
    const savings = getShortcutSavings({}, mockSegmentData);
    expect(savings.timeSaved).toBe(0);
    expect(savings.distanceSaved).toBe(0);
    expect(savings.ascentSaved).toBe(0);
    expect(savings.descentSaved).toBe(0);
  });

  it('returns zeros for null/undefined input', () => {
    const savings = getShortcutSavings(null, mockSegmentData);
    expect(savings.timeSaved).toBe(0);
  });

  it('savings never produce negative totals', () => {
    const days = getDayData(DEFAULT_SCENARIO, WAYPOINTS);
    const totals = getTotals(days);
    const selected = {
      '0-1-Téléphérique du Prarion': true,
      '16-17-Bus from Ferret': true,
    };
    const savings = getShortcutSavings(selected, mockSegmentData);

    expect(totals.time - savings.timeSaved).toBeGreaterThan(0);
    expect(totals.distance - savings.distanceSaved).toBeGreaterThan(0);
    expect(totals.ascent - savings.ascentSaved).toBeGreaterThan(0);
    expect(totals.descent - savings.descentSaved).toBeGreaterThanOrEqual(0);
  });
});

describe('getDaySavings', () => {
  const activeShortcuts = [
    { fromId: 0, timeSaved: 90, distanceSaved: 5.0, ascentSaved: 600, descentSaved: 0 },
    { fromId: 16, timeSaved: 30, distanceSaved: 2.0, ascentSaved: 0, descentSaved: 0 },
  ];

  it('returns savings for a day that has a shortcut', () => {
    // Day 1 covers waypoints 0-6, so fromId=0 should match
    const savings = getDaySavings(0, DEFAULT_SCENARIO, activeShortcuts);
    expect(savings.timeSaved).toBe(90);
    expect(savings.distanceSaved).toBe(5.0);
    expect(savings.ascentSaved).toBe(600);
  });

  it('returns zeros for a day with no shortcuts', () => {
    // Day 2 covers waypoints 6-8, no matching fromIds
    const savings = getDaySavings(1, DEFAULT_SCENARIO, activeShortcuts);
    expect(savings.timeSaved).toBe(0);
    expect(savings.distanceSaved).toBe(0);
  });

  it('handles null shortcuts list', () => {
    const savings = getDaySavings(0, DEFAULT_SCENARIO, null);
    expect(savings.timeSaved).toBe(0);
  });

  it('handles day 5 (Rifugio Elena → Champex-Lac) with shortcut fromId=16', () => {
    // Day 5 (index 4) covers waypoints 15-21, so fromId=16 should match
    const savings = getDaySavings(4, DEFAULT_SCENARIO, activeShortcuts);
    expect(savings.timeSaved).toBe(30);
    expect(savings.distanceSaved).toBe(2.0);
  });
});

describe('getDayData edge cases', () => {
  it('handles missing scenario.days', () => {
    expect(getDayData({ name: 'x', startDate: '2026-01-01' }, WAYPOINTS)).toEqual([]);
  });

  it('handles single-day scenario', () => {
    const singleDay = { name: 'Short', startDate: '2026-01-01', days: [33] };
    const days = getDayData(singleDay, WAYPOINTS);
    expect(days.length).toBe(1);
    expect(days[0].endWp.name).toBe('Les Houches (End)');
  });
});

describe('getShortcutSavings edge cases', () => {
  it('handles shortcut pointing to non-existent segment', () => {
    const selected = { '99-100-Nonexistent': true };
    const savings = getShortcutSavings(selected, {});
    expect(savings.timeSaved).toBe(0);
  });

  it('handles segment without shortcuts array', () => {
    const selected = { '0-1-Test': true };
    const mockData = { '0-1': {} };
    const savings = getShortcutSavings(selected, mockData);
    expect(savings.timeSaved).toBe(0);
  });

  it('handles shortcut name not found in segment', () => {
    const selected = { '0-1-NonexistentShortcut': true };
    const mockData = {
      '0-1': { shortcuts: [{ name: 'Different', timeSaved: 50 }] },
    };
    const savings = getShortcutSavings(selected, mockData);
    expect(savings.timeSaved).toBe(0);
  });
});
