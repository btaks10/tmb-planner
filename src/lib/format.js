// Unit conversion constants
export const KM_TO_MI = 0.621371;
export const M_TO_FT = 3.28084;

/**
 * Format minutes as "Xh Ym" or "Xh".
 */
export const formatTime = (mins) => {
  if (!mins && mins !== 0) return '0h';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

/**
 * Format distance with unit suffix: "X.X km" or "X.X mi".
 */
export const formatDistance = (km, useImperial) => {
  if (useImperial) {
    return `${(km * KM_TO_MI).toFixed(1)} mi`;
  }
  return `${km} km`;
};

/**
 * Format distance value (number only, no unit).
 */
export const formatDistanceValue = (km, useImperial) => {
  if (useImperial) {
    return (km * KM_TO_MI).toFixed(1);
  }
  return typeof km === 'number' ? km.toFixed(1) : km;
};

/**
 * Format elevation with unit suffix: "X,XXX ft" or "X,XXXm".
 */
export const formatElevation = (m, useImperial) => {
  if (useImperial) {
    return `${Math.round(m * M_TO_FT).toLocaleString()} ft`;
  }
  return `${m.toLocaleString()}m`;
};

/**
 * Format elevation value (number only, no unit).
 */
export const formatElevationValue = (m, useImperial) => {
  if (useImperial) {
    return Math.round(m * M_TO_FT);
  }
  return m;
};

/**
 * Get distance unit string.
 */
export const getDistanceUnit = (useImperial) => useImperial ? 'mi' : 'km';

/**
 * Get elevation unit string.
 */
export const getElevationUnit = (useImperial) => useImperial ? 'ft' : 'm';
