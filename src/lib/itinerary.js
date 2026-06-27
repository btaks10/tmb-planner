/**
 * Compute per-day stats (distance, time, ascent, descent) from waypoints and day splits.
 *
 * @param {Object} scenario - { days: number[], startDate: string, ... }
 * @param {Array} waypoints - WAYPOINTS array with cumDist, cumTime, ascent, descent
 * @returns {Array} Array of day objects
 */
export function getDayData(scenario, waypoints) {
  if (!scenario || !scenario.days || !waypoints) return [];
  const days = [];
  let prevIdx = 0;
  scenario.days.forEach((endIdx, i) => {
    const startWp = waypoints[prevIdx];
    const endWp = waypoints[endIdx];
    if (!startWp || !endWp) return;
    days.push({
      day: i + 1,
      startWp,
      endWp,
      distance: (endWp.cumDist - startWp.cumDist).toFixed(1),
      time: endWp.cumTime - startWp.cumTime,
      ascent: endWp.ascent - startWp.ascent,
      descent: endWp.descent - startWp.descent,
      date: new Date(new Date(scenario.startDate).getTime() + i * 86400000),
    });
    prevIdx = endIdx;
  });
  return days;
}

/**
 * Compute totals from day data.
 *
 * @param {Array} dayData - output of getDayData
 * @returns {{ distance: number, time: number, ascent: number, descent: number }}
 */
export function getTotals(dayData) {
  return dayData.reduce(
    (acc, d) => ({
      distance: acc.distance + parseFloat(d.distance),
      time: acc.time + d.time,
      ascent: acc.ascent + d.ascent,
      descent: acc.descent + d.descent,
    }),
    { distance: 0, time: 0, ascent: 0, descent: 0 }
  );
}

/**
 * Aggregate shortcut savings from the selected shortcuts map.
 *
 * @param {Object} selectedShortcuts - { [shortcutId]: boolean }
 * @param {Object} segmentDataMap - segmentData keyed by "fromId-toId"
 * @returns {{ timeSaved: number, distanceSaved: number, ascentSaved: number, descentSaved: number }}
 */
export function getShortcutSavings(selectedShortcuts, segmentDataMap) {
  let timeSaved = 0;
  let distanceSaved = 0;
  let ascentSaved = 0;
  let descentSaved = 0;

  Object.entries(selectedShortcuts || {}).forEach(([shortcutId, isSelected]) => {
    if (!isSelected) return;

    // Parse segment key: "fromId-toId-shortcutName"
    const parts = shortcutId.split('-');
    const segmentKey = `${parts[0]}-${parts[1]}`;
    const shortcutName = parts.slice(2).join('-');

    const segment = segmentDataMap[segmentKey];
    if (!segment?.shortcuts) return;

    const shortcut = segment.shortcuts.find((s) => s.name === shortcutName);
    if (!shortcut) return;

    timeSaved += shortcut.timeSaved || 0;
    distanceSaved += shortcut.distanceSaved || 0;
    ascentSaved += shortcut.ascentSaved || 0;
    descentSaved += shortcut.descentSaved || 0;
  });

  return { timeSaved, distanceSaved, ascentSaved, descentSaved };
}

/**
 * Get shortcut savings for a specific day.
 *
 * @param {number} dayIndex
 * @param {Object} scenario - { days: number[] }
 * @param {Array} activeShortcutsList - shortcuts with fromId and savings fields
 * @returns {{ timeSaved: number, distanceSaved: number, ascentSaved: number, descentSaved: number }}
 */
export function getDaySavings(dayIndex, scenario, activeShortcutsList) {
  const prevEnd = dayIndex === 0 ? 0 : scenario.days[dayIndex - 1];
  const dayEnd = scenario.days[dayIndex];
  let timeSaved = 0;
  let distanceSaved = 0;
  let ascentSaved = 0;
  let descentSaved = 0;

  (activeShortcutsList || []).forEach((shortcut) => {
    if (shortcut.fromId >= prevEnd && shortcut.fromId < dayEnd) {
      timeSaved += shortcut.timeSaved || 0;
      distanceSaved += shortcut.distanceSaved || 0;
      ascentSaved += shortcut.ascentSaved || 0;
      descentSaved += shortcut.descentSaved || 0;
    }
  });

  return { timeSaved, distanceSaved, ascentSaved, descentSaved };
}
