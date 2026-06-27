import { describe, it, expect } from 'vitest';
import {
  encodeScenarioForShare,
  decodeScenarioFromUrl,
  generateShareToken,
} from '../../src/lib/share';

describe('encodeScenarioForShare + decodeScenarioFromUrl round-trip', () => {
  const scenario = {
    name: '7-Day Classic',
    startDate: '2026-08-05',
    days: [6, 8, 12, 15, 21, 26, 33],
  };
  const shortcuts = { 'some-shortcut': true };

  it('decode(encode(x)) preserves days', () => {
    const encoded = encodeScenarioForShare(scenario, shortcuts);
    const decoded = decodeScenarioFromUrl(encoded, []);
    expect(decoded.days).toEqual(scenario.days);
  });

  it('decode(encode(x)) preserves startDate', () => {
    const encoded = encodeScenarioForShare(scenario, shortcuts);
    const decoded = decodeScenarioFromUrl(encoded, []);
    expect(decoded.startDate).toBe(scenario.startDate);
  });

  it('decode(encode(x)) preserves name with (Imported) suffix', () => {
    const encoded = encodeScenarioForShare(scenario, shortcuts);
    const decoded = decodeScenarioFromUrl(encoded, []);
    expect(decoded.name).toBe('7-Day Classic (Imported)');
  });

  it('decode(encode(x)) preserves shortcuts', () => {
    const encoded = encodeScenarioForShare(scenario, shortcuts);
    const decoded = decodeScenarioFromUrl(encoded, []);
    expect(decoded.selectedShortcuts).toEqual(shortcuts);
  });

  it('round-trip with empty shortcuts', () => {
    const encoded = encodeScenarioForShare(scenario, {});
    const decoded = decodeScenarioFromUrl(encoded, []);
    expect(decoded.selectedShortcuts).toEqual({});
    expect(decoded.days).toEqual(scenario.days);
  });
});

describe('decodeScenarioFromUrl fallback on bad input', () => {
  it('returns safe fallback on garbage string', () => {
    const result = decodeScenarioFromUrl('not-valid-base64!!!', [1, 2, 3]);
    expect(result.name).toBe('Shared Trip (Imported)');
    expect(result.startDate).toBe('2026-08-01');
    expect(result.days).toEqual([1, 2, 3]);
    expect(result.selectedShortcuts).toEqual({});
  });

  it('returns default days when no defaults provided', () => {
    const result = decodeScenarioFromUrl('garbage');
    expect(result.days).toEqual([6, 8, 12, 15, 21, 28, 33]);
  });

  it('does not throw on empty string', () => {
    expect(() => decodeScenarioFromUrl('')).not.toThrow();
  });

  it('does not throw on null', () => {
    expect(() => decodeScenarioFromUrl(null)).not.toThrow();
  });
});

describe('generateShareToken', () => {
  it('generates tokens of default length ≥ 21', () => {
    const token = generateShareToken();
    expect(token.length).toBeGreaterThanOrEqual(21);
  });

  it('generates tokens of requested length', () => {
    const token = generateShareToken(30);
    expect(token.length).toBe(30);
  });

  it('generates URL-safe characters only', () => {
    const token = generateShareToken(100);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('generates collision-free tokens across 10k samples', () => {
    const tokens = new Set();
    for (let i = 0; i < 10000; i++) {
      tokens.add(generateShareToken());
    }
    expect(tokens.size).toBe(10000);
  });
});
