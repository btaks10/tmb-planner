import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { segmentData } from './segmentData';
import {
  Eye, Waves, Mountain, Landmark, Church, Bird, Camera,
  ChevronDown, ChevronRight, Utensils, Home, MapPin,
  Zap, Bus, CableCar, Route, Check, AlertTriangle,
  Plus, Minus, Save, Share2, Link2, Copy, X, Maximize2, RotateCcw
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const STORAGE_KEY = 'tmb-planner-data';

const DEFAULT_DATA = {
  scenarios: [{ id: 1, name: "7-Day Classic", startDate: "2026-08-01", days: [6, 8, 12, 15, 21, 28, 33] }],
  activeScenarioId: 1,
  selectedShortcuts: {}
};

const WAYPOINTS = [
  { id: 0, name: "Les Houches", altitude: 1007, cumDist: 0, cumTime: 0, ascent: 0, descent: 0, stage: 1, lat: 45.8906, lng: 6.7986 },
  { id: 1, name: "Col de Voza", altitude: 1657, cumDist: 6.0, cumTime: 150, ascent: 660, descent: 20, stage: 1, lat: 45.8667, lng: 6.7667 },
  { id: 2, name: "Hôtel du Prarion", altitude: 1860, cumDist: 6.8, cumTime: 165, ascent: 660, descent: 20, stage: 1, lat: 45.8580, lng: 6.7550 },
  { id: 3, name: "Les Contamines", altitude: 1161, cumDist: 17.5, cumTime: 355, ascent: 1000, descent: 530, stage: 2, lat: 45.8206, lng: 6.7267 },
  { id: 4, name: "Notre-Dame de la Gorge", altitude: 1210, cumDist: 18.5, cumTime: 395, ascent: 1060, descent: 540, stage: 2, lat: 45.7950, lng: 6.7150 },
  { id: 5, name: "Nant Borrant", altitude: 1459, cumDist: 22.3, cumTime: 440, ascent: 1310, descent: 540, stage: 2, lat: 45.7750, lng: 6.7050 },
  { id: 6, name: "Refuge de la Balme", altitude: 1706, cumDist: 27.3, cumTime: 525, ascent: 1560, descent: 610, stage: 2, lat: 45.7600, lng: 6.6833 },
  { id: 7, name: "Refuge de la Croix du Bonhomme", altitude: 2433, cumDist: 32.3, cumTime: 615, ascent: 2350, descent: 680, stage: 3, lat: 45.7350, lng: 6.7100 },
  { id: 8, name: "Les Chapieux", altitude: 1554, cumDist: 37.3, cumTime: 705, ascent: 2660, descent: 1560, stage: 3, lat: 45.7167, lng: 6.7333 },
  { id: 9, name: "Refuge des Mottets", altitude: 1868, cumDist: 42.3, cumTime: 795, ascent: 2970, descent: 1570, stage: 4, lat: 45.7350, lng: 6.8050 },
  { id: 10, name: "Rifugio Elisabetta", altitude: 2195, cumDist: 46.0, cumTime: 885, ascent: 3340, descent: 1790, stage: 4, lat: 45.7667, lng: 6.8500 },
  { id: 11, name: "Lac Combal", altitude: 1968, cumDist: 49.6, cumTime: 935, ascent: 3340, descent: 2010, stage: 4, lat: 45.7750, lng: 6.8800 },
  { id: 12, name: "Courmayeur", altitude: 1226, cumDist: 56.0, cumTime: 1050, ascent: 3380, descent: 2760, stage: 4, lat: 45.7967, lng: 6.9694 },
  { id: 13, name: "Rifugio Bertone", altitude: 1989, cumDist: 60.3, cumTime: 1170, ascent: 4140, descent: 2780, stage: 5, lat: 45.8167, lng: 6.9667 },
  { id: 14, name: "Rifugio Bonatti", altitude: 2025, cumDist: 68.0, cumTime: 1320, ascent: 4470, descent: 3070, stage: 5, lat: 45.8833, lng: 7.0167 },
  { id: 15, name: "Rifugio Elena", altitude: 2062, cumDist: 75.9, cumTime: 1470, ascent: 4960, descent: 3460, stage: 6, lat: 45.8917, lng: 7.0500 },
  { id: 16, name: "La Peule", altitude: 1705, cumDist: 79.8, cumTime: 1530, ascent: 4980, descent: 3840, stage: 6, lat: 45.9100, lng: 7.0700 },
  { id: 17, name: "Ferret", altitude: 1700, cumDist: 82.6, cumTime: 1570, ascent: 5000, descent: 3860, stage: 6, lat: 45.9250, lng: 7.1050 },
  { id: 18, name: "La Fouly", altitude: 1610, cumDist: 89.6, cumTime: 1680, ascent: 5020, descent: 4390, stage: 7, lat: 45.9433, lng: 7.0967 },
  { id: 19, name: "Praz-de-Fort", altitude: 1151, cumDist: 97.9, cumTime: 1815, ascent: 5090, descent: 4920, stage: 7, lat: 45.9817, lng: 7.1100 },
  { id: 20, name: "Issert", altitude: 1055, cumDist: 100.4, cumTime: 1845, ascent: 5090, descent: 5020, stage: 7, lat: 46.0017, lng: 7.1150 },
  { id: 21, name: "Champex-Lac", altitude: 1467, cumDist: 105.6, cumTime: 1935, ascent: 5540, descent: 5060, stage: 7, lat: 46.0290, lng: 7.1210 },
  { id: 22, name: "Plan de l'Au", altitude: 1330, cumDist: 110.3, cumTime: 2015, ascent: 5570, descent: 5200, stage: 8, lat: 46.0450, lng: 7.0800 },
  { id: 23, name: "Bovine", altitude: 1987, cumDist: 114.5, cumTime: 2135, ascent: 5870, descent: 5340, stage: 8, lat: 46.0600, lng: 7.0500 },
  { id: 24, name: "Col de la Forclaz", altitude: 1526, cumDist: 119.0, cumTime: 2235, ascent: 5920, descent: 5950, stage: 8, lat: 46.0600, lng: 7.0100 },
  { id: 25, name: "Trient", altitude: 1279, cumDist: 121.1, cumTime: 2275, ascent: 5920, descent: 6200, stage: 8, lat: 46.0567, lng: 7.0233 },
  { id: 26, name: "Col de Balme", altitude: 2191, cumDist: 127.1, cumTime: 2415, ascent: 6730, descent: 6200, stage: 9, lat: 46.0280, lng: 6.9710 },
  { id: 27, name: "Le Tour", altitude: 1460, cumDist: 133.1, cumTime: 2515, ascent: 6730, descent: 6950, stage: 9, lat: 45.9983, lng: 6.9433 },
  { id: 28, name: "Tré-le-Champ", altitude: 1417, cumDist: 141.1, cumTime: 2645, ascent: 6970, descent: 7960, stage: 9, lat: 45.9750, lng: 6.9200 },
  { id: 29, name: "La Flégère", altitude: 1875, cumDist: 148.9, cumTime: 2855, ascent: 7770, descent: 8300, stage: 10, lat: 45.9583, lng: 6.8883 },
  { id: 30, name: "Planpraz", altitude: 2000, cumDist: 151.7, cumTime: 2930, ascent: 8110, descent: 8340, stage: 10, lat: 45.9400, lng: 6.8650 },
  { id: 31, name: "Brévent", altitude: 2525, cumDist: 154.5, cumTime: 3020, ascent: 8600, descent: 8380, stage: 11, lat: 45.9333, lng: 6.8375 },
  { id: 32, name: "Bellachat", altitude: 2152, cumDist: 157.1, cumTime: 3065, ascent: 8620, descent: 8770, stage: 11, lat: 45.9150, lng: 6.8200 },
  { id: 33, name: "Les Houches (End)", altitude: 1007, cumDist: 164.6, cumTime: 3205, ascent: 8660, descent: 9960, stage: 11, lat: 45.8906, lng: 6.7986 },
];

// Mont Blanc summit location for map reference
const MONT_BLANC = { lat: 45.8326, lng: 6.8652, altitude: 4808 };
const MAP_CENTER = [45.88, 6.92];
const MAP_ZOOM = 11;

const DAY_COLORS = [
  { main: '#10b981', gradient: 'from-emerald-500 to-teal-600' },
  { main: '#3b82f6', gradient: 'from-blue-500 to-indigo-600' },
  { main: '#8b5cf6', gradient: 'from-violet-500 to-purple-600' },
  { main: '#f59e0b', gradient: 'from-amber-500 to-orange-600' },
  { main: '#ef4444', gradient: 'from-red-500 to-rose-600' },
  { main: '#06b6d4', gradient: 'from-cyan-500 to-blue-600' },
  { main: '#ec4899', gradient: 'from-pink-500 to-rose-600' },
  { main: '#84cc16', gradient: 'from-lime-500 to-green-600' },
  { main: '#f97316', gradient: 'from-orange-500 to-red-600' },
  { main: '#6366f1', gradient: 'from-indigo-500 to-violet-600' },
  { main: '#14b8a6', gradient: 'from-teal-500 to-emerald-600' },
];

const formatTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

// Unit conversion helpers
const KM_TO_MI = 0.621371;
const M_TO_FT = 3.28084;

const formatDistance = (km, useImperial) => {
  if (useImperial) {
    return `${(km * KM_TO_MI).toFixed(1)} mi`;
  }
  return `${km} km`;
};

const formatDistanceValue = (km, useImperial) => {
  if (useImperial) {
    return (km * KM_TO_MI).toFixed(1);
  }
  return typeof km === 'number' ? km.toFixed(1) : km;
};

const formatElevation = (m, useImperial) => {
  if (useImperial) {
    return `${Math.round(m * M_TO_FT).toLocaleString()} ft`;
  }
  return `${m.toLocaleString()}m`;
};

const formatElevationValue = (m, useImperial) => {
  if (useImperial) {
    return Math.round(m * M_TO_FT);
  }
  return m;
};

const getDistanceUnit = (useImperial) => useImperial ? 'mi' : 'km';
const getElevationUnit = (useImperial) => useImperial ? 'ft' : 'm';

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl ${hover ? 'hover:bg-white/10 hover:border-white/20 transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

// Reusable Day Summary Table component
const DaySummaryTable = ({
  dayData,
  totals,
  totalTimeSaved,
  activeShortcuts,
  scenario,
  formatTime,
  formatDate,
  useImperial = false,
  showEndAltitude = false,
  onRowClick,
  onRowHover,
  selectedDay,
  hoveredDay
}) => {
  // Calculate time saved for a specific day from shortcuts
  const getDayTimeSaved = (dayIndex) => {
    const prevEnd = dayIndex === 0 ? 0 : scenario.days[dayIndex - 1];
    const dayEnd = scenario.days[dayIndex];
    let timeSaved = 0;
    activeShortcuts.shortcuts.forEach(shortcut => {
      if (shortcut.fromId >= prevEnd && shortcut.fromId < dayEnd) {
        timeSaved += shortcut.timeSaved;
      }
    });
    return timeSaved;
  };

  const distUnit = getDistanceUnit(useImperial);
  const elevUnit = getElevationUnit(useImperial);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 text-xs uppercase tracking-wider">
            <th className="text-left py-2 px-3 font-medium">Day</th>
            <th className="text-left py-2 px-3 font-medium">Date</th>
            <th className="text-left py-2 px-3 font-medium">Route</th>
            <th className="text-right py-2 px-3 font-medium">Dist</th>
            <th className="text-right py-2 px-3 font-medium">Ascent</th>
            <th className="text-right py-2 px-3 font-medium">Descent</th>
            <th className="text-right py-2 px-3 font-medium">Time</th>
            {totalTimeSaved > 0 && <th className="text-right py-2 px-3 font-medium">Adj.</th>}
            {showEndAltitude && <th className="text-right py-2 px-3 font-medium">End Alt</th>}
          </tr>
        </thead>
        <tbody>
          {dayData.map((d, i) => {
            const dayTimeSaved = getDayTimeSaved(i);
            const adjustedTime = d.time - dayTimeSaved;
            const isSelected = selectedDay === i;
            const isHovered = hoveredDay === i;

            return (
              <tr
                key={i}
                className={`border-t border-white/5 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${
                  isSelected
                    ? 'bg-white/15 ring-1 ring-inset ring-white/20'
                    : isHovered
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                }`}
                onClick={() => onRowClick?.(i)}
                onMouseEnter={() => onRowHover?.(i)}
                onMouseLeave={() => onRowHover?.(null)}
              >
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length].main }} />
                    <span className="font-semibold text-white">{d.day}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-slate-400">{formatDate(d.date)}</td>
                <td className="py-3 px-3">
                  <span className="text-slate-300">{d.startWp.name}</span>
                  <span className="text-slate-600 mx-1.5">→</span>
                  <span className="text-slate-200">{d.endWp.name}</span>
                </td>
                <td className="py-3 px-3 text-right font-medium text-slate-200">{formatDistanceValue(d.distance, useImperial)} {distUnit}</td>
                <td className="py-3 px-3 text-right font-medium text-emerald-400">↑{formatElevationValue(d.ascent, useImperial)}{elevUnit}</td>
                <td className="py-3 px-3 text-right font-medium text-rose-400">↓{formatElevationValue(d.descent, useImperial)}{elevUnit}</td>
                <td className={`py-3 px-3 text-right font-medium ${dayTimeSaved > 0 ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {formatTime(d.time)}
                </td>
                {totalTimeSaved > 0 && (
                  <td className="py-3 px-3 text-right font-medium text-cyan-400">
                    {dayTimeSaved > 0 ? formatTime(adjustedTime) : '—'}
                  </td>
                )}
                {showEndAltitude && (
                  <td className="py-3 px-3 text-right text-slate-400">{formatElevationValue(d.endWp.altitude, useImperial)}{elevUnit}</td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-white/10 bg-white/5">
            <td className="py-3 px-3 font-semibold text-white" colSpan="3">Total</td>
            <td className="py-3 px-3 text-right font-semibold text-white">{formatDistanceValue(totals.distance, useImperial)} {distUnit}</td>
            <td className="py-3 px-3 text-right font-semibold text-emerald-400">↑{formatElevationValue(totals.ascent, useImperial)}{elevUnit}</td>
            <td className="py-3 px-3 text-right font-semibold text-rose-400">↓{formatElevationValue(totals.descent, useImperial)}{elevUnit}</td>
            <td className={`py-3 px-3 text-right font-semibold ${totalTimeSaved > 0 ? 'text-slate-500 line-through' : 'text-white'}`}>
              {formatTime(totals.time)}
            </td>
            {totalTimeSaved > 0 && (
              <td className="py-3 px-3 text-right font-semibold text-cyan-400">
                {formatTime(totals.time - totalTimeSaved)}
              </td>
            )}
            {showEndAltitude && <td className="py-3 px-3"></td>}
          </tr>
          {totalTimeSaved > 0 && (
            <tr className="border-t border-cyan-500/20 bg-cyan-500/5">
              <td className="py-3 px-3 text-cyan-400" colSpan="3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Shortcuts Active</span>
                </div>
              </td>
              <td colSpan="3"></td>
              <td className="py-3 px-3 text-right text-cyan-400">-{formatTime(totalTimeSaved)}</td>
              {totalTimeSaved > 0 && <td></td>}
              <td className="py-3 px-3 text-right text-amber-400">
                €{activeShortcuts.totalCost}
              </td>
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
};

const SightIcon = ({ type, className = "w-4 h-4" }) => {
  const icons = {
    viewpoint: Eye,
    lake: Waves,
    glacier: Mountain,
    historical: Landmark,
    chapel: Church,
    wildlife: Bird,
    photo: Camera,
  };
  const Icon = icons[type] || MapPin;
  return <Icon className={className} />;
};

const ShortcutIcon = ({ type, className = "w-4 h-4" }) => {
  const icons = {
    cable_car: CableCar,
    bus: Bus,
    alternate_route: Route,
  };
  const Icon = icons[type] || Zap;
  return <Icon className={className} />;
};

const getPositionLabel = (position) => {
  if (position <= 0.33) return 'Early';
  if (position <= 0.66) return 'Midway';
  return 'Late';
};

const groupByPosition = (items) => {
  const groups = { Early: [], Midway: [], Late: [] };
  items.forEach(item => {
    const label = getPositionLabel(item.position);
    groups[label].push(item);
  });
  return groups;
};

const SubSegment = ({ fromWp, toWp, segmentKey, selectedShortcuts, onShortcutToggle }) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedSight, setExpandedSight] = useState(null);

  const segment = segmentData[segmentKey];
  if (!segment) return null;

  const distance = (toWp.cumDist - fromWp.cumDist).toFixed(1);
  const time = toWp.cumTime - fromWp.cumTime;
  const ascent = toWp.ascent - fromWp.ascent;
  const descent = toWp.descent - fromWp.descent;

  const sightGroups = groupByPosition(segment.sights || []);
  const foodGroups = groupByPosition(segment.foodStops || []);
  const shortcutGroups = groupByPosition(segment.shortcuts || []);

  const hasSights = segment.sights?.length > 0;
  const hasFood = segment.foodStops?.length > 0;
  const hasShortcuts = segment.shortcuts?.length > 0;

  return (
    <div className="border-l-2 border-white/10 ml-4 pl-4 py-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 text-left group"
      >
        <div className="text-slate-500 group-hover:text-slate-300 transition-colors">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">{fromWp.name}</span>
            <span className="text-slate-600">→</span>
            <span className="text-slate-200">{toWp.name}</span>
          </div>
          <div className="flex gap-4 text-xs text-slate-500 mt-1">
            <span>{distance} km</span>
            <span className="text-emerald-500/70">↑{ascent}m</span>
            <span className="text-rose-500/70">↓{descent}m</span>
            <span>{formatTime(time)}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {/* Sights Section */}
          {hasSights && (
            <div className="rounded-xl bg-white/5 overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'sights' ? null : 'sights')}
                className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300">Sights</span>
                  <span className="text-slate-500 text-xs">({segment.sights.length})</span>
                </div>
                {expandedSection === 'sights' ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
              </button>

              {expandedSection === 'sights' && (
                <div className="px-4 pb-3 space-y-3">
                  {Object.entries(sightGroups).map(([label, sights]) =>
                    sights.length > 0 && (
                      <div key={label}>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</div>
                        {sights.map((sight, idx) => (
                          <div key={idx} className="mb-2">
                            <button
                              onClick={() => setExpandedSight(expandedSight === `${segmentKey}-${idx}` ? null : `${segmentKey}-${idx}`)}
                              className="w-full text-left flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              <SightIcon type={sight.type} className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-slate-200">{sight.name}</div>
                                <div className="text-xs text-slate-500">{sight.description}</div>
                              </div>
                              {sight.photoRating >= 4 && (
                                <div className="text-xs text-amber-400">★{sight.photoRating}</div>
                              )}
                            </button>
                            {expandedSight === `${segmentKey}-${idx}` && (
                              <div className="ml-6 mt-2 p-3 rounded-lg bg-white/5 text-xs text-slate-400">
                                {sight.detailedDescription}
                                {sight.timeToVisit > 0 && (
                                  <div className="mt-2 text-slate-500">
                                    Time to visit: ~{sight.timeToVisit} min
                                    {sight.distanceOffTrail > 0 && ` • ${sight.distanceOffTrail}km off trail`}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Food & Refuges Section */}
          {hasFood && (
            <div className="rounded-xl bg-white/5 overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'food' ? null : 'food')}
                className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-orange-400" />
                  <span className="text-slate-300">Food & Refuges</span>
                  <span className="text-slate-500 text-xs">({segment.foodStops.length})</span>
                </div>
                {expandedSection === 'food' ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
              </button>

              {expandedSection === 'food' && (
                <div className="px-4 pb-3 space-y-3">
                  {Object.entries(foodGroups).map(([label, foods]) =>
                    foods.length > 0 && (
                      <div key={label}>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</div>
                        {foods.map((food, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                            {food.type === 'refuge' ? (
                              <Home className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                            ) : (
                              <Utensils className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-200">{food.name}</span>
                                <span className="text-xs text-slate-500">{food.priceRange}</span>
                              </div>
                              <div className="text-xs text-slate-500">{food.description}</div>
                              {food.specialty && (
                                <div className="text-xs text-orange-400/70 mt-1">★ {food.specialty}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Shortcuts Section */}
          {hasShortcuts && (
            <div className="rounded-xl bg-white/5 overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'shortcuts' ? null : 'shortcuts')}
                className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300">Shortcuts</span>
                  <span className="text-slate-500 text-xs">({segment.shortcuts.length})</span>
                </div>
                {expandedSection === 'shortcuts' ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
              </button>

              {expandedSection === 'shortcuts' && (
                <div className="px-4 pb-3 space-y-3">
                  {Object.entries(shortcutGroups).map(([label, shortcuts]) =>
                    shortcuts.length > 0 && (
                      <div key={label}>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</div>
                        {shortcuts.map((shortcut, idx) => {
                          const shortcutId = `${segmentKey}-${shortcut.name}`;
                          const isSelected = selectedShortcuts[shortcutId];

                          return (
                            <div key={idx} className={`p-3 rounded-lg transition-colors ${isSelected ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-white/5'}`}>
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => onShortcutToggle(shortcutId, shortcut.timeSaved)}
                                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'bg-cyan-500 border-cyan-500'
                                      : 'border-slate-500 hover:border-cyan-400'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <ShortcutIcon type={shortcut.type} className="w-4 h-4 text-cyan-400" />
                                    <span className="text-sm text-slate-200">{shortcut.name}</span>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">{shortcut.description}</div>
                                  <div className="flex flex-wrap gap-3 mt-2 text-xs">
                                    {shortcut.timeSaved > 0 && (
                                      <span className="text-cyan-400">Saves {formatTime(shortcut.timeSaved)}</span>
                                    )}
                                    {shortcut.cost > 0 && (
                                      <span className="text-slate-400">€{shortcut.cost}</span>
                                    )}
                                  </div>
                                  {shortcut.skipsToWaypoint && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-amber-400">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>Skips to {WAYPOINTS[shortcut.skipsToWaypoint]?.name}</span>
                                    </div>
                                  )}
                                  {shortcut.considerations && (
                                    <div className="text-xs text-slate-500 mt-2 italic">{shortcut.considerations}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const EndpointDropdown = ({ value, options, onChange, formatTime }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Calculate menu position and close on outside click
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }

    const handleClickOutside = (event) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        menuRef.current && !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative w-56">
      {/* Closed state - shows only name */}
      <button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`w-full bg-white/5 border px-3 py-1.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors flex items-center justify-between gap-2 ${
          isOpen ? 'border-emerald-500/50' : 'border-white/10'
        }`}
      >
        <span className="truncate">{selectedOption?.name || 'Select...'}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Open state - portal dropdown menu */}
      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed w-80 max-h-64 overflow-y-auto rounded-xl"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            backgroundColor: 'rgb(15, 23, 42)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            zIndex: 9999
          }}
        >
          {options.map((opt, index) => (
            <button
              key={opt.id}
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt.id);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between gap-3 ${
                opt.id === value
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-200 hover:bg-white/10'
              } ${index === 0 ? 'rounded-t-xl' : ''} ${index === options.length - 1 ? 'rounded-b-xl' : ''}`}
            >
              <span className="font-medium truncate">{opt.name}</span>
              <span className="text-xs text-slate-400 shrink-0">
                {opt.dist}km · {formatTime(opt.time)}
              </span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

const ExpandableDayCard = ({ day, dayIndex, color, activeScenario, updateDay, removeDay, selectedShortcuts, onShortcutToggle, useImperial }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('segments');
  const [expandedSightId, setExpandedSightId] = useState(null);

  const prevEnd = dayIndex === 0 ? 0 : activeScenario.days[dayIndex - 1];
  const availableWaypoints = WAYPOINTS.filter((w, i) => i > prevEnd);

  // Get all sub-segments for this day
  const subSegments = useMemo(() => {
    const segments = [];
    for (let wpIdx = prevEnd; wpIdx < activeScenario.days[dayIndex]; wpIdx++) {
      segments.push({
        fromWp: WAYPOINTS[wpIdx],
        toWp: WAYPOINTS[wpIdx + 1],
        segmentKey: `${wpIdx}-${wpIdx + 1}`
      });
    }
    return segments;
  }, [prevEnd, activeScenario.days, dayIndex]);

  // Aggregate all data for the day
  const dayData = useMemo(() => {
    const totalSegments = subSegments.length;
    let allSights = [];
    let allFood = [];
    let allShortcuts = [];

    subSegments.forEach((seg, segIndex) => {
      const segment = segmentData[seg.segmentKey];
      if (!segment) return;

      // Calculate day-wide position for each item
      const segmentStartPosition = segIndex / totalSegments;
      const segmentEndPosition = (segIndex + 1) / totalSegments;

      if (segment.sights) {
        segment.sights.forEach(sight => {
          const dayPosition = segmentStartPosition + (sight.position * (segmentEndPosition - segmentStartPosition));
          allSights.push({
            ...sight,
            dayPosition,
            segmentKey: seg.segmentKey,
            segmentLabel: `${seg.fromWp.name} → ${seg.toWp.name}`
          });
        });
      }

      if (segment.foodStops) {
        segment.foodStops.forEach(food => {
          const dayPosition = segmentStartPosition + (food.position * (segmentEndPosition - segmentStartPosition));
          allFood.push({
            ...food,
            dayPosition,
            segmentKey: seg.segmentKey,
            segmentLabel: `${seg.fromWp.name} → ${seg.toWp.name}`
          });
        });
      }

      if (segment.shortcuts) {
        segment.shortcuts.forEach(shortcut => {
          const shortcutId = `${seg.segmentKey}-${shortcut.name}`;
          allShortcuts.push({
            ...shortcut,
            shortcutId,
            segmentKey: seg.segmentKey,
            segmentLabel: `${seg.fromWp.name} → ${seg.toWp.name}`,
            isSelected: !!selectedShortcuts[shortcutId]
          });
        });
      }
    });

    // Sort by day position
    allSights.sort((a, b) => a.dayPosition - b.dayPosition);
    allFood.sort((a, b) => a.dayPosition - b.dayPosition);

    return { allSights, allFood, allShortcuts };
  }, [subSegments, selectedShortcuts]);

  // Calculate time saved from shortcuts for this day's segments
  const timeSaved = useMemo(() => {
    return dayData.allShortcuts
      .filter(s => s.isSelected)
      .reduce((sum, s) => sum + s.timeSaved, 0);
  }, [dayData.allShortcuts]);

  const adjustedTime = day.time - timeSaved;

  // Group items by day position
  const getDayPositionLabel = (pos) => {
    if (pos <= 0.33) return 'Early in day';
    if (pos <= 0.66) return 'Midway';
    return 'Late in day';
  };

  const groupByDayPosition = (items) => {
    const groups = { 'Early in day': [], 'Midway': [], 'Late in day': [] };
    items.forEach(item => {
      const label = getDayPositionLabel(item.dayPosition);
      groups[label].push(item);
    });
    return groups;
  };

  return (
    <GlassCard className="p-4 group" hover>
      {/* Main row with CSS grid for consistent column alignment */}
      <div
        className="grid items-center gap-3 cursor-pointer"
        style={{ gridTemplateColumns: '3rem 5.5rem 9rem 1.5rem 14rem 3.5rem 4rem 4rem 4.5rem auto' }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Column 1: Day badge */}
        <div
          className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 bg-gradient-to-br ${color.gradient} shadow-lg`}
          style={{ boxShadow: `0 8px 24px -8px ${color.main}50` }}
        >
          <span className="text-[9px] uppercase tracking-wider opacity-80">Day</span>
          <span className="text-lg font-bold -mt-0.5">{day.day}</span>
        </div>

        {/* Column 2: Date */}
        <div className="text-xs text-slate-500">{formatDate(day.date)}</div>

        {/* Column 3: Start location (fixed width) */}
        <div className="flex items-center">
          <span className="font-medium text-slate-200 truncate">{day.startWp.name}</span>
        </div>

        {/* Arrow between start and end */}
        <div className="flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>

        {/* Column 4: End dropdown (fixed width) */}
        <EndpointDropdown
          value={activeScenario.days[dayIndex]}
          options={availableWaypoints.map(wp => ({
            id: wp.id,
            name: wp.name,
            dist: (wp.cumDist - WAYPOINTS[prevEnd].cumDist).toFixed(1),
            time: wp.cumTime - WAYPOINTS[prevEnd].cumTime
          }))}
          onChange={(newValue) => updateDay(dayIndex, newValue)}
          formatTime={formatTime}
        />

        {/* Column 5: Distance */}
        <div className="text-center hidden sm:block">
          <div className="font-semibold text-slate-200 text-sm">{formatDistanceValue(day.distance, useImperial)}</div>
          <div className="text-[10px] text-slate-500">{getDistanceUnit(useImperial)}</div>
        </div>

        {/* Column 6: Elevation up */}
        <div className="text-center hidden sm:block">
          <div className="font-semibold text-emerald-400 text-sm">↑{formatElevationValue(day.ascent, useImperial)}</div>
          <div className="text-[10px] text-slate-500">{getElevationUnit(useImperial)}</div>
        </div>

        {/* Column 7: Elevation down */}
        <div className="text-center hidden sm:block">
          <div className="font-semibold text-rose-400 text-sm">↓{formatElevationValue(day.descent, useImperial)}</div>
          <div className="text-[10px] text-slate-500">{getElevationUnit(useImperial)}</div>
        </div>

        {/* Column 8: Time */}
        <div className="text-center hidden sm:block">
          <div className={`font-semibold text-sm ${timeSaved > 0 ? 'text-cyan-400' : 'text-slate-200'}`}>
            {formatTime(adjustedTime)}
          </div>
          <div className="text-[10px] text-slate-500">
            {timeSaved > 0 ? (
              <span className="text-cyan-400/70">-{formatTime(timeSaved)}</span>
            ) : 'hike'}
          </div>
        </div>

        {/* Column 9: Expand arrow + delete */}
        <div className="flex items-center gap-1 justify-end">
          <div className="text-slate-500">
            {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); removeDay(dayIndex); }}
            className="w-7 h-7 rounded-full text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10">
          {/* Tab bar */}
          <div className="flex gap-1 mb-4 pb-3 border-b border-white/5">
            {[
              { id: 'segments', label: 'By Segment' },
              { id: 'sights', label: 'All Sights', count: dayData.allSights.length },
              { id: 'food', label: 'Food & Refuges', count: dayData.allFood.length },
              { id: 'shortcuts', label: 'Shortcuts', count: dayData.allShortcuts.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 text-slate-500">({tab.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'segments' && (
            <div className="space-y-1">
              {subSegments.map((seg, idx) => (
                <SubSegment
                  key={idx}
                  fromWp={seg.fromWp}
                  toWp={seg.toWp}
                  segmentKey={seg.segmentKey}
                  selectedShortcuts={selectedShortcuts}
                  onShortcutToggle={onShortcutToggle}
                />
              ))}
            </div>
          )}

          {activeTab === 'sights' && (
            <div className="space-y-4">
              {dayData.allSights.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4">No sights on this day</div>
              ) : (
                Object.entries(groupByDayPosition(dayData.allSights)).map(([label, sights]) =>
                  sights.length > 0 && (
                    <div key={label}>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label}</div>
                      <div className="space-y-2">
                        {sights.map((sight, idx) => {
                          const sightId = `${sight.segmentKey}-${sight.name}`;
                          const isExpanded = expandedSightId === sightId;
                          return (
                            <div key={idx} className="rounded-xl bg-white/5 overflow-hidden">
                              <button
                                onClick={(e) => { e.stopPropagation(); setExpandedSightId(isExpanded ? null : sightId); }}
                                className="w-full p-3 flex items-start gap-3 text-left hover:bg-white/5 transition-colors"
                              >
                                <SightIcon type={sight.type} className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-200">{sight.name}</span>
                                    {sight.photoRating >= 4 && (
                                      <span className="text-xs text-amber-400">★{sight.photoRating}</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">{sight.description}</div>
                                  <div className="text-[10px] text-slate-600 mt-1">{sight.segmentLabel}</div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                              {isExpanded && (
                                <div className="px-3 pb-3 pt-0">
                                  <div className="p-3 rounded-lg bg-white/5 text-xs text-slate-400">
                                    {sight.detailedDescription}
                                    {sight.timeToVisit > 0 && (
                                      <div className="mt-2 text-slate-500">
                                        Time to visit: ~{sight.timeToVisit} min
                                        {sight.distanceOffTrail > 0 && ` • ${sight.distanceOffTrail}km off trail`}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          )}

          {activeTab === 'food' && (
            <div className="space-y-2">
              {dayData.allFood.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4">No food stops on this day</div>
              ) : (
                dayData.allFood.map((food, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                    {food.type === 'refuge' ? (
                      <Home className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    ) : (
                      <Utensils className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-200">{food.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          food.type === 'refuge' ? 'bg-orange-500/20 text-orange-400' :
                          food.type === 'restaurant' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {food.type}
                        </span>
                        <span className="text-xs text-slate-500">{food.priceRange}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{food.description}</div>
                      {food.specialty && (
                        <div className="text-xs text-orange-400/70 mt-1">★ {food.specialty}</div>
                      )}
                      <div className="text-[10px] text-slate-600 mt-1">{food.segmentLabel}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              {dayData.allShortcuts.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4">No shortcuts available on this day</div>
              ) : (
                <>
                  {timeSaved > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                      <span className="text-sm text-cyan-400">Time saved with selected shortcuts</span>
                      <span className="text-sm font-semibold text-cyan-400">{formatTime(timeSaved)}</span>
                    </div>
                  )}
                  {dayData.allShortcuts.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl transition-colors ${
                        shortcut.isSelected ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-white/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); onShortcutToggle(shortcut.shortcutId, shortcut.timeSaved); }}
                          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            shortcut.isSelected
                              ? 'bg-cyan-500 border-cyan-500'
                              : 'border-slate-500 hover:border-cyan-400'
                          }`}
                        >
                          {shortcut.isSelected && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <ShortcutIcon type={shortcut.type} className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-medium text-slate-200">{shortcut.name}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{shortcut.description}</div>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs">
                            {shortcut.timeSaved > 0 && (
                              <span className="text-cyan-400">Saves {formatTime(shortcut.timeSaved)}</span>
                            )}
                            {shortcut.cost > 0 && (
                              <span className="text-slate-400">€{shortcut.cost}</span>
                            )}
                          </div>
                          {shortcut.skipsToWaypoint && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-amber-400">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Skips to {WAYPOINTS[shortcut.skipsToWaypoint]?.name}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-600 mt-1">{shortcut.segmentLabel}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Mobile stats */}
          <div className="sm:hidden grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <div className="font-semibold text-slate-200">{day.distance}</div>
              <div className="text-xs text-slate-500">km</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-emerald-400">↑{day.ascent}</div>
              <div className="text-xs text-slate-500">m</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-rose-400">↓{day.descent}</div>
              <div className="text-xs text-slate-500">m</div>
            </div>
            <div className="text-center">
              <div className={`font-semibold ${timeSaved > 0 ? 'text-cyan-400' : 'text-slate-200'}`}>
                {formatTime(adjustedTime)}
              </div>
              <div className="text-xs text-slate-500">hike</div>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

const DeleteConfirmModal = ({ isOpen, dayNumber, startName, endName, onCancel, onConfirm }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative max-w-md w-full p-6 rounded-2xl border border-white/10 shadow-2xl transition-all duration-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(24px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white mb-2">
          Delete Day {dayNumber}?
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          This will remove <span className="text-slate-200">{startName}</span> → <span className="text-slate-200">{endName}</span> from your itinerary. The segments will be merged with the next day.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ShareModal = ({ isOpen, shareUrl, onClose, onCopy }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      setCopied(false);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback for older browsers
      if (inputRef.current) {
        inputRef.current.select();
        document.execCommand('copy');
        setCopied(true);
        onCopy();
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative max-w-lg w-full p-6 rounded-2xl border border-white/10 shadow-2xl transition-all duration-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(24px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Share Itinerary</h3>
            <p className="text-slate-400 text-xs">Anyone with this link can view this trip</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Shareable Link</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={shareUrl}
                readOnly
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                onClick={(e) => e.target.select()}
              />
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
          <p className="text-xs text-slate-400">
            This link contains a snapshot of your current itinerary. Changes you make won't affect shared links, and changes others make won't affect your saved version.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

const Toast = ({ message, type = 'info', isVisible, icon }) => {
  if (!isVisible) return null;

  const colors = {
    success: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    error: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-400',
    info: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
  };

  return createPortal(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div
        className={`px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 bg-gradient-to-r ${colors[type]}`}
      >
        {icon}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>,
    document.body
  );
};

// Map controls component for reset view
// Calculate bounds from all waypoints
const getRouteBounds = () => {
  const lats = WAYPOINTS.map(wp => wp.lat);
  const lngs = WAYPOINTS.map(wp => wp.lng);
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  ];
};

const ROUTE_BOUNDS = getRouteBounds();

// Component to fit map to route bounds on load
const FitBoundsOnLoad = () => {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(ROUTE_BOUNDS, { padding: [40, 40] });
  }, [map]);

  return null;
};

// Component to track zoom level for dynamic styling
const ZoomTracker = ({ onZoomChange }) => {
  const map = useMap();

  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };

    // Set initial zoom
    handleZoom();

    map.on('zoomend', handleZoom);
    return () => map.off('zoomend', handleZoom);
  }, [map, onZoomChange]);

  return null;
};

const MapControls = ({ onFitRoute }) => {
  const map = useMap();

  const handleFitRoute = () => {
    map.fitBounds(ROUTE_BOUNDS, { padding: [40, 40] });
    if (onFitRoute) onFitRoute();
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '10px', marginRight: '10px' }}>
      <div className="leaflet-control">
        <button
          onClick={handleFitRoute}
          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
          title="Fit entire route"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Get country for a waypoint based on latitude/longitude
const getCountryForWaypoint = (wp) => {
  // Approximate country boundaries for TMB
  // France: west side, Italy: south/east, Switzerland: north/east
  if (wp.lat < 45.75) return '🇫🇷'; // Southern part is France/Italy border
  if (wp.lng > 7.0) return '🇨🇭'; // Eastern part is Switzerland
  if (wp.lat > 45.9 && wp.lng < 6.95) return '🇫🇷'; // Northwest is France
  if (wp.lat < 45.85 && wp.lng > 6.8) return '🇮🇹'; // Southeast is Italy
  return '🇫🇷'; // Default to France
};

// Get countries passed through for a day
const getCountriesForDay = (startIdx, endIdx) => {
  const countries = new Set();
  for (let i = startIdx; i <= endIdx; i++) {
    countries.add(getCountryForWaypoint(WAYPOINTS[i]));
  }
  return Array.from(countries);
};

// Segment Detail Modal
const SegmentDetailModal = ({ isOpen, dayIndex, dayData, scenario, formatTime, formatDate, onClose, onShortcutToggle, selectedShortcuts }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen || dayIndex === null || !dayData[dayIndex]) return null;

  const d = dayData[dayIndex];
  const prevEnd = dayIndex === 0 ? 0 : scenario.days[dayIndex - 1];
  const currentEnd = scenario.days[dayIndex];
  const color = DAY_COLORS[dayIndex % DAY_COLORS.length].main;

  // Get waypoints for this day
  const waypoints = [];
  for (let i = prevEnd; i <= currentEnd; i++) {
    waypoints.push(WAYPOINTS[i]);
  }

  // Get segment data for sights, food, and shortcuts
  const segmentDetails = [];
  for (let i = prevEnd; i < currentEnd; i++) {
    const seg = segmentData[i];
    if (seg) segmentDetails.push({ ...seg, fromId: i });
  }

  // Aggregate sights
  const allSights = segmentDetails.flatMap(seg => seg.sights || []).slice(0, 5);

  // Aggregate food stops
  const allFood = segmentDetails.flatMap(seg => seg.food || []).slice(0, 4);

  // Aggregate shortcuts
  const allShortcuts = segmentDetails.flatMap(seg =>
    (seg.shortcuts || []).map(sc => ({ ...sc, segmentFromId: seg.fromId }))
  );

  const countries = getCountriesForDay(prevEnd, currentEnd);

  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className={`relative max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 rounded-2xl border border-white/10 shadow-2xl transition-all duration-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(24px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: color }}
          >
            {d.day}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Day {d.day}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>{formatDate(d.date)}</span>
              <span>·</span>
              <span>{countries.join(' ')}</span>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="mb-4 p-3 rounded-lg bg-white/5">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Route</div>
          <div className="text-slate-200">
            {d.startWp.name} <span className="text-slate-500">→</span> {d.endWp.name}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <div className="text-lg font-semibold text-white">{d.distance}</div>
            <div className="text-xs text-slate-500">km</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <div className="text-lg font-semibold text-emerald-400">↑{d.ascent}</div>
            <div className="text-xs text-slate-500">m gain</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <div className="text-lg font-semibold text-rose-400">↓{d.descent}</div>
            <div className="text-xs text-slate-500">m loss</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <div className="text-lg font-semibold text-white">{formatTime(d.time)}</div>
            <div className="text-xs text-slate-500">time</div>
          </div>
        </div>

        {/* Waypoints */}
        <div className="mb-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Waypoints ({waypoints.length})</div>
          <div className="flex flex-wrap gap-1.5">
            {waypoints.map((wp, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-300">
                {wp.name} ({wp.altitude}m)
              </span>
            ))}
          </div>
        </div>

        {/* Sights */}
        {allSights.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Highlights</div>
            <div className="space-y-2">
              {allSights.map((sight, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{sight.icon}</span>
                  <span className="text-slate-300">{sight.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Food Stops */}
        {allFood.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Food & Refuges</div>
            <div className="space-y-2">
              {allFood.map((food, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{food.type === 'refuge' ? '🏠' : '🍽️'}</span>
                  <span className="text-slate-300">{food.name}</span>
                  {food.altitude && <span className="text-xs text-slate-500">{food.altitude}m</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shortcuts */}
        {allShortcuts.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Shortcuts Available</div>
            <div className="space-y-2">
              {allShortcuts.map((shortcut, i) => {
                const shortcutId = `${shortcut.segmentFromId}-${shortcut.name}`;
                const isSelected = selectedShortcuts[shortcutId];
                const isCableCar = shortcut.type === 'cable_car';
                const isBus = shortcut.type === 'bus';
                const scColor = isCableCar ? '#22d3ee' : isBus ? '#fbbf24' : '#a78bfa';

                return (
                  <button
                    key={i}
                    onClick={() => onShortcutToggle(shortcutId, shortcut.timeSaved)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-white/10 border-white/20'
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{isCableCar ? '🚡' : isBus ? '🚌' : '↗️'}</span>
                      <div className="text-left">
                        <div className="text-sm text-slate-200">{shortcut.name}</div>
                        <div className="text-xs text-slate-500">{shortcut.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm" style={{ color: scColor }}>-{formatTime(shortcut.timeSaved)}</div>
                        {shortcut.cost > 0 && <div className="text-xs text-amber-400">€{shortcut.cost}</div>}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// Trail Map component using Leaflet
const TrailMap = ({ dayData, activeShortcuts, formatTime, formatDate, scenario, selectedShortcuts, onShortcutToggle, totals, totalTimeSaved, useImperial }) => {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(11);

  // Dynamic line weight based on zoom level
  const getLineWeight = (isSelected, isHovered) => {
    if (isSelected) return currentZoom < 11 ? 5 : 7;
    if (isHovered) return currentZoom < 11 ? 4 : 6;
    // Thinner lines when zoomed out to prevent "red blob"
    if (currentZoom < 10) return 2;
    if (currentZoom < 11) return 3;
    return 4;
  };

  // Dynamic opacity based on zoom level
  const getBaseOpacity = () => {
    if (currentZoom < 10) return 0.7;
    return 0.85;
  };

  // Build route segments for each day
  const daySegments = useMemo(() => {
    if (!scenario || !dayData.length) return [];

    return dayData.map((d, i) => {
      const prevEnd = i === 0 ? 0 : scenario.days[i - 1];
      const currentEnd = scenario.days[i];

      // Get all waypoints for this day's segment
      const positions = [];
      for (let j = prevEnd; j <= currentEnd; j++) {
        const wp = WAYPOINTS[j];
        if (wp && wp.lat && wp.lng) {
          positions.push([wp.lat, wp.lng]);
        }
      }

      return {
        day: i + 1,
        positions,
        color: DAY_COLORS[i % DAY_COLORS.length].main,
        startWp: WAYPOINTS[prevEnd],
        endWp: WAYPOINTS[currentEnd],
        distance: d.distance,
        time: d.time
      };
    });
  }, [dayData, scenario]);

  // Build shortcut lines
  const shortcutLines = useMemo(() => {
    if (!activeShortcuts?.shortcuts) return [];

    return activeShortcuts.shortcuts.map(shortcut => {
      const startWp = WAYPOINTS[shortcut.fromId];
      const endWp = WAYPOINTS.find(w => w.name.toLowerCase().includes(shortcut.skipsToWaypoint?.toLowerCase() || '')) ||
                    WAYPOINTS[shortcut.fromId + 1];

      if (!startWp || !endWp) return null;

      const isCableCar = shortcut.type === 'cable_car';
      const isBus = shortcut.type === 'bus';
      const color = isCableCar ? '#22d3ee' : isBus ? '#fbbf24' : '#a78bfa';

      return {
        positions: [[startWp.lat, startWp.lng], [endWp.lat, endWp.lng]],
        color,
        name: shortcut.name,
        type: shortcut.type,
        dashArray: isCableCar ? '10, 6' : isBus ? '6, 6' : '4, 4'
      };
    }).filter(Boolean);
  }, [activeShortcuts]);

  // Day endpoint markers
  const dayMarkers = useMemo(() => {
    return dayData.map((d, i) => ({
      position: [d.endWp.lat, d.endWp.lng],
      day: i + 1,
      color: DAY_COLORS[i % DAY_COLORS.length].main,
      name: d.endWp.name,
      altitude: d.endWp.altitude,
      distance: d.distance,
      time: d.time
    }));
  }, [dayData]);

  // Handle segment click
  const handleSegmentClick = (dayIndex) => {
    setSelectedDay(dayIndex);
    setShowDetailModal(true);
  };

  // Handle click outside to deselect
  const handleMapClick = () => {
    setSelectedDay(null);
  };

  // Get shortcut icon positions for map
  const shortcutIcons = useMemo(() => {
    const icons = [];
    dayData.forEach((d, dayIdx) => {
      const prevEnd = dayIdx === 0 ? 0 : scenario.days[dayIdx - 1];
      const currentEnd = scenario.days[dayIdx];

      for (let i = prevEnd; i < currentEnd; i++) {
        const seg = segmentData[i];
        if (seg?.shortcuts) {
          seg.shortcuts.forEach(shortcut => {
            const wp = WAYPOINTS[i];
            const shortcutId = `${i}-${shortcut.name}`;
            const isSelected = selectedShortcuts[shortcutId];
            icons.push({
              position: [wp.lat, wp.lng],
              shortcut,
              shortcutId,
              isSelected,
              dayIdx,
              segmentFromId: i
            });
          });
        }
      }
    });
    return icons;
  }, [dayData, scenario, selectedShortcuts]);

  return (
    <div>
      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden" style={{ height: '500px' }}>
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          className="h-full w-full"
          style={{ background: '#1e293b' }}
          zoomControl={true}
          minZoom={9}
          maxZoom={15}
        >
          {/* Fit to route bounds on load */}
          <FitBoundsOnLoad />

          {/* Track zoom level for dynamic styling */}
          <ZoomTracker onZoomChange={setCurrentZoom} />

          {/* Topographic tile layer */}
          <TileLayer
            attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            maxZoom={15}
          />

          {/* Route segments by day */}
          {daySegments.map((segment, i) => {
            const isSelected = selectedDay === i;
            const isHovered = hoveredDay === i;
            const hasSelection = selectedDay !== null;
            const baseOpacity = getBaseOpacity();
            const opacity = hasSelection
              ? (isSelected ? 1 : 0.2)
              : (hoveredDay === null || isHovered ? baseOpacity : 0.35);

            return (
              <Polyline
                key={`route-${i}`}
                positions={segment.positions}
                pathOptions={{
                  color: isSelected ? '#fff' : segment.color,
                  weight: getLineWeight(isSelected, isHovered),
                  opacity,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
                eventHandlers={{
                  mouseover: () => setHoveredDay(i),
                  mouseout: () => setHoveredDay(null),
                  click: (e) => {
                    e.originalEvent.stopPropagation();
                    handleSegmentClick(i);
                  }
                }}
              >
                <Tooltip sticky>
                  <div className="font-sans">
                    <div className="font-semibold">Day {segment.day}</div>
                    <div className="text-xs text-gray-600">
                      {segment.startWp.name} → {segment.endWp.name}
                    </div>
                    <div className="text-xs mt-1">
                      {segment.distance} km · {formatTime(segment.time)}
                    </div>
                    <div className="text-xs text-blue-500 mt-1">Click for details</div>
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

          {/* Shortcut lines */}
          {shortcutLines.map((line, i) => (
            <Polyline
              key={`shortcut-${i}`}
              positions={line.positions}
              pathOptions={{
                color: line.color,
                weight: currentZoom < 10 ? 2 : currentZoom < 11 ? 3 : 4,
                opacity: selectedDay !== null ? 0.4 : 0.8,
                dashArray: line.dashArray,
                lineCap: 'round'
              }}
            >
              <Tooltip>
                <div className="font-sans">
                  <div className="font-semibold flex items-center gap-1">
                    {line.type === 'cable_car' ? '🚡' : line.type === 'bus' ? '🚌' : '↗️'}
                    {line.name}
                  </div>
                  <div className="text-xs text-gray-600 capitalize">{line.type.replace('_', ' ')}</div>
                </div>
              </Tooltip>
            </Polyline>
          ))}

          {/* Shortcut opportunity icons */}
          {shortcutIcons.map((icon, i) => {
            const isCableCar = icon.shortcut.type === 'cable_car';
            const isBus = icon.shortcut.type === 'bus';
            const color = isCableCar ? '#22d3ee' : isBus ? '#fbbf24' : '#a78bfa';

            return (
              <CircleMarker
                key={`shortcut-icon-${i}`}
                center={icon.position}
                radius={icon.isSelected ? 10 : 7}
                pathOptions={{
                  color: '#0f172a',
                  weight: 2,
                  fillColor: icon.isSelected ? color : '#475569',
                  fillOpacity: icon.isSelected ? 1 : 0.7
                }}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent.stopPropagation();
                    handleSegmentClick(icon.dayIdx);
                  }
                }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  <div className="font-sans">
                    <div className="font-semibold flex items-center gap-1">
                      {isCableCar ? '🚡' : isBus ? '🚌' : '↗️'}
                      {icon.shortcut.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      Saves {formatTime(icon.shortcut.timeSaved)}
                      {icon.shortcut.cost > 0 && ` · €${icon.shortcut.cost}`}
                    </div>
                    <div className="text-xs mt-1">
                      {icon.isSelected ? '✓ Selected' : 'Click to view options'}
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}

          {/* Start marker */}
          <CircleMarker
            center={[WAYPOINTS[0].lat, WAYPOINTS[0].lng]}
            radius={10}
            pathOptions={{
              color: '#0f172a',
              weight: 3,
              fillColor: '#10b981',
              fillOpacity: 1
            }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            <span className="font-semibold text-xs">START</span>
          </Tooltip>
        </CircleMarker>

        {/* Day endpoint markers */}
        {dayMarkers.map((marker, i) => (
          <CircleMarker
            key={`marker-${i}`}
            center={marker.position}
            radius={hoveredDay === i ? 10 : 8}
            pathOptions={{
              color: '#0f172a',
              weight: 2,
              fillColor: marker.color,
              fillOpacity: 1
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              <div className="font-sans">
                <div className="font-semibold">Day {marker.day}: {marker.name}</div>
                <div className="text-xs text-gray-600">
                  {marker.altitude}m · {marker.distance} km · {formatTime(marker.time)}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Mont Blanc marker */}
        <CircleMarker
          center={[MONT_BLANC.lat, MONT_BLANC.lng]}
          radius={6}
          pathOptions={{
            color: '#64748b',
            weight: 1,
            fillColor: '#f8fafc',
            fillOpacity: 0.9
          }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            <div className="font-sans text-center">
              <div className="font-semibold">Mont Blanc</div>
              <div className="text-xs text-gray-600">{MONT_BLANC.altitude}m</div>
            </div>
          </Tooltip>
        </CircleMarker>

        <MapControls />
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div
          className="p-3 rounded-xl border border-white/10 shadow-xl"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)' }}
        >
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Legend</div>
          <div className="space-y-1.5">
            {dayData.slice(0, Math.min(dayData.length, 8)).map((d, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs transition-opacity ${hoveredDay !== null && hoveredDay !== i ? 'opacity-40' : ''}`}
              >
                <div
                  className="w-4 h-1 rounded-full"
                  style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length].main }}
                />
                <span className="text-slate-300">Day {d.day}</span>
              </div>
            ))}
            {dayData.length > 8 && (
              <div className="text-xs text-slate-500">+{dayData.length - 8} more</div>
            )}
          </div>

          {activeShortcuts?.shortcuts?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Shortcuts</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-cyan-400" />
                  <span className="text-slate-300">Cable Car</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-amber-400" />
                  <span className="text-slate-300">Bus</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Country labels overlay */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div
          className="px-3 py-2 rounded-xl text-xs font-medium"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)' }}
        >
          <span className="text-slate-300">🇫🇷 France</span>
          <span className="text-slate-500 mx-2">·</span>
          <span className="text-slate-300">🇮🇹 Italy</span>
          <span className="text-slate-500 mx-2">·</span>
          <span className="text-slate-300">🇨🇭 Switzerland</span>
        </div>
      </div>

      {/* Total stats overlay */}
      <div className="absolute top-4 right-4 z-[1000]">
        <div
          className="px-3 py-2 rounded-xl"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)' }}
        >
          <div className="text-xs text-slate-400">Tour du Mont Blanc</div>
          <div className="text-sm font-semibold text-white">
            {WAYPOINTS[WAYPOINTS.length - 1].cumDist.toFixed(0)} km Circuit
          </div>
        </div>
      </div>
    </div>

      {/* Journey Summary Table */}
      <GlassCard className="p-6 mt-6">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Daily Breakdown</h3>
        <DaySummaryTable
          dayData={dayData}
          totals={totals}
          totalTimeSaved={totalTimeSaved}
          activeShortcuts={activeShortcuts}
          scenario={scenario}
          formatTime={formatTime}
          formatDate={formatDate}
          useImperial={useImperial}
          onRowClick={handleSegmentClick}
          onRowHover={setHoveredDay}
          selectedDay={selectedDay}
          hoveredDay={hoveredDay}
        />
      </GlassCard>

      {/* Segment Detail Modal */}
      <SegmentDetailModal
        isOpen={showDetailModal}
        dayIndex={selectedDay}
        dayData={dayData}
        scenario={scenario}
        formatTime={formatTime}
        formatDate={formatDate}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDay(null);
        }}
        onShortcutToggle={onShortcutToggle}
        selectedShortcuts={selectedShortcuts}
      />
    </div>
  );
};

export default function App() {
  const [scenarios, setScenarios] = useState(DEFAULT_DATA.scenarios);
  const [activeScenarioId, setActiveScenarioId] = useState(DEFAULT_DATA.activeScenarioId);
  const [view, setView] = useState('plan');
  const [selectedShortcuts, setSelectedShortcuts] = useState(DEFAULT_DATA.selectedShortcuts);
  const [useImperial, setUseImperial] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [deleteConfirmDay, setDeleteConfirmDay] = useState(null);
  const [hoveredElevationDay, setHoveredElevationDay] = useState(null);
  const [hoveredShortcut, setHoveredShortcut] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info', isVisible: false });

  // Show toast helper
  const showToast = (message, type = 'info') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  // Encode scenario data for sharing
  const encodeScenarioForShare = (scenario, shortcuts) => {
    const shareData = {
      n: scenario.name,
      s: scenario.startDate,
      d: scenario.days,
      sc: shortcuts
    };
    return btoa(JSON.stringify(shareData));
  };

  // Decode scenario data from URL
  const decodeScenarioFromUrl = (encoded) => {
    try {
      const decoded = JSON.parse(atob(encoded));
      return {
        name: decoded.n || 'Shared Trip',
        startDate: decoded.s || '2026-08-01',
        days: decoded.d || DEFAULT_DATA.scenarios[0].days,
        shortcuts: decoded.sc || {}
      };
    } catch (e) {
      console.error('Failed to decode shared trip:', e);
      return null;
    }
  };

  // Load from URL or localStorage on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedTrip = urlParams.get('trip');

    if (sharedTrip) {
      // Try to load from URL
      const decoded = decodeScenarioFromUrl(sharedTrip);
      if (decoded) {
        // Create a new scenario from the shared data
        const sharedScenario = {
          id: Date.now(),
          name: decoded.name + ' (Shared)',
          startDate: decoded.startDate,
          days: decoded.days
        };
        setScenarios([sharedScenario]);
        setActiveScenarioId(sharedScenario.id);
        setSelectedShortcuts(decoded.shortcuts);
        setIsDirty(true); // Mark as dirty so user knows to save

        // Clear the URL param without reloading
        window.history.replaceState({}, '', window.location.pathname);

        showToast('Loaded shared itinerary! Click Save to keep it.', 'success');
      } else {
        showToast("Couldn't load shared trip - using default", 'error');
        loadFromLocalStorage();
      }
    } else {
      loadFromLocalStorage();
    }
  }, []);

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.scenarios) setScenarios(data.scenarios);
        if (data.activeScenarioId) setActiveScenarioId(data.activeScenarioId);
        if (data.selectedShortcuts) setSelectedShortcuts(data.selectedShortcuts);
        if (data.useImperial !== undefined) setUseImperial(data.useImperial);
      }
    } catch (e) {
      console.error('Failed to load saved data:', e);
    }
  };

  // Generate share URL
  const handleShare = () => {
    if (!activeScenario) return;

    // Only include shortcuts that are selected (true values)
    const activeShortcutsOnly = {};
    Object.entries(selectedShortcuts).forEach(([key, value]) => {
      if (value) activeShortcutsOnly[key] = true;
    });

    const encoded = encodeScenarioForShare(activeScenario, activeShortcutsOnly);
    const url = `${window.location.origin}${window.location.pathname}?trip=${encoded}`;
    setShareUrl(url);
    setShowShareModal(true);
  };

  const saveToLocalStorage = () => {
    try {
      const data = { scenarios, activeScenarioId, selectedShortcuts, useImperial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setIsDirty(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  };

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  const handleShortcutToggle = (shortcutId, timeSaved) => {
    setSelectedShortcuts(prev => ({
      ...prev,
      [shortcutId]: !prev[shortcutId]
    }));
    setIsDirty(true);
  };

  const getDayData = (scenario) => {
    if (!scenario) return [];
    const days = [];
    let prevIdx = 0;
    scenario.days.forEach((endIdx, i) => {
      const startWp = WAYPOINTS[prevIdx];
      const endWp = WAYPOINTS[endIdx];
      days.push({
        day: i + 1, startWp, endWp,
        distance: (endWp.cumDist - startWp.cumDist).toFixed(1),
        time: endWp.cumTime - startWp.cumTime,
        ascent: endWp.ascent - startWp.ascent,
        descent: endWp.descent - startWp.descent,
        date: new Date(new Date(scenario.startDate).getTime() + i * 86400000)
      });
      prevIdx = endIdx;
    });
    return days;
  };

  const dayData = getDayData(activeScenario);

  // Calculate total time saved from selected shortcuts
  const totalTimeSaved = useMemo(() => {
    let saved = 0;
    Object.entries(selectedShortcuts).forEach(([shortcutId, isSelected]) => {
      if (isSelected) {
        const [segmentKey] = shortcutId.split('-').slice(0, 2);
        const fullSegmentKey = shortcutId.substring(0, shortcutId.lastIndexOf('-'));
        const segment = segmentData[fullSegmentKey.split('-').slice(0, 2).join('-')];
        if (segment?.shortcuts) {
          const shortcutName = shortcutId.split('-').slice(2).join('-');
          const shortcut = segment.shortcuts.find(s => s.name === shortcutName);
          if (shortcut) {
            saved += shortcut.timeSaved;
          }
        }
      }
    });
    return saved;
  }, [selectedShortcuts]);

  const totals = dayData.reduce((acc, d) => ({
    distance: acc.distance + parseFloat(d.distance),
    time: acc.time + d.time,
    ascent: acc.ascent + d.ascent,
    descent: acc.descent + d.descent
  }), { distance: 0, time: 0, ascent: 0, descent: 0 });

  // Calculate these early for use in activeShortcuts
  const maxAlt = Math.max(...WAYPOINTS.map(w => w.altitude));
  const minAlt = Math.min(...WAYPOINTS.map(w => w.altitude));
  const maxDist = WAYPOINTS[WAYPOINTS.length - 1].cumDist;

  // Compute active shortcuts with visualization data
  const activeShortcuts = useMemo(() => {
    const shortcuts = [];
    let totalCost = 0;

    Object.entries(selectedShortcuts).forEach(([shortcutId, isSelected]) => {
      if (!isSelected) return;

      // Parse segment key from shortcutId (format: "fromId-toId-shortcutName")
      const parts = shortcutId.split('-');
      const fromId = parseInt(parts[0]);
      const toId = parseInt(parts[1]);
      const shortcutName = parts.slice(2).join('-');
      const segmentKey = `${fromId}-${toId}`;

      const segment = segmentData[segmentKey];
      if (!segment?.shortcuts) return;

      const shortcut = segment.shortcuts.find(s => s.name === shortcutName);
      if (!shortcut) return;

      const fromWp = WAYPOINTS[fromId];
      const toWp = WAYPOINTS[toId];

      if (!fromWp || !toWp) return;

      // Calculate position within the segment
      const startX = fromWp.cumDist + (toWp.cumDist - fromWp.cumDist) * shortcut.position;
      const startAlt = fromWp.altitude + (toWp.altitude - fromWp.altitude) * shortcut.position;

      // For shortcuts, the end point is either skipsToWaypoint or the segment end
      let endWpId = shortcut.skipsToWaypoint || toId;
      let endWp = WAYPOINTS[endWpId] || toWp;

      shortcuts.push({
        ...shortcut,
        shortcutId,
        segmentKey,
        fromId,
        toId,
        fromWp,
        toWp,
        // Visualization coords
        startDist: startX,
        startAlt: startAlt,
        endDist: endWp.cumDist,
        endAlt: endWp.altitude,
        // For map visualization
        startAngle: (startX / maxDist) * 360 - 90,
        endAngle: (endWp.cumDist / maxDist) * 360 - 90
      });

      totalCost += shortcut.cost || 0;
    });

    return { shortcuts, totalCost, totalTimeSaved: totalTimeSaved };
  }, [selectedShortcuts, totalTimeSaved, maxDist]);

  const updateDay = (dayIndex, newEndIdx) => {
    setScenarios(scenarios.map(s => {
      if (s.id !== activeScenarioId) return s;
      const newDays = [...s.days];
      newDays[dayIndex] = newEndIdx;
      const validDays = newDays.filter((d, i) => i === 0 || d > newDays[i-1]);
      return { ...s, days: validDays };
    }));
    setIsDirty(true);
  };

  const splitLongestDay = () => {
    setScenarios(scenarios.map(s => {
      if (s.id !== activeScenarioId) return s;

      // Find the longest day by number of waypoints (segments)
      let longestDayIdx = 0;
      let maxWaypoints = 0;
      let prevEnd = 0;

      s.days.forEach((endIdx, i) => {
        const waypointCount = endIdx - prevEnd;
        if (waypointCount > maxWaypoints) {
          maxWaypoints = waypointCount;
          longestDayIdx = i;
        }
        prevEnd = endIdx;
      });

      // Need at least 2 waypoints to split
      if (maxWaypoints < 2) return s;

      // Calculate the midpoint of the longest day
      const dayStart = longestDayIdx === 0 ? 0 : s.days[longestDayIdx - 1];
      const dayEnd = s.days[longestDayIdx];
      const midpoint = Math.floor((dayStart + dayEnd) / 2);

      // Don't split if midpoint equals start
      if (midpoint <= dayStart) return s;

      // Insert the new day break
      const newDays = [...s.days];
      newDays.splice(longestDayIdx, 0, midpoint);

      return { ...s, days: newDays };
    }));
    setIsDirty(true);
  };

  const mergeShortestDay = () => {
    setScenarios(scenarios.map(s => {
      if (s.id !== activeScenarioId) return s;
      if (s.days.length <= 1) return s;

      // Find the shortest day by number of waypoints
      let shortestDayIdx = 0;
      let minWaypoints = Infinity;
      let prevEnd = 0;

      s.days.forEach((endIdx, i) => {
        const waypointCount = endIdx - prevEnd;
        if (waypointCount < minWaypoints) {
          minWaypoints = waypointCount;
          shortestDayIdx = i;
        }
        prevEnd = endIdx;
      });

      // Remove the shortest day (merge with next day, or previous if it's the last)
      const newDays = s.days.filter((_, i) => i !== shortestDayIdx);

      return { ...s, days: newDays };
    }));
    setIsDirty(true);
  };

  const removeDay = (dayIndex) => {
    setScenarios(scenarios.map(s => {
      if (s.id !== activeScenarioId) return s;
      if (s.days.length > 1) return { ...s, days: s.days.filter((_, i) => i !== dayIndex) };
      return s;
    }));
    setIsDirty(true);
  };

  const createScenario = () => {
    const newId = Math.max(...scenarios.map(s => s.id)) + 1;
    setScenarios([...scenarios, { id: newId, name: `Scenario ${newId}`, startDate: "2026-08-01", days: [6, 8, 12, 15, 21, 28, 33] }]);
    setActiveScenarioId(newId);
    setIsDirty(true);
  };

  const renameScenario = (id, newName) => {
    setScenarios(scenarios.map(s => s.id === id ? { ...s, name: newName } : s));
    setIsDirty(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xl">⛰️</div>
            <h1 className="text-3xl font-light tracking-tight">Tour du Mont Blanc</h1>
          </div>
          <p className="text-slate-400 text-sm ml-13">Plan your journey around the roof of Europe</p>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap items-center">
          {scenarios.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveScenarioId(s.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeScenarioId === s.id
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              {s.name}
            </button>
          ))}
          <button
            onClick={createScenario}
            className="w-10 h-10 rounded-full bg-white/5 border border-dashed border-white/20 text-slate-400 hover:bg-white/10 hover:border-white/30 transition-all duration-300 flex items-center justify-center"
          >
            +
          </button>

          <div className="ml-auto flex items-center gap-2">
            {showSaved && (
              <span className="text-emerald-400 text-sm animate-pulse">Saved!</span>
            )}
            {/* Unit Toggle */}
            <button
              onClick={() => {
                setUseImperial(!useImperial);
                setIsDirty(true);
              }}
              className="px-3 py-2 rounded-full text-xs font-medium transition-all duration-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 flex items-center gap-1.5"
              title={useImperial ? 'Switch to metric (km/m)' : 'Switch to imperial (mi/ft)'}
            >
              <span className={useImperial ? 'text-slate-500' : 'text-emerald-400'}>km</span>
              <span className="text-slate-600">/</span>
              <span className={useImperial ? 'text-amber-400' : 'text-slate-500'}>mi</span>
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 hover:text-cyan-400"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={saveToLocalStorage}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                isDirty
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
              {isDirty && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
            </button>
          </div>
        </div>

        <GlassCard className="p-1.5 mb-6 inline-flex gap-1">
          {[
            { id: 'plan', label: 'Itinerary', icon: '📋' },
            { id: 'map', label: 'Route Map', icon: '🗺️' },
            { id: 'elevation', label: 'Elevation', icon: '📈' },
            { id: 'compare', label: 'Compare', icon: '⚖️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 ${
                view === tab.id ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </GlassCard>

        {view === 'compare' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map(s => {
              const data = getDayData(s);
              const tots = data.reduce((acc, d) => ({
                distance: acc.distance + parseFloat(d.distance),
                time: acc.time + d.time,
                ascent: acc.ascent + d.ascent,
                descent: acc.descent + d.descent
              }), { distance: 0, time: 0, ascent: 0, descent: 0 });
              return (
                <GlassCard key={s.id} className="p-5" hover>
                  <h4 className="font-semibold text-lg mb-4">{s.name}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-emerald-400">{s.days.length}</div>
                      <div className="text-xs text-slate-400">days</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-cyan-400">{tots.distance.toFixed(0)}</div>
                      <div className="text-xs text-slate-400">km</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {data.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg bg-white/5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length].main }} />
                        <span className="text-slate-500 w-6">D{d.day}</span>
                        <span className="text-slate-300 flex-1 truncate">{d.endWp.name}</span>
                        <span className="text-slate-500">{d.distance}km</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {view === 'plan' && activeScenario && (
          <>
            <GlassCard className="p-6 mb-6">
              <div className="flex flex-wrap gap-6 items-center justify-between">
                <div className="flex gap-6 items-center">
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Scenario</label>
                    <input
                      type="text"
                      value={activeScenario.name}
                      onChange={(e) => renameScenario(activeScenario.id, e.target.value)}
                      className="bg-transparent text-xl font-light border-b border-white/20 focus:border-emerald-500 outline-none pb-1 w-44 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Start Date</label>
                    <input
                      type="date"
                      value={activeScenario.startDate}
                      onChange={(e) => {
                        setScenarios(scenarios.map(s =>
                          s.id === activeScenarioId ? { ...s, startDate: e.target.value } : s
                        ));
                        setIsDirty(true);
                      }}
                      className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  {/* Days with +/- buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={mergeShortestDay}
                      disabled={dayData.length <= 1}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                      title="Remove day (merge shortest)"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="text-center min-w-[3rem]">
                      <div className="text-2xl font-bold">{dayData.length}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">Days</div>
                    </div>
                    <button
                      onClick={splitLongestDay}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 hover:text-emerald-400 transition-all flex items-center justify-center"
                      title="Add day (split longest)"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-px h-10 bg-white/10" />

                  {/* Distance */}
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatDistanceValue(totals.distance, useImperial)}{getDistanceUnit(useImperial)}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Distance</div>
                  </div>

                  {/* Hiking time */}
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${totalTimeSaved > 0 ? 'text-cyan-400' : ''}`}>
                      {formatTime(totals.time - totalTimeSaved)}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">
                      {totalTimeSaved > 0 ? `Hiking (-${formatTime(totalTimeSaved)})` : 'Hiking'}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="space-y-3 mb-6">
              {dayData.map((day, idx) => (
                <ExpandableDayCard
                  key={idx}
                  day={day}
                  dayIndex={idx}
                  color={DAY_COLORS[idx % DAY_COLORS.length]}
                  activeScenario={activeScenario}
                  updateDay={updateDay}
                  removeDay={(dayIndex) => setDeleteConfirmDay(dayIndex)}
                  selectedShortcuts={selectedShortcuts}
                  onShortcutToggle={handleShortcutToggle}
                  useImperial={useImperial}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: formatDistanceValue(totals.distance, useImperial), unit: getDistanceUnit(useImperial), label: 'Total Distance', icon: '🥾', gradient: 'from-emerald-500 to-teal-500' },
                { value: formatTime(totals.time - totalTimeSaved), unit: '', label: totalTimeSaved > 0 ? 'Adj. Time' : 'Hiking Time', icon: '⏱️', gradient: 'from-blue-500 to-indigo-500' },
                { value: formatElevationValue(totals.ascent, useImperial).toLocaleString(), unit: getElevationUnit(useImperial), label: 'Total Ascent', icon: '⬆️', gradient: 'from-amber-500 to-orange-500' },
                { value: formatElevationValue(totals.descent, useImperial).toLocaleString(), unit: getElevationUnit(useImperial), label: 'Total Descent', icon: '⬇️', gradient: 'from-rose-500 to-pink-500' },
              ].map((stat, i) => (
                <GlassCard key={i} className="p-5 text-center relative overflow-hidden" hover>
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold">
                    {stat.value}<span className="text-lg text-slate-400">{stat.unit}</span>
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{stat.label}</div>
                  <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
                </GlassCard>
              ))}
            </div>
          </>
        )}

        {view === 'elevation' && (
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-light mb-6 flex items-center gap-2">
                <span className="text-2xl">📈</span> Elevation Profile
              </h3>

              {/* Elevation Chart */}
              <div className="relative">
                <svg viewBox="0 0 800 300" className="w-full">
                  {/* Grid lines */}
                  {[1000, 1500, 2000, 2500].map(alt => {
                    const y = 250 - ((alt - minAlt) / (maxAlt - minAlt)) * 200;
                    return (
                      <g key={alt}>
                        <line x1="60" y1={y} x2="760" y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
                        <text x="52" y={y + 4} fill="#94a3b8" fontSize="11" textAnchor="end" fontFamily="system-ui">{alt}m</text>
                      </g>
                    );
                  })}

                  {/* X-axis labels */}
                  {[0, 40, 80, 120, 160].map(km => (
                    <text key={km} x={60 + (km / maxDist) * 700} y={280} fill="#94a3b8" fontSize="11" textAnchor="middle" fontFamily="system-ui">{km}km</text>
                  ))}

                  {/* Subtle fill under the line */}
                  <path
                    d={`M 60 250 L ${WAYPOINTS.map(p => `${60 + (p.cumDist / maxDist) * 700} ${250 - ((p.altitude - minAlt) / (maxAlt - minAlt)) * 200}`).join(' L ')} L ${60 + (WAYPOINTS[WAYPOINTS.length-1].cumDist / maxDist) * 700} 250 Z`}
                    fill="rgba(16, 185, 129, 0.08)"
                  />

                  {/* Day-colored elevation line segments */}
                  {dayData.map((d, i) => {
                    const prevEnd = i === 0 ? 0 : activeScenario.days[i - 1];
                    const dayWaypoints = WAYPOINTS.slice(prevEnd, activeScenario.days[i] + 1);
                    const pathData = dayWaypoints.map((p, idx) => {
                      const x = 60 + (p.cumDist / maxDist) * 700;
                      const y = 250 - ((p.altitude - minAlt) / (maxAlt - minAlt)) * 200;
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ');

                    return (
                      <path
                        key={i}
                        d={pathData}
                        fill="none"
                        stroke={DAY_COLORS[i % DAY_COLORS.length].main}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}

                  {/* Shortcut visualization lines */}
                  {activeShortcuts.shortcuts.map((shortcut, i) => {
                    const x1 = 60 + (shortcut.startDist / maxDist) * 700;
                    const y1 = 250 - ((shortcut.startAlt - minAlt) / (maxAlt - minAlt)) * 200;
                    const x2 = 60 + (shortcut.endDist / maxDist) * 700;
                    const y2 = 250 - ((shortcut.endAlt - minAlt) / (maxAlt - minAlt)) * 200;
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;

                    const isCableCar = shortcut.type === 'cable_car';
                    const isBus = shortcut.type === 'bus';
                    const color = isCableCar ? '#22d3ee' : isBus ? '#fbbf24' : '#a78bfa';
                    const isHovered = hoveredShortcut === shortcut.shortcutId;

                    return (
                      <g
                        key={i}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredShortcut(shortcut.shortcutId)}
                        onMouseLeave={() => setHoveredShortcut(null)}
                      >
                        {/* Invisible wider hit area for easier hovering */}
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="16" />
                        {/* Faded "skipped" section indicator */}
                        <line
                          x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke="#334155"
                          strokeWidth={isHovered ? "8" : "6"}
                          strokeLinecap="round"
                          opacity="0.3"
                        />
                        {/* Shortcut line */}
                        <line
                          x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke={color}
                          strokeWidth={isHovered ? "4" : "3"}
                          strokeLinecap="round"
                          strokeDasharray={isCableCar ? '8,4' : isBus ? '4,4' : '2,4'}
                          style={{ transition: 'stroke-width 0.15s ease' }}
                        />
                        {/* Start marker */}
                        <circle cx={x1} cy={y1} r={isHovered ? "10" : "8"} fill={color} stroke="#0f172a" strokeWidth="2" style={{ transition: 'r 0.15s ease' }} />
                        {/* End marker */}
                        <circle cx={x2} cy={y2} r={isHovered ? "8" : "6"} fill={color} stroke="#0f172a" strokeWidth="2" opacity="0.7" style={{ transition: 'r 0.15s ease' }} />
                        {/* Icon in middle of line */}
                        <circle cx={midX} cy={midY} r={isHovered ? "14" : "12"} fill={color} stroke="#0f172a" strokeWidth="2" style={{ transition: 'r 0.15s ease' }} />
                        <text x={midX} y={midY + 4} fill="#0f172a" fontSize={isHovered ? "12" : "10"} textAnchor="middle" fontWeight="bold">
                          {isCableCar ? '🚡' : isBus ? '🚌' : '↗'}
                        </text>
                      </g>
                    );
                  })}

                  {/* Day boundary markers and labels */}
                  {dayData.map((d, i) => {
                    const x = 60 + (d.endWp.cumDist / maxDist) * 700;
                    const y = 250 - ((d.endWp.altitude - minAlt) / (maxAlt - minAlt)) * 200;
                    const color = DAY_COLORS[i % DAY_COLORS.length].main;
                    const isHovered = hoveredElevationDay === i;

                    return (
                      <g
                        key={i}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredElevationDay(i)}
                        onMouseLeave={() => setHoveredElevationDay(null)}
                      >
                        {/* Vertical day boundary line */}
                        <line x1={x} y1={35} x2={x} y2={250} stroke={color} strokeWidth={isHovered ? "2" : "1"} strokeDasharray="3,3" opacity={isHovered ? "0.7" : "0.4"} />

                        {/* Day label at top */}
                        <text x={x} y={25} fill={color} fontSize="11" textAnchor="middle" fontWeight="600" fontFamily="system-ui">D{i + 1}</text>

                        {/* Marker circle - larger on hover */}
                        <circle cx={x} cy={y} r={isHovered ? "13" : "10"} fill={color} stroke="#0f172a" strokeWidth="2.5" style={{ transition: 'r 0.15s ease' }} />
                        <text x={x} y={y + 4} fill="white" fontSize={isHovered ? "12" : "10"} textAnchor="middle" fontWeight="bold" fontFamily="system-ui">{i + 1}</text>

                        {/* Invisible larger hit area for easier hovering */}
                        <circle cx={x} cy={y} r="20" fill="transparent" />
                      </g>
                    );
                  })}

                  {/* Start marker */}
                  <g>
                    <circle cx={60} cy={250 - ((WAYPOINTS[0].altitude - minAlt) / (maxAlt - minAlt)) * 200} r="6" fill="#10b981" stroke="#0f172a" strokeWidth="2" />
                  </g>
                </svg>

                {/* Hover tooltip */}
                {hoveredElevationDay !== null && dayData[hoveredElevationDay] && (() => {
                  const d = dayData[hoveredElevationDay];
                  const i = hoveredElevationDay;
                  const xPercent = (d.endWp.cumDist / maxDist) * 100;
                  const yPercent = ((d.endWp.altitude - minAlt) / (maxAlt - minAlt)) * 100;
                  const showAbove = yPercent < 50;

                  return (
                    <div
                      className="absolute pointer-events-none transition-opacity duration-150"
                      style={{
                        left: `calc(${7.5 + (xPercent * 0.875)}%)`,
                        top: showAbove ? `calc(${83.3 - (yPercent * 0.667)}% + 20px)` : `calc(${83.3 - (yPercent * 0.667)}% - 140px)`,
                        transform: 'translateX(-50%)',
                        zIndex: 10
                      }}
                    >
                      <div
                        className="px-4 py-3 rounded-xl border border-white/10 shadow-xl text-sm min-w-[200px]"
                        style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(12px)' }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length].main }} />
                          <span className="font-semibold text-white">Day {d.day}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400 text-xs">{formatDate(d.date)}</span>
                        </div>
                        <div className="text-slate-300 text-xs mb-2">
                          {d.startWp.name} → {d.endWp.name}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div className="text-slate-500">Distance</div>
                          <div className="text-right text-slate-200">{d.distance} km</div>
                          <div className="text-slate-500">Ascent</div>
                          <div className="text-right text-emerald-400">↑{d.ascent}m</div>
                          <div className="text-slate-500">Descent</div>
                          <div className="text-right text-rose-400">↓{d.descent}m</div>
                          <div className="text-slate-500">Time</div>
                          <div className="text-right text-slate-200">{formatTime(d.time)}</div>
                          <div className="text-slate-500">End altitude</div>
                          <div className="text-right text-slate-200">{d.endWp.altitude}m</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Shortcut hover tooltip */}
                {hoveredShortcut && (() => {
                  const shortcut = activeShortcuts.shortcuts.find(s => s.shortcutId === hoveredShortcut);
                  if (!shortcut) return null;
                  const midDist = (shortcut.startDist + shortcut.endDist) / 2;
                  const midAltitude = (shortcut.startAlt + shortcut.endAlt) / 2;
                  const xPercent = (midDist / maxDist) * 100;
                  const yPercent = ((midAltitude - minAlt) / (maxAlt - minAlt)) * 100;
                  const isCableCar = shortcut.type === 'cable_car';
                  const isBus = shortcut.type === 'bus';
                  const color = isCableCar ? '#22d3ee' : isBus ? '#fbbf24' : '#a78bfa';

                  return (
                    <div
                      className="absolute pointer-events-none transition-opacity duration-150"
                      style={{
                        left: `calc(${7.5 + (xPercent * 0.875)}%)`,
                        top: `calc(${83.3 - (yPercent * 0.667)}% - 120px)`,
                        transform: 'translateX(-50%)',
                        zIndex: 10
                      }}
                    >
                      <div
                        className="px-4 py-3 rounded-xl border shadow-xl text-sm min-w-[220px]"
                        style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(12px)', borderColor: `${color}40` }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{isCableCar ? '🚡' : isBus ? '🚌' : '↗️'}</span>
                          <span className="font-semibold text-white">{shortcut.name}</span>
                        </div>
                        <div className="text-xs text-slate-400 mb-2">{shortcut.description}</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div className="text-slate-500">Type</div>
                          <div className="text-right" style={{ color }}>{shortcut.type.replace('_', ' ')}</div>
                          <div className="text-slate-500">Time saved</div>
                          <div className="text-right text-cyan-400">{formatTime(shortcut.timeSaved)}</div>
                          {shortcut.cost > 0 && (
                            <>
                              <div className="text-slate-500">Cost</div>
                              <div className="text-right text-amber-400">€{shortcut.cost}</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Day Legend */}
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {dayData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length].main }} />
                    <span className="text-slate-400">D{d.day}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300">{d.endWp.name}</span>
                  </div>
                ))}
              </div>

              {/* Shortcuts Legend (when shortcuts are active) */}
              {activeShortcuts.shortcuts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Active Shortcuts</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-cyan-400">Saves {formatTime(activeShortcuts.totalTimeSaved)}</span>
                      {activeShortcuts.totalCost > 0 && (
                        <span className="text-amber-400">€{activeShortcuts.totalCost}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {activeShortcuts.shortcuts.map((shortcut, i) => {
                      const isCableCar = shortcut.type === 'cable_car';
                      const isBus = shortcut.type === 'bus';
                      const color = isCableCar ? '#22d3ee' : isBus ? '#fbbf24' : '#a78bfa';
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full hover:bg-white/10 transition-colors"
                          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
                        >
                          <span>{isCableCar ? '🚡' : isBus ? '🚌' : '↗️'}</span>
                          <span className="text-slate-300">{shortcut.name}</span>
                          <span className="text-slate-500">·</span>
                          <span style={{ color }}>-{formatTime(shortcut.timeSaved)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Day Summary Table */}
            <GlassCard className="p-6">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Daily Breakdown</h3>
              <DaySummaryTable
                dayData={dayData}
                totals={totals}
                totalTimeSaved={totalTimeSaved}
                activeShortcuts={activeShortcuts}
                scenario={activeScenario}
                formatTime={formatTime}
                formatDate={formatDate}
                useImperial={useImperial}
                showEndAltitude={true}
              />
            </GlassCard>
          </div>
        )}

        {view === 'map' && (
          <GlassCard className="p-4">
            <TrailMap
              dayData={dayData}
              activeShortcuts={activeShortcuts}
              formatTime={formatTime}
              formatDate={formatDate}
              scenario={activeScenario}
              selectedShortcuts={selectedShortcuts}
              onShortcutToggle={handleShortcutToggle}
              totals={totals}
              totalTimeSaved={totalTimeSaved}
              useImperial={useImperial}
            />
          </GlassCard>
        )}
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirmDay !== null}
        dayNumber={deleteConfirmDay !== null ? deleteConfirmDay + 1 : 0}
        startName={deleteConfirmDay !== null && dayData[deleteConfirmDay] ? dayData[deleteConfirmDay].startWp.name : ''}
        endName={deleteConfirmDay !== null && dayData[deleteConfirmDay] ? dayData[deleteConfirmDay].endWp.name : ''}
        onCancel={() => setDeleteConfirmDay(null)}
        onConfirm={() => {
          if (deleteConfirmDay !== null) {
            removeDay(deleteConfirmDay);
            setDeleteConfirmDay(null);
          }
        }}
      />

      {/* Share modal */}
      <ShareModal
        isOpen={showShareModal}
        shareUrl={shareUrl}
        onClose={() => setShowShareModal(false)}
        onCopy={() => showToast('Link copied to clipboard!', 'success')}
      />

      {/* Toast notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        icon={toast.type === 'success' ? <Check className="w-4 h-4" /> : toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      />
    </div>
  );
}
