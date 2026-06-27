import { describe, it, expect, beforeEach } from 'vitest';
import { migrateLocalStorageToTrip, checkMigrationStatus } from '../../src/lib/migrate';
import legacyFixture from '../fixtures/savedTrip.legacy.json';

describe('migrateLocalStorageToTrip', () => {
  it('converts legacy fixture to correct trip object', () => {
    const trip = migrateLocalStorageToTrip(legacyFixture);
    expect(trip).not.toBeNull();
    expect(trip.name).toBe('7-Day Classic');
    expect(trip.start_date).toBe('2026-08-05');
    expect(trip.day_splits).toEqual([6, 8, 12, 15, 21, 26, 33]);
    expect(trip.selected_shortcuts).toEqual({});
    expect(trip.use_imperial).toBe(true);
  });

  it('preserves daySplits exactly', () => {
    const trip = migrateLocalStorageToTrip(legacyFixture);
    expect(trip.day_splits).toEqual(legacyFixture.scenarios[0].days);
  });

  it('preserves startDate exactly', () => {
    const trip = migrateLocalStorageToTrip(legacyFixture);
    expect(trip.start_date).toBe(legacyFixture.scenarios[0].startDate);
  });

  it('preserves selectedShortcuts exactly', () => {
    const trip = migrateLocalStorageToTrip(legacyFixture);
    expect(trip.selected_shortcuts).toEqual(legacyFixture.selectedShortcuts);
  });

  it('preserves useImperial', () => {
    const trip = migrateLocalStorageToTrip(legacyFixture);
    expect(trip.use_imperial).toBe(legacyFixture.useImperial);
  });

  it('uses fallback when primary is null', () => {
    const trip = migrateLocalStorageToTrip(null, legacyFixture);
    expect(trip).not.toBeNull();
    expect(trip.day_splits).toEqual([6, 8, 12, 15, 21, 26, 33]);
  });

  it('returns null when both sources are null', () => {
    expect(migrateLocalStorageToTrip(null, null)).toBeNull();
  });

  it('returns null when no scenarios exist', () => {
    expect(migrateLocalStorageToTrip({ scenarios: [] })).toBeNull();
  });

  it('defaults use_imperial to true when not present', () => {
    const data = {
      scenarios: [{ name: 'Test', startDate: '2026-01-01', days: [6] }],
      selectedShortcuts: {},
    };
    const trip = migrateLocalStorageToTrip(data);
    expect(trip.use_imperial).toBe(true);
  });

  it('handles real savedTripCapture format with shortcuts', () => {
    const capture = {
      scenarios: [
        { id: 1768254523933, name: 'TC V1 (Shared)', startDate: '2026-08-05', days: [6, 8, 12, 15, 21, 26, 33] },
      ],
      activeScenarioId: 1768254523933,
      selectedShortcuts: {
        '27-28-Train to Chamonix/Les Houches': true,
        '0-1-Téléphérique du Prarion': true,
      },
      useImperial: true,
    };
    const trip = migrateLocalStorageToTrip(capture);
    expect(trip.name).toBe('TC V1 (Shared)');
    expect(trip.selected_shortcuts).toEqual(capture.selectedShortcuts);
  });
});

describe('checkMigrationStatus', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = {};
    // Mock localStorage with proper getItem/setItem/removeItem methods
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key) => mockStorage[key] ?? null,
        setItem: (key, val) => { mockStorage[key] = String(val); },
        removeItem: (key) => { delete mockStorage[key]; },
      },
      writable: true,
      configurable: true,
    });
  });

  it('returns hasPendingMigration true when data exists and not migrated', () => {
    localStorage.setItem('tmb-planner-data', JSON.stringify(legacyFixture));
    const result = checkMigrationStatus();
    expect(result.hasPendingMigration).toBe(true);
    expect(result.data).toEqual(legacyFixture);
  });

  it('returns hasPendingMigration false when already migrated', () => {
    localStorage.setItem('tmb-planner-data', JSON.stringify(legacyFixture));
    localStorage.setItem('tmb-planner-migrated', 'true');
    const result = checkMigrationStatus();
    expect(result.hasPendingMigration).toBe(false);
    expect(result.data).toBeNull();
  });

  it('returns hasPendingMigration false when no data exists', () => {
    const result = checkMigrationStatus();
    expect(result.hasPendingMigration).toBe(false);
    expect(result.data).toBeNull();
  });

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem('tmb-planner-data', '{invalid json');
    const result = checkMigrationStatus();
    expect(result.hasPendingMigration).toBe(false);
    expect(result.data).toBeNull();
  });

  it('accepts custom keys', () => {
    localStorage.setItem('custom-key', JSON.stringify(legacyFixture));
    const result = checkMigrationStatus('custom-key', 'custom-migrated');
    expect(result.hasPendingMigration).toBe(true);
    expect(result.data).toEqual(legacyFixture);
  });
});
