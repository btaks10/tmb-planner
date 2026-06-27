/**
 * Convert legacy localStorage data (the shape stored in 'tmb-planner-data')
 * into a trip object suitable for Supabase insertion.
 *
 * @param {Object} localStorageData - parsed JSON from localStorage
 * @param {Object} [fallbackCapture] - savedTripCapture.json fallback
 * @returns {Object|null} trip object with name, start_date, day_splits, selected_shortcuts, use_imperial
 */
export function migrateLocalStorageToTrip(localStorageData, fallbackCapture) {
  const source = localStorageData || fallbackCapture;
  if (!source) return null;

  const activeScen = source.scenarios?.[0];
  if (!activeScen) return null;

  return {
    name: activeScen.name,
    start_date: activeScen.startDate,
    day_splits: activeScen.days,
    selected_shortcuts: source.selectedShortcuts || {},
    use_imperial: source.useImperial ?? true,
  };
}

/**
 * Check if localStorage has un-migrated trip data.
 *
 * @param {string} storageKey - localStorage key (default: 'tmb-planner-data')
 * @param {string} migratedKey - migration flag key (default: 'tmb-planner-migrated')
 * @returns {{ hasPendingMigration: boolean, data: Object|null }}
 */
export function checkMigrationStatus(storageKey = 'tmb-planner-data', migratedKey = 'tmb-planner-migrated') {
  try {
    const saved = localStorage.getItem(storageKey);
    const migrated = localStorage.getItem(migratedKey);
    if (saved && !migrated) {
      return { hasPendingMigration: true, data: JSON.parse(saved) };
    }
    return { hasPendingMigration: false, data: null };
  } catch {
    return { hasPendingMigration: false, data: null };
  }
}
