import { describe, it, expect } from 'vitest';
import {
  formatTime,
  formatDistance,
  formatDistanceValue,
  formatElevation,
  formatElevationValue,
  getDistanceUnit,
  getElevationUnit,
  KM_TO_MI,
  M_TO_FT,
} from '../../src/lib/format';

describe('formatTime', () => {
  it('formats hours and minutes', () => {
    expect(formatTime(150)).toBe('2h 30m');
  });

  it('formats even hours without minutes', () => {
    expect(formatTime(120)).toBe('2h');
  });

  it('formats zero', () => {
    expect(formatTime(0)).toBe('0h');
  });

  it('formats minutes-only values', () => {
    expect(formatTime(45)).toBe('0h 45m');
  });

  it('handles null/undefined gracefully', () => {
    expect(formatTime(null)).toBe('0h');
    expect(formatTime(undefined)).toBe('0h');
  });
});

describe('formatDistance', () => {
  it('formats km in metric', () => {
    expect(formatDistance(10, false)).toBe('10 km');
  });

  it('formats miles in imperial', () => {
    expect(formatDistance(10, true)).toBe('6.2 mi');
  });
});

describe('formatDistanceValue', () => {
  it('returns numeric string in metric', () => {
    expect(formatDistanceValue(10, false)).toBe('10.0');
  });

  it('converts km to mi in imperial', () => {
    expect(formatDistanceValue(10, true)).toBe('6.2');
  });

  it('handles string input in metric', () => {
    expect(formatDistanceValue('10', false)).toBe('10');
  });
});

describe('formatElevation', () => {
  it('formats meters', () => {
    expect(formatElevation(1000, false)).toBe('1,000m');
  });

  it('converts to feet in imperial', () => {
    expect(formatElevation(1000, true)).toBe('3,281 ft');
  });
});

describe('formatElevationValue', () => {
  it('returns raw meters', () => {
    expect(formatElevationValue(1000, false)).toBe(1000);
  });

  it('converts to feet in imperial', () => {
    expect(formatElevationValue(1000, true)).toBe(3281);
  });

  it('rounds correctly', () => {
    expect(formatElevationValue(500, true)).toBe(1640);
  });
});

describe('getDistanceUnit', () => {
  it('returns km for metric', () => {
    expect(getDistanceUnit(false)).toBe('km');
  });
  it('returns mi for imperial', () => {
    expect(getDistanceUnit(true)).toBe('mi');
  });
});

describe('getElevationUnit', () => {
  it('returns m for metric', () => {
    expect(getElevationUnit(false)).toBe('m');
  });
  it('returns ft for imperial', () => {
    expect(getElevationUnit(true)).toBe('ft');
  });
});

describe('conversion constants', () => {
  it('KM_TO_MI is approximately 0.621371', () => {
    expect(KM_TO_MI).toBeCloseTo(0.621371, 5);
  });
  it('M_TO_FT is approximately 3.28084', () => {
    expect(M_TO_FT).toBeCloseTo(3.28084, 4);
  });
});
