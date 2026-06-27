import { describe, it, expect } from 'vitest';
import {
  getDayData,
  getTotals,
  getShortcutSavings,
  getDaySavings,
} from '../../src/lib/itinerary';

// Inline WAYPOINTS for test isolation (same data as App.jsx)
const WAYPOINTS = [
  { id: 0, name: 'Les Houches', altitude: 1007, cumDist: 0, cumTime: 0, ascent: 0, descent: 0 },
  { id: 1, name: 'Col de Voza', altitude: 1657, cumDist: 6.0, cumTime: 150, ascent: 660, descent: 20 },
  { id: 2, name: 'Hôtel du Prarion', altitude: 1860, cumDist: 6.8, cumTime: 165, ascent: 660, descent: 20 },
  { id: 3, name: 'Les Contamines', altitude: 1161, cumDist: 17.5, cumTime: 355, ascent: 1000, descent: 530 },
  { id: 4, name: 'Notre-Dame de la Gorge', altitude: 1210, cumDist: 18.5, cumTime: 395, ascent: 1060, descent: 540 },
  { id: 5, name: 'Nant Borrant', altitude: 1459, cumDist: 22.3, cumTime: 440, ascent: 1310, descent: 540 },
  { id: 6, name: 'Refuge de la Balme', altitude: 1706, cumDist: 27.3, cumTime: 525, ascent: 1560, descent: 610 },
  { id: 7, name: 'Refuge de la Croix du Bonhomme', altitude: 2433, cumDist: 32.3, cumTime: 615, ascent: 2350, descent: 680 },
  { id: 8, name: 'Les Chapieux', altitude: 1554, cumDist: 37.3, cumTime: 705, ascent: 2660, descent: 1560 },
  { id: 9, name: 'Refuge des Mottets', altitude: 1868, cumDist: 42.3, cumTime: 795, ascent: 2970, descent: 1570 },
  { id: 10, name: 'Rifugio Elisabetta', altitude: 2195, cumDist: 46.0, cumTime: 885, ascent: 3340, descent: 1790 },
  { id: 11, name: 'Lac Combal', altitude: 1968, cumDist: 49.6, cumTime: 935, ascent: 3340, descent: 2010 },
  { id: 12, name: 'Courmayeur', altitude: 1226, cumDist: 56.0, cumTime: 1050, ascent: 3380, descent: 2760 },
  { id: 13, name: 'Rifugio Bertone', altitude: 1989, cumDist: 60.3, cumTime: 1170, ascent: 4140, descent: 2780 },
  { id: 14, name: 'Rifugio Bonatti', altitude: 2025, cumDist: 68.0, cumTime: 1320, ascent: 4470, descent: 3070 },
  { id: 15, name: 'Rifugio Elena', altitude: 2062, cumDist: 75.9, cumTime: 1470, ascent: 4960, descent: 3460 },
  { id: 16, name: 'La Peule', altitude: 1705, cumDist: 79.8, cumTime: 1530, ascent: 4980, descent: 3840 },
  { id: 17, name: 'Ferret', altitude: 1700, cumDist: 82.6, cumTime: 1570, ascent: 5000, descent: 3860 },
  { id: 18, name: 'La Fouly', altitude: 1610, cumDist: 89.6, cumTime: 1680, ascent: 5020, descent: 4390 },
  { id: 19, name: 'Praz-de-Fort', altitude: 1151, cumDist: 97.9, cumTime: 1815, ascent: 5090, descent: 4920 },
  { id: 20, name: 'Issert', altitude: 1055, cumDist: 100.4, cumTime: 1845, ascent: 5090, descent: 5020 },
  { id: 21, name: 'Champex-Lac', altitude: 1467, cumDist: 105.6, cumTime: 1935, ascent: 5540, descent: 5060 },
  { id: 22, name: 'Plan de l\'Au', altitude: 1330, cumDist: 110.3, cumTime: 2015, ascent: 5570, descent: 5200 },
  { id: 23, name: 'Bovine', altitude: 1987, cumDist: 114.5, cumTime: 2135, ascent: 5870, descent: 5340 },
  { id: 24, name: 'Col de la Forclaz', altitude: 1526, cumDist: 119.0, cumTime: 2235, ascent: 5920, descent: 5950 },
  { id: 25, name: 'Trient', altitude: 1279, cumDist: 121.1, cumTime: 2275, ascent: 5920, descent: 6200 },
  { id: 26, name: 'Col de Balme', altitude: 2191, cumDist: 127.1, cumTime: 2415, ascent: 6730, descent: 6200 },
  { id: 27, name: 'Le Tour', altitude: 1460, cumDist: 133.1, cumTime: 2515, ascent: 6730, descent: 6950 },
  { id: 28, name: 'Tré-le-Champ', altitude: 1417, cumDist: 141.1, cumTime: 2645, ascent: 6970, descent: 7960 },
  { id: 29, name: 'La Flégère', altitude: 1875, cumDist: 148.9, cumTime: 2855, ascent: 7770, descent: 8300 },
  { id: 30, name: 'Planpraz', altitude: 2000, cumDist: 151.7, cumTime: 2930, ascent: 8110, descent: 8340 },
  { id: 31, name: 'Brévent', altitude: 2525, cumDist: 154.5, cumTime: 3020, ascent: 8600, descent: 8380 },
  { id: 32, name: 'Bellachat', altitude: 2152, cumDist: 157.1, cumTime: 3065, ascent: 8620, descent: 8770 },
  { id: 33, name: 'Les Houches (End)', altitude: 1007, cumDist: 164.6, cumTime: 3205, ascent: 8660, descent: 9960 },
];

const DEFAULT_SPLITS = [6, 8, 12, 15, 21, 26, 33];
const DEFAULT_SCENARIO = {
  name: '7-Day Classic',
  startDate: '2026-08-05',
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
    expect(parseFloat(day1.distance)).toBeCloseTo(27.3, 1);
    expect(day1.time).toBe(525);
    expect(day1.ascent).toBe(1560);
    expect(day1.descent).toBe(610);
  });

  it('computes correct dates from startDate', () => {
    const days = getDayData(DEFAULT_SCENARIO, WAYPOINTS);
    expect(days[0].date.toISOString().slice(0, 10)).toBe('2026-08-05');
    expect(days[1].date.toISOString().slice(0, 10)).toBe('2026-08-06');
    expect(days[6].date.toISOString().slice(0, 10)).toBe('2026-08-11');
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

    // Sanity bounds from TESTING.md: ~165 km, ~8600 m ascent, ~9960 m descent
    expect(totals.distance).toBeCloseTo(164.6, 0);
    expect(totals.ascent).toBe(8660);
    expect(totals.descent).toBe(9960);
  });

  it('total time equals cumulative time of last waypoint', () => {
    const days = getDayData(DEFAULT_SCENARIO, WAYPOINTS);
    const totals = getTotals(days);
    expect(totals.time).toBe(3205);
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
