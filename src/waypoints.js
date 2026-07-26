// Tour du Mont Blanc waypoints — canonical route data (anticlockwise from Les Houches).
//
// Fields: `ascent` / `descent` / `cumDist` / `cumTime` are CUMULATIVE from waypoint 0.
// Per-segment deltas are derived by subtracting consecutive rows.
//
// Data provenance (corrected 2026-07, Weather & Timing sprint Slice 1):
// - Altitudes cross-checked against IGN/Swisstopo/official refuge listings.
//   La Peule corrected 1705 → 2071 m (1705 was Ferret village, a row-shift error).
// - Every row satisfies the closure invariant:
//     altitude === 1007 + ascent − descent
//   and the loop closes: total ascent === total descent (9508 m).
// - cumTime follows the pace model, rounded to 5 min per segment:
//     time = 12 min/km + 1 min per 10 m ascent + 1 min per 25 m descent
//   validated against Cicerone/official guidebook stage times.
// Enforced by tests/unit/waypoints-consistency.test.js — do not hand-edit
// individual numbers without re-verifying the invariants.

export const WAYPOINTS = [
  { id: 0, name: "Les Houches", altitude: 1007, cumDist: 0, cumTime: 0, ascent: 0, descent: 0, stage: 1, lat: 45.8906, lng: 6.7986 },
  { id: 1, name: "Col de Voza", altitude: 1657, cumDist: 6.0, cumTime: 140, ascent: 680, descent: 30, stage: 1, lat: 45.8667, lng: 6.7667 },
  { id: 2, name: "Hôtel du Prarion", altitude: 1860, cumDist: 6.8, cumTime: 170, ascent: 890, descent: 37, stage: 1, lat: 45.8580, lng: 6.7550 },
  { id: 3, name: "Les Contamines", altitude: 1161, cumDist: 16.3, cumTime: 335, ascent: 1040, descent: 886, stage: 2, lat: 45.8206, lng: 6.7267 },
  { id: 4, name: "Notre-Dame de la Gorge", altitude: 1210, cumDist: 19.5, cumTime: 380, ascent: 1100, descent: 897, stage: 2, lat: 45.7950, lng: 6.7150 },
  { id: 5, name: "Nant Borrant", altitude: 1459, cumDist: 21.4, cumTime: 430, ascent: 1355, descent: 903, stage: 2, lat: 45.7750, lng: 6.7050 },
  { id: 6, name: "Refuge de la Balme", altitude: 1706, cumDist: 25.8, cumTime: 510, ascent: 1615, descent: 916, stage: 2, lat: 45.7600, lng: 6.6833 },
  { id: 7, name: "Refuge de la Croix du Bonhomme", altitude: 2433, cumDist: 32.6, cumTime: 680, ascent: 2445, descent: 1019, stage: 3, lat: 45.7350, lng: 6.7100 },
  { id: 8, name: "Les Chapieux", altitude: 1554, cumDist: 37.9, cumTime: 780, ascent: 2465, descent: 1918, stage: 3, lat: 45.7167, lng: 6.7333 },
  { id: 9, name: "Refuge des Mottets", altitude: 1868, cumDist: 44.3, cumTime: 890, ascent: 2785, descent: 1924, stage: 4, lat: 45.7350, lng: 6.8050 },
  { id: 10, name: "Rifugio Elisabetta", altitude: 2195, cumDist: 52.4, cumTime: 1065, ascent: 3440, descent: 2252, stage: 4, lat: 45.7667, lng: 6.8500 },
  { id: 11, name: "Lac Combal", altitude: 1968, cumDist: 55.9, cumTime: 1120, ascent: 3450, descent: 2489, stage: 4, lat: 45.7750, lng: 6.8800 },
  { id: 12, name: "Courmayeur", altitude: 1226, cumDist: 68.0, cumTime: 1305, ascent: 3530, descent: 3311, stage: 4, lat: 45.7967, lng: 6.9694 },
  { id: 13, name: "Rifugio Bertone", altitude: 1989, cumDist: 72.3, cumTime: 1435, ascent: 4300, descent: 3318, stage: 5, lat: 45.8167, lng: 6.9667 },
  { id: 14, name: "Rifugio Bonatti", altitude: 2025, cumDist: 80.0, cumTime: 1570, ascent: 4630, descent: 3612, stage: 5, lat: 45.8833, lng: 7.0167 },
  { id: 15, name: "Rifugio Elena", altitude: 2062, cumDist: 85.7, cumTime: 1680, ascent: 4930, descent: 3875, stage: 6, lat: 45.8917, lng: 7.0500 },
  { id: 16, name: "La Peule", altitude: 2071, cumDist: 93.2, cumTime: 1835, ascent: 5410, descent: 4346, stage: 6, lat: 45.9100, lng: 7.0700 },
  { id: 17, name: "Ferret", altitude: 1700, cumDist: 97.2, cumTime: 1900, ascent: 5420, descent: 4727, stage: 6, lat: 45.9250, lng: 7.1050 },
  { id: 18, name: "La Fouly", altitude: 1610, cumDist: 101.5, cumTime: 1960, ascent: 5460, descent: 4857, stage: 7, lat: 45.9433, lng: 7.0967 },
  { id: 19, name: "Praz-de-Fort", altitude: 1151, cumDist: 109.8, cumTime: 2090, ascent: 5530, descent: 5386, stage: 7, lat: 45.9817, lng: 7.1100 },
  { id: 20, name: "Issert", altitude: 1055, cumDist: 112.3, cumTime: 2125, ascent: 5535, descent: 5487, stage: 7, lat: 46.0017, lng: 7.1150 },
  { id: 21, name: "Champex-Lac", altitude: 1467, cumDist: 117.5, cumTime: 2230, ascent: 5960, descent: 5500, stage: 7, lat: 46.0290, lng: 7.1210 },
  { id: 22, name: "Plan de l'Au", altitude: 1330, cumDist: 122.2, cumTime: 2295, ascent: 5990, descent: 5667, stage: 8, lat: 46.0450, lng: 7.0800 },
  { id: 23, name: "Bovine", altitude: 1987, cumDist: 126.4, cumTime: 2415, ascent: 6680, descent: 5700, stage: 8, lat: 46.0600, lng: 7.0500 },
  { id: 24, name: "Col de la Forclaz", altitude: 1526, cumDist: 130.9, cumTime: 2505, ascent: 6810, descent: 6291, stage: 8, lat: 46.0600, lng: 7.0100 },
  { id: 25, name: "Trient", altitude: 1279, cumDist: 133.0, cumTime: 2540, ascent: 6815, descent: 6543, stage: 8, lat: 46.0567, lng: 7.0233 },
  { id: 26, name: "Col de Balme", altitude: 2191, cumDist: 138.7, cumTime: 2700, ascent: 7735, descent: 6551, stage: 9, lat: 46.0280, lng: 6.9710 },
  { id: 27, name: "Le Tour", altitude: 1460, cumDist: 142.6, cumTime: 2775, ascent: 7740, descent: 7287, stage: 9, lat: 45.9983, lng: 6.9433 },
  { id: 28, name: "Tré-le-Champ", altitude: 1417, cumDist: 146.0, cumTime: 2825, ascent: 7800, descent: 7390, stage: 9, lat: 45.9750, lng: 6.9200 },
  { id: 29, name: "La Flégère", altitude: 1875, cumDist: 153.5, cumTime: 3005, ascent: 8583, descent: 7715, stage: 10, lat: 45.9583, lng: 6.8883 },
  { id: 30, name: "Planpraz", altitude: 2000, cumDist: 159.0, cumTime: 3115, ascent: 8923, descent: 7930, stage: 10, lat: 45.9400, lng: 6.8650 },
  { id: 31, name: "Brévent", altitude: 2525, cumDist: 161.8, cumTime: 3205, ascent: 9463, descent: 7945, stage: 11, lat: 45.9333, lng: 6.8375 },
  { id: 32, name: "Bellachat", altitude: 2152, cumDist: 164.2, cumTime: 3255, ascent: 9493, descent: 8348, stage: 11, lat: 45.9150, lng: 6.8200 },
  { id: 33, name: "Les Houches (End)", altitude: 1007, cumDist: 170.2, cumTime: 3375, ascent: 9508, descent: 9508, stage: 11, lat: 45.8906, lng: 6.7986 },
];
