import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { segmentData } from './segmentData';
import { useTrip } from './lib/useTrip';
import { useBookings } from './lib/useBookings';
import { useGearItems } from './lib/useGearItems';
import { useTransportLegs } from './lib/useTransportLegs';
import { useSafetyContacts } from './lib/useSafetyContacts';
import PackingTab from './components/PackingTab';
import TransportTab from './components/TransportTab';
import DocumentsSafetyTab from './components/DocumentsSafetyTab';
import {
  formatTime, formatDistanceValue, formatElevationValue,
  getDistanceUnit, getElevationUnit,
} from './lib/format';
import { decodeScenarioFromUrl } from './lib/share';
import { getDayData as computeDayData, getTotals, getShortcutSavings } from './lib/itinerary';
import { migrateLocalStorageToTrip } from './lib/migrate';
import {
  Eye, Waves, Mountain, Landmark, Church, Bird, Camera,
  ChevronDown, ChevronRight, Utensils, Home, MapPin,
  Zap, Bus, CableCar, Route, Check, AlertTriangle,
  Plus, Minus, Save, Share2, Link2, Copy, X, Maximize2, RotateCcw,
  Wifi, WifiOff, LoaderCircle, CloudOff, Download, CheckCircle,
  ExternalLink, Phone, FileText, Bed
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import savedTripCapture from './data/savedTripCapture.json';
import { warmTiles, getCachedTileCount, getTileList } from './lib/offlineTiles';
import { outboxCount as getOutboxCount } from './lib/offlineStore';
import gearSeed from './data/gearSeed.json';

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
  { main: '#1c3a2a', gradient: 'bg-tmb-pine' },     // pine
  { main: '#2e5039', gradient: 'bg-tmb-forest' },   // forest
  { main: '#6b8c54', gradient: 'bg-tmb-moss' },     // moss
  { main: '#cf7d2c', gradient: 'bg-tmb-amber' },    // amber
  { main: '#bf6334', gradient: 'bg-tmb-clay' },     // clay
  { main: '#a83f24', gradient: 'bg-tmb-rust' },     // rust
  { main: '#e3a93c', gradient: 'bg-tmb-gold' },     // gold
];

const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`bg-tmb-paper border border-tmb-line rounded-[13px] shadow-lg font-body ${hover ? 'hover:shadow-xl hover:border-tmb-gold/40 transition-all duration-300' : ''} ${className}`}>
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
  // Calculate stats saved for a specific day from shortcuts
  const getDaySavings = (dayIndex) => {
    const prevEnd = dayIndex === 0 ? 0 : scenario.days[dayIndex - 1];
    const dayEnd = scenario.days[dayIndex];
    let timeSaved = 0;
    let distanceSaved = 0;
    let ascentSaved = 0;
    let descentSaved = 0;
    activeShortcuts.shortcuts.forEach(shortcut => {
      if (shortcut.fromId >= prevEnd && shortcut.fromId < dayEnd) {
        timeSaved += shortcut.timeSaved || 0;
        distanceSaved += shortcut.distanceSaved || 0;
        ascentSaved += shortcut.ascentSaved || 0;
        descentSaved += shortcut.descentSaved || 0;
      }
    });
    return { timeSaved, distanceSaved, ascentSaved, descentSaved };
  };

  const hasAnySavings = activeShortcuts.totalTimeSaved > 0 || activeShortcuts.totalDistanceSaved > 0 || activeShortcuts.totalAscentSaved > 0 || activeShortcuts.totalDescentSaved > 0;

  const distUnit = getDistanceUnit(useImperial);
  const elevUnit = getElevationUnit(useImperial);

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="text-tmb-muted text-xs uppercase tracking-wider">
            <th className="text-left py-2 px-3 font-medium whitespace-nowrap">Day</th>
            <th className="text-left py-2 px-3 font-medium whitespace-nowrap">Date</th>
            <th className="text-left py-2 px-3 font-medium whitespace-nowrap">Route</th>
            <th className="text-right py-2 px-3 font-medium whitespace-nowrap">Dist</th>
            <th className="text-right py-2 px-3 font-medium whitespace-nowrap">Ascent</th>
            <th className="text-right py-2 px-3 font-medium whitespace-nowrap">Descent</th>
            <th className="text-right py-2 px-3 font-medium whitespace-nowrap">Time</th>
            {showEndAltitude && <th className="text-right py-2 px-3 font-medium whitespace-nowrap">End Alt</th>}
          </tr>
        </thead>
        <tbody>
          {dayData.map((d, i) => {
            const daySavings = getDaySavings(i);
            const adjustedTime = d.time - daySavings.timeSaved;
            const adjustedDistance = parseFloat(d.distance) - daySavings.distanceSaved;
            const adjustedAscent = d.ascent - daySavings.ascentSaved;
            const adjustedDescent = d.descent - daySavings.descentSaved;
            const isSelected = selectedDay === i;
            const isHovered = hoveredDay === i;
            const hasDaySavings = daySavings.timeSaved > 0 || daySavings.distanceSaved > 0 || daySavings.ascentSaved > 0 || daySavings.descentSaved > 0;

            return (
              <tr
                key={i}
                className={`border-t border-tmb-line2 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${
                  isSelected
                    ? 'bg-tmb-kraft ring-1 ring-inset ring-white/20'
                    : isHovered
                      ? 'bg-white/10'
                      : 'hover:bg-tmb-cream/60'
                }`}
                onClick={() => onRowClick?.(i)}
                onMouseEnter={() => onRowHover?.(i)}
                onMouseLeave={() => onRowHover?.(null)}
              >
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length].main }} />
                    <span className="font-semibold text-tmb-ink">{d.day}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-tmb-muted whitespace-nowrap">{formatDate(d.date)}</td>
                <td className="py-3 px-3 whitespace-nowrap">
                  <span className="text-tmb-ink">{d.startWp.name}</span>
                  <span className="text-tmb-muted/70 mx-1.5">→</span>
                  <span className="text-tmb-ink">{d.endWp.name}</span>
                </td>
                <td className="py-3 px-3 text-right font-medium whitespace-nowrap w-20">
                  {hasDaySavings ? (
                    daySavings.distanceSaved > 0 ? (
                      <div className="text-tmb-muted text-xs">{formatDistanceValue(d.distance, useImperial)}</div>
                    ) : (
                      <div className="text-xs invisible">-</div>
                    )
                  ) : null}
                  <div className="text-tmb-ink">{formatDistanceValue(hasDaySavings ? adjustedDistance : d.distance, useImperial)} {distUnit}</div>
                </td>
                <td className="py-3 px-3 text-right font-medium whitespace-nowrap w-20">
                  {hasDaySavings ? (
                    daySavings.ascentSaved > 0 ? (
                      <div className="text-tmb-muted text-xs">↑{formatElevationValue(d.ascent, useImperial)}</div>
                    ) : (
                      <div className="text-xs invisible">-</div>
                    )
                  ) : null}
                  <div className="text-tmb-moss">↑{formatElevationValue(hasDaySavings ? adjustedAscent : d.ascent, useImperial)}{elevUnit}</div>
                </td>
                <td className="py-3 px-3 text-right font-medium whitespace-nowrap w-20">
                  {hasDaySavings ? (
                    daySavings.descentSaved > 0 ? (
                      <div className="text-tmb-muted text-xs">↓{formatElevationValue(d.descent, useImperial)}</div>
                    ) : (
                      <div className="text-xs invisible">-</div>
                    )
                  ) : null}
                  <div className="text-tmb-rust">↓{formatElevationValue(hasDaySavings ? adjustedDescent : d.descent, useImperial)}{elevUnit}</div>
                </td>
                <td className="py-3 px-3 text-right font-medium whitespace-nowrap w-20">
                  {hasDaySavings ? (
                    daySavings.timeSaved > 0 ? (
                      <div className="text-tmb-muted text-xs">{formatTime(d.time)}</div>
                    ) : (
                      <div className="text-xs invisible">-</div>
                    )
                  ) : null}
                  <div className="text-tmb-ink">{formatTime(hasDaySavings ? adjustedTime : d.time)}</div>
                </td>
                {showEndAltitude && (
                  <td className="py-3 px-3 text-right text-tmb-muted">{formatElevationValue(d.endWp.altitude, useImperial)}{elevUnit}</td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-tmb-line2 bg-tmb-cream/60">
            <td className="py-3 px-3 font-semibold text-tmb-ink" colSpan="3">Total</td>
            <td className="py-3 px-3 text-right font-semibold whitespace-nowrap w-20">
              {hasAnySavings ? (
                activeShortcuts.totalDistanceSaved > 0 ? (
                  <div className="text-tmb-muted text-xs">{formatDistanceValue(totals.distance, useImperial)}</div>
                ) : (
                  <div className="text-xs invisible">-</div>
                )
              ) : null}
              <div className="text-tmb-ink">{formatDistanceValue(totals.distance - (activeShortcuts.totalDistanceSaved || 0), useImperial)} {distUnit}</div>
            </td>
            <td className="py-3 px-3 text-right font-semibold whitespace-nowrap w-20">
              {hasAnySavings ? (
                activeShortcuts.totalAscentSaved > 0 ? (
                  <div className="text-tmb-muted text-xs">↑{formatElevationValue(totals.ascent, useImperial)}</div>
                ) : (
                  <div className="text-xs invisible">-</div>
                )
              ) : null}
              <div className="text-tmb-moss">↑{formatElevationValue(totals.ascent - (activeShortcuts.totalAscentSaved || 0), useImperial)}{elevUnit}</div>
            </td>
            <td className="py-3 px-3 text-right font-semibold whitespace-nowrap w-20">
              {hasAnySavings ? (
                activeShortcuts.totalDescentSaved > 0 ? (
                  <div className="text-tmb-muted text-xs">↓{formatElevationValue(totals.descent, useImperial)}</div>
                ) : (
                  <div className="text-xs invisible">-</div>
                )
              ) : null}
              <div className="text-tmb-rust">↓{formatElevationValue(totals.descent - (activeShortcuts.totalDescentSaved || 0), useImperial)}{elevUnit}</div>
            </td>
            <td className="py-3 px-3 text-right font-semibold whitespace-nowrap w-20">
              {hasAnySavings ? (
                totalTimeSaved > 0 ? (
                  <div className="text-tmb-muted text-xs">{formatTime(totals.time)}</div>
                ) : (
                  <div className="text-xs invisible">-</div>
                )
              ) : null}
              <div className="text-tmb-ink">{formatTime(totals.time - totalTimeSaved)}</div>
            </td>
            {showEndAltitude && <td className="py-3 px-3"></td>}
          </tr>
          {hasAnySavings && (
            <tr className="border-t border-tmb-gold/20 bg-tmb-gold/5">
              <td className="py-3 px-3 text-tmb-gold" colSpan="2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Shortcuts Active</span>
                </div>
              </td>
              <td className="py-3 px-3 text-right text-tmb-amber">
                €{activeShortcuts.totalCost}
              </td>
              <td className="py-3 px-3 text-right text-tmb-gold">
                {activeShortcuts.totalDistanceSaved > 0 ? `-${formatDistanceValue(activeShortcuts.totalDistanceSaved, useImperial)} ${distUnit}` : ''}
              </td>
              <td className="py-3 px-3 text-right text-tmb-gold">
                {activeShortcuts.totalAscentSaved > 0 ? `-${formatElevationValue(activeShortcuts.totalAscentSaved, useImperial)}${elevUnit}` : ''}
              </td>
              <td className="py-3 px-3 text-right text-tmb-gold">
                {activeShortcuts.totalDescentSaved > 0 ? `-${formatElevationValue(activeShortcuts.totalDescentSaved, useImperial)}${elevUnit}` : ''}
              </td>
              <td className="py-3 px-3 text-right text-tmb-gold">
                {totalTimeSaved > 0 ? `-${formatTime(totalTimeSaved)}` : ''}
              </td>
              {showEndAltitude && <td className="py-3 px-3"></td>}
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
    <div className="border-l-2 border-tmb-line2 ml-4 pl-4 py-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 text-left group"
      >
        <div className="text-tmb-muted group-hover:text-tmb-ink transition-colors">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-tmb-muted">{fromWp.name}</span>
            <span className="text-tmb-muted/70">→</span>
            <span className="text-tmb-ink">{toWp.name}</span>
          </div>
          <div className="flex gap-4 text-xs text-tmb-muted mt-1">
            <span>{distance} km</span>
            <span className="text-tmb-moss">↑{ascent}m</span>
            <span className="text-tmb-rust">↓{descent}m</span>
            <span>{formatTime(time)}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {/* Sights Section */}
          {hasSights && (
            <div className="rounded-xl bg-tmb-cream/60 overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'sights' ? null : 'sights')}
                className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-tmb-cream/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-tmb-amber" />
                  <span className="text-tmb-ink">Sights</span>
                  <span className="text-tmb-muted text-xs">({segment.sights.length})</span>
                </div>
                {expandedSection === 'sights' ? <ChevronDown className="w-4 h-4 text-tmb-muted" /> : <ChevronRight className="w-4 h-4 text-tmb-muted" />}
              </button>

              {expandedSection === 'sights' && (
                <div className="px-4 pb-3 space-y-3">
                  {Object.entries(sightGroups).map(([label, sights]) =>
                    sights.length > 0 && (
                      <div key={label}>
                        <div className="text-xs text-tmb-muted font-display uppercase tracking-[.12em] mb-2">{label}</div>
                        {sights.map((sight, idx) => (
                          <div key={idx} className="mb-2">
                            <button
                              onClick={() => setExpandedSight(expandedSight === `${segmentKey}-${idx}` ? null : `${segmentKey}-${idx}`)}
                              className="w-full text-left flex items-start gap-2 p-2 rounded-lg hover:bg-tmb-cream/60 transition-colors"
                            >
                              <SightIcon type={sight.type} className="w-4 h-4 text-tmb-amber mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-tmb-ink">{sight.name}</div>
                                <div className="text-xs text-tmb-muted">{sight.description}</div>
                              </div>
                              {sight.photoRating >= 4 && (
                                <div className="text-xs text-tmb-amber">★{sight.photoRating}</div>
                              )}
                            </button>
                            {expandedSight === `${segmentKey}-${idx}` && (
                              <div className="ml-6 mt-2 p-3 rounded-lg bg-tmb-cream/60 text-xs text-tmb-muted">
                                {sight.detailedDescription}
                                {sight.timeToVisit > 0 && (
                                  <div className="mt-2 text-tmb-muted">
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
            <div className="rounded-xl bg-tmb-cream/60 overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'food' ? null : 'food')}
                className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-tmb-cream/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-tmb-clay" />
                  <span className="text-tmb-ink">Food & Refuges</span>
                  <span className="text-tmb-muted text-xs">({segment.foodStops.length})</span>
                </div>
                {expandedSection === 'food' ? <ChevronDown className="w-4 h-4 text-tmb-muted" /> : <ChevronRight className="w-4 h-4 text-tmb-muted" />}
              </button>

              {expandedSection === 'food' && (
                <div className="px-4 pb-3 space-y-3">
                  {Object.entries(foodGroups).map(([label, foods]) =>
                    foods.length > 0 && (
                      <div key={label}>
                        <div className="text-xs text-tmb-muted font-display uppercase tracking-[.12em] mb-2">{label}</div>
                        {foods.map((food, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 rounded-lg hover:bg-tmb-cream/60 transition-colors">
                            {food.type === 'refuge' ? (
                              <Home className="w-4 h-4 text-tmb-clay mt-0.5 shrink-0" />
                            ) : (
                              <Utensils className="w-4 h-4 text-tmb-clay mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-tmb-ink">{food.name}</span>
                                <span className="text-xs text-tmb-muted">{food.priceRange}</span>
                              </div>
                              <div className="text-xs text-tmb-muted">{food.description}</div>
                              {food.specialty && (
                                <div className="text-xs text-tmb-clay/70 mt-1">★ {food.specialty}</div>
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
            <div className="rounded-xl bg-tmb-cream/60 overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'shortcuts' ? null : 'shortcuts')}
                className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-tmb-cream/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-tmb-gold" />
                  <span className="text-tmb-ink">Shortcuts</span>
                  <span className="text-tmb-muted text-xs">({segment.shortcuts.length})</span>
                </div>
                {expandedSection === 'shortcuts' ? <ChevronDown className="w-4 h-4 text-tmb-muted" /> : <ChevronRight className="w-4 h-4 text-tmb-muted" />}
              </button>

              {expandedSection === 'shortcuts' && (
                <div className="px-4 pb-3 space-y-3">
                  {Object.entries(shortcutGroups).map(([label, shortcuts]) =>
                    shortcuts.length > 0 && (
                      <div key={label}>
                        <div className="text-xs text-tmb-muted font-display uppercase tracking-[.12em] mb-2">{label}</div>
                        {shortcuts.map((shortcut, idx) => {
                          const shortcutId = `${segmentKey}-${shortcut.name}`;
                          const isSelected = selectedShortcuts[shortcutId];

                          return (
                            <div key={idx} className={`p-3 rounded-lg transition-colors ${isSelected ? 'bg-tmb-gold/15 border border-tmb-gold/30' : 'bg-tmb-cream/60'}`}>
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => onShortcutToggle(shortcutId, shortcut.timeSaved)}
                                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'bg-tmb-pine border-tmb-pine'
                                      : 'border-tmb-muted hover:border-tmb-gold'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-tmb-ink" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <ShortcutIcon type={shortcut.type} className="w-4 h-4 text-tmb-gold" />
                                    <span className="text-sm text-tmb-ink">{shortcut.name}</span>
                                  </div>
                                  <div className="text-xs text-tmb-muted mt-1">{shortcut.description}</div>
                                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                    {shortcut.timeSaved > 0 && (
                                      <span className="text-tmb-gold">-{formatTime(shortcut.timeSaved)}</span>
                                    )}
                                    {shortcut.distanceSaved > 0 && (
                                      <span className="text-tmb-gold">-{shortcut.distanceSaved}km</span>
                                    )}
                                    {shortcut.ascentSaved > 0 && (
                                      <span className="text-tmb-gold">-↑{shortcut.ascentSaved}m</span>
                                    )}
                                    {shortcut.descentSaved > 0 && (
                                      <span className="text-tmb-gold">-↓{shortcut.descentSaved}m</span>
                                    )}
                                    {shortcut.cost > 0 && (
                                      <span className="text-tmb-amber">€{shortcut.cost}</span>
                                    )}
                                  </div>
                                  {shortcut.skipsToWaypoint && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-tmb-amber">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>Skips to {WAYPOINTS[shortcut.skipsToWaypoint]?.name}</span>
                                    </div>
                                  )}
                                  {shortcut.considerations && (
                                    <div className="text-xs text-tmb-muted mt-2 italic">{shortcut.considerations}</div>
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
    <div className="relative w-full sm:w-56">
      {/* Closed state - shows only name */}
      <button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`w-full bg-tmb-cream/60 border px-3 py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-lg text-sm font-medium text-tmb-ink hover:bg-tmb-kraft transition-colors flex items-center justify-between gap-2 ${
          isOpen ? 'border-tmb-moss/50' : 'border-tmb-line2'
        }`}
      >
        <span className="truncate">{selectedOption?.name || 'Select...'}</span>
        <ChevronDown className={`w-4 h-4 text-tmb-muted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Open state - portal dropdown menu */}
      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed w-[calc(100vw-2rem)] sm:w-80 max-h-64 overflow-y-auto rounded-xl"
          style={{
            top: menuPosition.top,
            left: window.innerWidth < 640 ? '1rem' : menuPosition.left,
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
              className={`w-full px-4 py-3 sm:py-2.5 min-h-[44px] sm:min-h-0 text-left text-sm transition-colors flex items-center justify-between gap-3 ${
                opt.id === value
                  ? 'bg-tmb-moss/20 text-tmb-moss'
                  : 'text-tmb-ink hover:bg-tmb-kraft'
              } ${index === 0 ? 'rounded-t-xl' : ''} ${index === options.length - 1 ? 'rounded-b-xl' : ''}`}
            >
              <span className="font-medium truncate">{opt.name}</span>
              <span className="text-xs text-tmb-muted shrink-0">
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

// Mini elevation profile generated from real waypoint altitudes
const ElevationMiniProfile = ({ dayIndex, activeScenario, color }) => {
  const prevEnd = dayIndex === 0 ? 0 : activeScenario.days[dayIndex - 1];
  const dayWaypoints = WAYPOINTS.slice(prevEnd, activeScenario.days[dayIndex] + 1);
  if (dayWaypoints.length < 2) return null;

  const alts = dayWaypoints.map(w => w.altitude);
  const minA = Math.min(...alts);
  const maxA = Math.max(...alts);
  const range = maxA - minA || 1;
  const w = 150, h = 40, pad = 4;

  const points = dayWaypoints.map((wp, i) => {
    const x = (i / (dayWaypoints.length - 1)) * w;
    const y = h - pad - ((wp.altitude - minA) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const fillColor = `${color.main}25`;
  const strokeColor = color.main;

  return (
    <svg width="150" height="40" viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0 hidden sm:block">
      <path d={`M${points.join(' L')} L${w},${h} L0,${h} Z`} fill={fillColor} />
      <path d={`M${points.join(' L')}`} fill="none" stroke={strokeColor} strokeWidth="2" />
    </svg>
  );
};

const ExpandableDayCard = ({ day, dayIndex, color, activeScenario, updateDay, removeDay, selectedShortcuts, onShortcutToggle, useImperial, booking }) => {
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

  // Calculate stats saved from shortcuts for this day's segments
  const daySavings = useMemo(() => {
    return dayData.allShortcuts
      .filter(s => s.isSelected)
      .reduce((acc, s) => ({
        timeSaved: acc.timeSaved + (s.timeSaved || 0),
        distanceSaved: acc.distanceSaved + (s.distanceSaved || 0),
        ascentSaved: acc.ascentSaved + (s.ascentSaved || 0),
        descentSaved: acc.descentSaved + (s.descentSaved || 0)
      }), { timeSaved: 0, distanceSaved: 0, ascentSaved: 0, descentSaved: 0 });
  }, [dayData.allShortcuts]);

  const timeSaved = daySavings.timeSaved;
  const adjustedTime = day.time - daySavings.timeSaved;
  const adjustedDistance = parseFloat(day.distance) - daySavings.distanceSaved;
  const adjustedAscent = day.ascent - daySavings.ascentSaved;
  const adjustedDescent = day.descent - daySavings.descentSaved;

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
    <GlassCard className="overflow-hidden group" hover>
      {/* Card header: route + date */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-tmb-line2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-display uppercase tracking-[.02em] font-semibold text-base sm:text-lg text-tmb-ink truncate">{day.startWp.name}</span>
          <span className="text-tmb-clay font-display">→</span>
          <div onClick={(e) => e.stopPropagation()} className="min-w-0">
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
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-display tracking-[.13em] uppercase text-[10.5px] text-tmb-muted whitespace-nowrap">{formatDate(day.date)}</span>
          <div className="text-tmb-muted">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); removeDay(dayIndex); }}
            className="w-8 h-8 min-h-[44px] min-w-[44px] rounded-full text-tmb-muted/50 hover:text-tmb-rust transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      </div>

      {/* Card body: stat chips + elevation profile + refuge tag */}
      <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 flex-wrap">
        {/* Stat chips */}
        <div className="flex flex-1 gap-0">
          {[
            { label: 'Dist', value: formatDistanceValue(daySavings.distanceSaved > 0 ? adjustedDistance : day.distance, useImperial) + ' ' + getDistanceUnit(useImperial), cls: '' },
            { label: 'Ascent', value: `↑ ${formatElevationValue(daySavings.ascentSaved > 0 ? adjustedAscent : day.ascent, useImperial)}`, cls: 'text-tmb-moss' },
            { label: 'Descent', value: `↓ ${formatElevationValue(daySavings.descentSaved > 0 ? adjustedDescent : day.descent, useImperial)}`, cls: 'text-tmb-rust' },
            { label: 'Time', value: formatTime(daySavings.timeSaved > 0 ? adjustedTime : day.time), cls: '' },
          ].map((s, i) => (
            <div key={i} className={`px-2 sm:px-4 ${i < 3 ? 'border-r border-tmb-line2' : ''} ${i === 0 ? 'pl-0' : ''}`}>
              <div className="font-display uppercase tracking-[.1em] text-[9px] text-tmb-muted">{s.label}</div>
              <div className={`font-display font-semibold text-base sm:text-lg mt-0.5 ${s.cls || 'text-tmb-ink'}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Mini elevation profile */}
        <ElevationMiniProfile dayIndex={dayIndex} activeScenario={activeScenario} color={color} />

        {/* Refuge/stay tag */}
        {booking && (
          <div className="flex items-center gap-2 bg-[#f1e7cf] border border-tmb-line rounded-[9px] px-2.5 py-1.5 shrink-0">
            <div className="w-6 h-6 rounded-md bg-tmb-forest text-[#f3e7c9] flex items-center justify-center text-sm">▲</div>
            <div>
              <div className="font-display uppercase tracking-[.05em] text-[8px] text-tmb-muted">Night</div>
              <div className="font-semibold text-xs text-tmb-pine leading-tight">{booking.place_name}</div>
            </div>
            {booking.status && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-tmb-moss/20 text-tmb-moss border border-tmb-moss/30 font-display uppercase">{booking.status}</span>
            )}
          </div>
        )}
      </div>

      {/* Important booking notes */}

      {/* Booking notes alerts */}
      {booking && booking.notes && (() => {
        const importantNotes = [];
        const notes = booking.notes;
        if (/navette/i.test(notes)) importantNotes.push(notes.match(/\d{2}:\d{2}\s+navette[^.;]*/i)?.[0] || 'Navette required');
        if (/sleeping.?bag\s+liner/i.test(notes)) importantNotes.push(notes.match(/sleeping.?bag\s+liner[^.;]*/i)?.[0] || 'Sleeping-bag liner required');
        if (/pay\s+in\s+CHF/i.test(notes)) importantNotes.push('Pay in CHF');
        if (/meal\s+\d{2}:\d{2}/i.test(notes)) importantNotes.push(notes.match(/meal\s+\d{2}:\d{2}[^.;]*/i)?.[0] || 'Fixed meal time');
        if (/receipt\s+missing|⚠️/i.test(notes)) importantNotes.push('Receipt missing — verify reservation');
        if (importantNotes.length === 0) return null;
        return (
          <div className="px-3 sm:px-4 pb-2">
            {importantNotes.map((note, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-tmb-amber">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {expanded && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-tmb-line2">
          {/* Tab bar - scrollable on mobile */}
          <div className="flex gap-1 mb-3 sm:mb-4 pb-3 border-b border-tmb-line2 overflow-x-auto">
            {[
              { id: 'segments', label: 'Segments', labelFull: 'By Segment' },
              { id: 'sights', label: 'Sights', labelFull: 'All Sights', count: dayData.allSights.length },
              { id: 'food', label: 'Food', labelFull: 'Food & Refuges', count: dayData.allFood.length },
              { id: 'shortcuts', label: 'Shortcuts', labelFull: 'Shortcuts', count: dayData.allShortcuts.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id); }}
                className={`px-3 sm:px-4 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-tmb-kraft text-tmb-ink'
                    : 'text-tmb-muted hover:text-tmb-ink hover:bg-tmb-cream/60'
                }`}
              >
                <span className="sm:hidden">{tab.label}</span>
                <span className="hidden sm:inline">{tab.labelFull}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 text-tmb-muted">({tab.count})</span>
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
                <div className="text-sm text-tmb-muted text-center py-4">No sights on this day</div>
              ) : (
                Object.entries(groupByDayPosition(dayData.allSights)).map(([label, sights]) =>
                  sights.length > 0 && (
                    <div key={label}>
                      <div className="text-xs text-tmb-muted font-display uppercase tracking-[.12em] mb-2">{label}</div>
                      <div className="space-y-2">
                        {sights.map((sight, idx) => {
                          const sightId = `${sight.segmentKey}-${sight.name}`;
                          const isExpanded = expandedSightId === sightId;
                          return (
                            <div key={idx} className="rounded-xl bg-tmb-cream/60 overflow-hidden">
                              <button
                                onClick={(e) => { e.stopPropagation(); setExpandedSightId(isExpanded ? null : sightId); }}
                                className="w-full p-3 flex items-start gap-3 text-left hover:bg-tmb-cream/60 transition-colors"
                              >
                                <SightIcon type={sight.type} className="w-4 h-4 text-tmb-amber mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-tmb-ink">{sight.name}</span>
                                    {sight.photoRating >= 4 && (
                                      <span className="text-xs text-tmb-amber">★{sight.photoRating}</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-tmb-muted mt-0.5">{sight.description}</div>
                                  <div className="text-[10px] text-tmb-muted/70 mt-1">{sight.segmentLabel}</div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-tmb-muted shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                              {isExpanded && (
                                <div className="px-3 pb-3 pt-0">
                                  <div className="p-3 rounded-lg bg-tmb-cream/60 text-xs text-tmb-muted">
                                    {sight.detailedDescription}
                                    {sight.timeToVisit > 0 && (
                                      <div className="mt-2 text-tmb-muted">
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
                <div className="text-sm text-tmb-muted text-center py-4">No food stops on this day</div>
              ) : (
                dayData.allFood.map((food, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-tmb-cream/60">
                    {food.type === 'refuge' ? (
                      <Home className="w-4 h-4 text-tmb-clay mt-0.5 shrink-0" />
                    ) : (
                      <Utensils className="w-4 h-4 text-tmb-clay mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-tmb-ink">{food.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          food.type === 'refuge' ? 'bg-tmb-clay/15 text-tmb-clay' :
                          food.type === 'restaurant' ? 'bg-tmb-moss/20 text-tmb-moss' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {food.type}
                        </span>
                        <span className="text-xs text-tmb-muted">{food.priceRange}</span>
                      </div>
                      <div className="text-xs text-tmb-muted mt-0.5">{food.description}</div>
                      {food.specialty && (
                        <div className="text-xs text-tmb-clay/70 mt-1">★ {food.specialty}</div>
                      )}
                      <div className="text-[10px] text-tmb-muted/70 mt-1">{food.segmentLabel}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              {dayData.allShortcuts.length === 0 ? (
                <div className="text-sm text-tmb-muted text-center py-4">No shortcuts available on this day</div>
              ) : (
                <>
                  {timeSaved > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-tmb-gold/10 border border-tmb-gold/20">
                      <span className="text-sm text-tmb-gold">Time saved with selected shortcuts</span>
                      <span className="text-sm font-semibold text-tmb-gold">{formatTime(timeSaved)}</span>
                    </div>
                  )}
                  {dayData.allShortcuts.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl transition-colors ${
                        shortcut.isSelected ? 'bg-tmb-gold/15 border border-tmb-gold/30' : 'bg-tmb-cream/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); onShortcutToggle(shortcut.shortcutId, shortcut.timeSaved); }}
                          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            shortcut.isSelected
                              ? 'bg-tmb-pine border-tmb-pine'
                              : 'border-tmb-muted hover:border-tmb-gold'
                          }`}
                        >
                          {shortcut.isSelected && <Check className="w-3 h-3 text-tmb-ink" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <ShortcutIcon type={shortcut.type} className="w-4 h-4 text-tmb-gold" />
                            <span className="text-sm font-medium text-tmb-ink">{shortcut.name}</span>
                          </div>
                          <div className="text-xs text-tmb-muted mt-1">{shortcut.description}</div>
                          <div className="flex flex-wrap gap-2 mt-2 text-xs">
                            {shortcut.timeSaved > 0 && (
                              <span className="text-tmb-gold">-{formatTime(shortcut.timeSaved)}</span>
                            )}
                            {shortcut.distanceSaved > 0 && (
                              <span className="text-tmb-gold">-{shortcut.distanceSaved}km</span>
                            )}
                            {shortcut.ascentSaved > 0 && (
                              <span className="text-tmb-gold">-↑{shortcut.ascentSaved}m</span>
                            )}
                            {shortcut.descentSaved > 0 && (
                              <span className="text-tmb-gold">-↓{shortcut.descentSaved}m</span>
                            )}
                            {shortcut.cost > 0 && (
                              <span className="text-tmb-amber">€{shortcut.cost}</span>
                            )}
                          </div>
                          {shortcut.skipsToWaypoint && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-tmb-amber">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Skips to {WAYPOINTS[shortcut.skipsToWaypoint]?.name}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-tmb-muted/70 mt-1">{shortcut.segmentLabel}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Stats are shown in the card body above */}
        </div>
      )}
    </GlassCard>
  );
};

const DeleteConfirmModal = ({ isOpen, dayNumber, startName, endName, onCancel, onConfirm }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      // Reset visibility when modal closes
      requestAnimationFrame(() => setIsVisible(false));
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
        className={`relative max-w-md w-full p-6 rounded-2xl border border-tmb-line shadow-2xl transition-all duration-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{ backgroundColor: 'rgba(42, 39, 32, 0.96)', backdropFilter: 'blur(24px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-display uppercase text-white mb-2">
          Delete Day {dayNumber}?
        </h3>
        <p className="text-tmb-muted text-sm mb-6">
          This will remove <span className="text-tmb-ink">{startName}</span> → <span className="text-tmb-ink">{endName}</span> from your itinerary. The segments will be merged with the next day.
        </p>
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-3 sm:py-2 min-h-[44px] rounded-lg bg-white/10 hover:bg-tmb-kraft text-tmb-ink text-sm font-medium transition-colors order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-3 sm:py-2 min-h-[44px] rounded-lg bg-red-500 hover:bg-red-600 text-tmb-ink text-sm font-medium transition-colors order-1 sm:order-2"
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
      requestAnimationFrame(() => {
        setIsVisible(true);
        setCopied(false);
      });
    } else {
      requestAnimationFrame(() => setIsVisible(false));
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
        className={`relative max-w-lg w-full p-6 rounded-2xl border border-tmb-line2 shadow-2xl transition-all duration-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{ backgroundColor: 'rgba(42, 39, 32, 0.96)', backdropFilter: 'blur(24px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center text-tmb-muted hover:text-tmb-ink transition-colors rounded-lg hover:bg-tmb-kraft"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-10 h-10 rounded-xl bg-tmb-forest flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5 text-tmb-ink" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-tmb-ink">Share Itinerary</h3>
            <p className="text-tmb-muted text-xs">Anyone with this link can view this trip</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-tmb-muted font-display uppercase tracking-[.12em] block mb-2">Shareable Link</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tmb-muted" />
              <input
                ref={inputRef}
                type="text"
                value={shareUrl}
                readOnly
                className="w-full bg-tmb-cream border border-tmb-line rounded-lg pl-10 pr-4 py-3 sm:py-2.5 text-sm text-tmb-ink focus:outline-none focus:border-tmb-gold/50"
                onClick={(e) => e.target.select()}
              />
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-3 sm:py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-tmb-pine text-tmb-ink'
                  : 'bg-tmb-pine text-white hover:shadow-lg'
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

        <div className="p-3 rounded-lg bg-tmb-cream/60 border border-tmb-line2">
          <p className="text-xs text-tmb-muted">
            This is a live link — anyone with it can view and edit the same trip in real time. Changes sync automatically between devices.
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
    success: 'bg-tmb-pine border-tmb-moss text-white',
    error: 'bg-tmb-rust border-tmb-clay text-white',
    info: 'bg-tmb-forest border-tmb-moss text-white',
  };

  return createPortal(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div
        className={`px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 ${colors[type]}`}
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
          className="w-11 h-11 sm:w-8 sm:h-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center text-tmb-muted/70 hover:bg-white hover:text-tmb-ink transition-colors"
          title="Fit entire route"
        >
          <Maximize2 className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
};

// Offline map download button — sits in bottom-right corner of map
const OfflineMapButton = ({ tileUrl }) => {
  const [state, setState] = useState('idle'); // idle | checking | downloading | done
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [tileInfo, setTileInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await getCachedTileCount(tileUrl);
        if (!cancelled) {
          setTileInfo(info);
          if (info.cached === info.total && info.total > 0) setState('done');
        }
      } catch { /* cache API may not be available */ }
    })();
    return () => { cancelled = true; };
  }, [tileUrl]);

  const handleDownload = async () => {
    setState('downloading');
    await warmTiles(tileUrl, (done, total) => setProgress({ done, total }));
    setState('done');
  };

  const tiles = tileInfo || { cached: 0, total: getTileList(tileUrl).length };
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      <div
        className="rounded-xl border border-tmb-line2 shadow-xl overflow-hidden"
        style={{ backgroundColor: 'rgba(42, 39, 32, 0.92)', backdropFilter: 'blur(12px)' }}
      >
        {state === 'downloading' ? (
          <div className="px-3 py-2 min-w-[160px]">
            <div className="text-[10px] text-tmb-muted mb-1">Downloading tiles...</div>
            <div className="w-full h-1.5 bg-tmb-line rounded-full overflow-hidden">
              <div className="h-full bg-tmb-pine transition-all duration-300 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[10px] text-tmb-muted mt-1">{progress.done}/{progress.total} ({pct}%)</div>
          </div>
        ) : state === 'done' ? (
          <div className="px-3 py-2 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-tmb-moss" />
            <span className="text-[11px] text-tmb-moss">Map cached</span>
          </div>
        ) : (
          <button
            onClick={handleDownload}
            className="px-3 py-2 flex items-center gap-1.5 hover:bg-tmb-cream/60 transition-colors min-h-[44px]"
          >
            <Download className="w-3.5 h-3.5 text-tmb-muted" />
            <div className="text-left">
              <div className="text-[11px] text-tmb-ink">Offline Map</div>
              <div className="text-[9px] text-tmb-muted">~{tiles.total} tiles · ~25MB</div>
            </div>
          </button>
        )}
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
      requestAnimationFrame(() => setIsVisible(false));
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
        className={`relative max-w-lg w-full max-h-[85vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6 rounded-2xl border border-tmb-line2 shadow-2xl transition-all duration-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{ backgroundColor: 'rgba(42, 39, 32, 0.96)', backdropFilter: 'blur(24px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center text-tmb-muted hover:text-tmb-ink transition-colors rounded-lg hover:bg-tmb-kraft"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-tmb-ink text-lg sm:text-xl font-bold shrink-0"
            style={{ backgroundColor: color }}
          >
            {d.day}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-tmb-ink">Day {d.day}</h3>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-tmb-muted">
              <span>{formatDate(d.date)}</span>
              <span>·</span>
              <span>{countries.join(' ')}</span>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="mb-4 p-3 rounded-lg bg-tmb-cream/60">
          <div className="text-xs text-tmb-muted font-display uppercase tracking-[.12em] mb-1">Route</div>
          <div className="text-tmb-ink text-sm sm:text-base">
            {d.startWp.name} <span className="text-tmb-muted">→</span> {d.endWp.name}
          </div>
        </div>

        {/* Stats Grid - 2x2 on mobile, 4 col on tablet+ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <div className="p-3 rounded-lg bg-tmb-cream/60 text-center">
            <div className="text-base sm:text-lg font-semibold text-tmb-ink">{d.distance}</div>
            <div className="text-xs text-tmb-muted">km</div>
          </div>
          <div className="p-3 rounded-lg bg-tmb-cream/60 text-center">
            <div className="text-base sm:text-lg font-semibold text-tmb-moss">↑{d.ascent}</div>
            <div className="text-xs text-tmb-muted">m gain</div>
          </div>
          <div className="p-3 rounded-lg bg-tmb-cream/60 text-center">
            <div className="text-base sm:text-lg font-semibold text-tmb-rust">↓{d.descent}</div>
            <div className="text-xs text-tmb-muted">m loss</div>
          </div>
          <div className="p-3 rounded-lg bg-tmb-cream/60 text-center">
            <div className="text-base sm:text-lg font-semibold text-tmb-ink">{formatTime(d.time)}</div>
            <div className="text-xs text-tmb-muted">time</div>
          </div>
        </div>

        {/* Waypoints */}
        <div className="mb-4">
          <div className="text-xs text-tmb-muted font-display uppercase tracking-[.12em] mb-2">Waypoints ({waypoints.length})</div>
          <div className="flex flex-wrap gap-1.5">
            {waypoints.map((wp, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-tmb-cream/60 text-tmb-ink">
                {wp.name} ({wp.altitude}m)
              </span>
            ))}
          </div>
        </div>

        {/* Sights */}
        {allSights.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-tmb-muted font-display uppercase tracking-[.12em] mb-2">Highlights</div>
            <div className="space-y-2">
              {allSights.map((sight, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{sight.icon}</span>
                  <span className="text-tmb-ink">{sight.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Food Stops */}
        {allFood.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-tmb-muted font-display uppercase tracking-[.12em] mb-2">Food & Refuges</div>
            <div className="space-y-2">
              {allFood.map((food, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{food.type === 'refuge' ? '🏠' : '🍽️'}</span>
                  <span className="text-tmb-ink">{food.name}</span>
                  {food.altitude && <span className="text-xs text-tmb-muted">{food.altitude}m</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shortcuts */}
        {allShortcuts.length > 0 && (
          <div>
            <div className="text-xs text-tmb-muted font-display uppercase tracking-[.12em] mb-2">Shortcuts Available</div>
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
                        ? 'bg-white/10 border-tmb-line'
                        : 'bg-tmb-cream/60 border-transparent hover:bg-tmb-kraft'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{isCableCar ? '🚡' : isBus ? '🚌' : '↗️'}</span>
                      <div className="text-left">
                        <div className="text-sm text-tmb-ink">{shortcut.name}</div>
                        <div className="text-xs text-tmb-muted">{shortcut.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm" style={{ color: scColor }}>-{formatTime(shortcut.timeSaved)}</div>
                        {shortcut.cost > 0 && <div className="text-xs text-tmb-amber">€{shortcut.cost}</div>}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-tmb-pine border-tmb-pine' : 'border-tmb-muted'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-tmb-ink" />}
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

  // Dynamic line weight based on zoom level - thicker for dark map
  const getLineWeight = (isSelected, isHovered) => {
    if (isSelected) return currentZoom < 11 ? 7 : 9;
    if (isHovered) return currentZoom < 11 ? 6 : 8;
    // Thicker lines on dark background
    if (currentZoom < 10) return 3;
    if (currentZoom < 11) return 4;
    return 5;
  };

  // Shadow/glow line weight (slightly larger than main line)
  const getShadowWeight = (isSelected, isHovered) => {
    return getLineWeight(isSelected, isHovered) + 3;
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
      {/* Map Container - taller on mobile for better touch interaction */}
      <div className="relative rounded-2xl overflow-hidden h-[70vh] sm:h-[500px]">
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          className="h-full w-full"
          style={{ background: '#f6eedd' }}
          zoomControl={true}
          minZoom={9}
          maxZoom={15}
        >
          {/* Fit to route bounds on load */}
          <FitBoundsOnLoad />

          {/* Track zoom level for dynamic styling */}
          <ZoomTracker onZoomChange={setCurrentZoom} />

          {/* Tile layer - supports Thunderforest outdoors or CARTO dark fallback */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={import.meta.env.VITE_MAP_TILE_URL || "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"}
            maxZoom={19}
          />

          {/* Route shadow/glow lines (rendered first, behind main lines) */}
          {daySegments.map((segment, i) => {
            const isSelected = selectedDay === i;
            const isHovered = hoveredDay === i;
            const hasSelection = selectedDay !== null;
            const shadowOpacity = hasSelection
              ? (isSelected ? 0.6 : 0.1)
              : (hoveredDay === null || isHovered ? 0.4 : 0.15);

            return (
              <Polyline
                key={`shadow-${i}`}
                positions={segment.positions}
                pathOptions={{
                  color: '#000',
                  weight: getShadowWeight(isSelected, isHovered),
                  opacity: shadowOpacity,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            );
          })}

          {/* Route segments by day */}
          {daySegments.map((segment, i) => {
            const isSelected = selectedDay === i;
            const isHovered = hoveredDay === i;
            const hasSelection = selectedDay !== null;
            const baseOpacity = getBaseOpacity();
            const opacity = hasSelection
              ? (isSelected ? 1 : 0.25)
              : (hoveredDay === null || isHovered ? baseOpacity : 0.4);

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
                weight: currentZoom < 10 ? 3 : currentZoom < 11 ? 4 : 5,
                opacity: selectedDay !== null ? 0.5 : 0.9,
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
                radius={icon.isSelected ? 11 : 8}
                pathOptions={{
                  color: icon.isSelected ? '#fff' : '#7a6e52',
                  weight: 2,
                  fillColor: icon.isSelected ? color : '#475569',
                  fillOpacity: icon.isSelected ? 1 : 0.8
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
                      {icon.shortcut.timeSaved > 0 && `-${formatTime(icon.shortcut.timeSaved)}`}
                      {icon.shortcut.distanceSaved > 0 && ` · -${icon.shortcut.distanceSaved}km`}
                      {icon.shortcut.ascentSaved > 0 && ` · -↑${icon.shortcut.ascentSaved}m`}
                      {icon.shortcut.descentSaved > 0 && ` · -↓${icon.shortcut.descentSaved}m`}
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

          {/* Start marker - outer glow */}
          <CircleMarker
            center={[WAYPOINTS[0].lat, WAYPOINTS[0].lng]}
            radius={16}
            pathOptions={{
              color: '#1c3a2a',
              weight: 0,
              fillColor: '#1c3a2a',
              fillOpacity: 0.3
            }}
          />
          {/* Start marker - main */}
          <CircleMarker
            center={[WAYPOINTS[0].lat, WAYPOINTS[0].lng]}
            radius={12}
            pathOptions={{
              color: '#fff',
              weight: 3,
              fillColor: '#1c3a2a',
              fillOpacity: 1
            }}
        >
          <Tooltip permanent direction="top" offset={[0, -12]}>
            <span className="font-bold text-xs px-1">START</span>
          </Tooltip>
        </CircleMarker>

        {/* Day endpoint markers */}
        {dayMarkers.map((marker, i) => (
          <CircleMarker
            key={`marker-${i}`}
            center={marker.position}
            radius={hoveredDay === i ? 12 : 10}
            pathOptions={{
              color: '#fff',
              weight: 2,
              fillColor: marker.color,
              fillOpacity: 1
            }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
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
          radius={8}
          pathOptions={{
            color: '#fff',
            weight: 2,
            fillColor: '#f8fafc',
            fillOpacity: 0.95
          }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            <div className="font-sans text-center">
              <div className="font-semibold">⛰️ Mont Blanc</div>
              <div className="text-xs text-gray-600">{MONT_BLANC.altitude}m</div>
            </div>
          </Tooltip>
        </CircleMarker>

        <MapControls />
      </MapContainer>

      {/* Offline Map Download Button */}
      <OfflineMapButton tileUrl={import.meta.env.VITE_MAP_TILE_URL || "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"} />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div
          className="p-3 rounded-xl border border-tmb-line2 shadow-xl"
          style={{ backgroundColor: 'rgba(42, 39, 32, 0.92)', backdropFilter: 'blur(12px)' }}
        >
          <div className="text-xs text-tmb-muted uppercase tracking-wider mb-2">Legend</div>
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
                <span className="text-tmb-ink">Day {d.day}</span>
              </div>
            ))}
            {dayData.length > 8 && (
              <div className="text-xs text-tmb-muted">+{dayData.length - 8} more</div>
            )}
          </div>

          {activeShortcuts?.shortcuts?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-tmb-line2">
              <div className="text-xs text-tmb-muted uppercase tracking-wider mb-2">Shortcuts</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-tmb-gold" />
                  <span className="text-tmb-ink">Cable Car</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-amber-400" />
                  <span className="text-tmb-ink">Bus</span>
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
          style={{ backgroundColor: 'rgba(42, 39, 32, 0.85)', backdropFilter: 'blur(8px)' }}
        >
          <span className="text-tmb-ink">🇫🇷 France</span>
          <span className="text-tmb-muted mx-2">·</span>
          <span className="text-tmb-ink">🇮🇹 Italy</span>
          <span className="text-tmb-muted mx-2">·</span>
          <span className="text-tmb-ink">🇨🇭 Switzerland</span>
        </div>
      </div>

      {/* Total stats overlay */}
      <div className="absolute top-4 right-4 z-[1000]">
        <div
          className="px-3 py-2 rounded-xl"
          style={{ backgroundColor: 'rgba(42, 39, 32, 0.85)', backdropFilter: 'blur(8px)' }}
        >
          <div className="text-xs text-tmb-muted">Tour du Mont Blanc</div>
          <div className="text-sm font-semibold text-tmb-ink">
            {WAYPOINTS[WAYPOINTS.length - 1].cumDist.toFixed(0)} km Circuit
          </div>
        </div>
      </div>
    </div>

      {/* Journey Summary Table */}
      <GlassCard className="p-6 mt-6">
        <h3 className="text-sm font-medium text-tmb-muted uppercase tracking-wider mb-4">Daily Breakdown</h3>
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

// --- Bookings UI Components ---

const BookingCard = ({ booking, getFileUrl }) => {
  const [expanded, setExpanded] = useState(false);
  const [fileUrls, setFileUrls] = useState({});

  const loadFileUrls = useCallback(async () => {
    if (!booking.documents?.length || Object.keys(fileUrls).length > 0) return;
    const urls = {};
    for (const doc of booking.documents) {
      const url = await getFileUrl(doc.storage_path);
      if (url) urls[doc.storage_path] = url;
    }
    setFileUrls(urls);
  }, [booking.documents, getFileUrl, fileUrls]);

  useEffect(() => {
    if (expanded) loadFileUrls();
  }, [expanded, loadFileUrls]);

  const importantNotes = [];
  const notes = booking.notes || '';
  if (/navette/i.test(notes)) importantNotes.push(notes.match(/\d{2}:\d{2}\s+navette[^.;]*/i)?.[0] || 'Navette required');
  if (/sleeping.?bag\s+liner/i.test(notes)) importantNotes.push(notes.match(/sleeping.?bag\s+liner[^.;]*/i)?.[0] || 'Sleeping-bag liner required');
  if (/pay\s+in\s+CHF/i.test(notes)) importantNotes.push('Pay in CHF');
  if (/meal\s+\d{2}:\d{2}/i.test(notes)) importantNotes.push(notes.match(/meal\s+\d{2}:\d{2}[^.;]*/i)?.[0] || 'Fixed meal time');
  if (/receipt\s+missing|⚠️/i.test(notes)) importantNotes.push('Receipt missing — verify reservation');

  return (
    <GlassCard className="overflow-hidden" hover>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-tmb-cream/60 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-tmb-forest flex items-center justify-center shrink-0 text-sm font-bold text-tmb-ink">
          {booking.day_index || '—'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-tmb-ink">{booking.place_name}</span>
            {booking.type && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-tmb-muted">{booking.type}</span>}
            {booking.status && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-tmb-moss/15 text-tmb-moss border border-tmb-moss/20">{booking.status}</span>}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-tmb-muted">
            <span>{booking.check_in} → {booking.check_out}</span>
            {booking.cost && (
              <span className="text-tmb-moss font-medium">
                {booking.currency === 'CHF' ? 'CHF ' : '€'}{Number(booking.cost).toFixed(2)}
              </span>
            )}
          </div>
          {importantNotes.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-300">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{importantNotes[0]}</span>
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-tmb-muted shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-tmb-line2 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {booking.confirmation_no && (
              <>
                <span className="text-tmb-muted">Confirmation</span>
                <span className="text-tmb-ink font-mono">{booking.confirmation_no}</span>
              </>
            )}
            {booking.guests && (
              <>
                <span className="text-tmb-muted">Room</span>
                <span className="text-tmb-ink">{booking.guests}</span>
              </>
            )}
            {booking.phone && (
              <>
                <span className="text-tmb-muted">Phone</span>
                <a href={`tel:${booking.phone}`} className="text-tmb-gold hover:text-tmb-forest flex items-center gap-1">
                  <Phone className="w-3 h-3" />{booking.phone}
                </a>
              </>
            )}
            {booking.booking_url && (
              <>
                <span className="text-tmb-muted">Booking</span>
                <a href={booking.booking_url} target="_blank" rel="noopener noreferrer" className="text-tmb-gold hover:text-tmb-forest flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />View booking
                </a>
              </>
            )}
            {booking.location && (
              <>
                <span className="text-tmb-muted">Address</span>
                <span className="text-tmb-ink">{booking.location}</span>
              </>
            )}
          </div>

          {booking.notes && (
            <div className="text-xs text-tmb-muted bg-tmb-cream/60 rounded-lg p-2.5">
              {booking.notes}
            </div>
          )}

          {importantNotes.length > 0 && (
            <div className="space-y-1">
              {importantNotes.map((note, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 rounded-lg px-2.5 py-1.5 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          )}

          {booking.documents?.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-tmb-muted mb-2">Documents</div>
              <div className="flex flex-wrap gap-2">
                {booking.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={fileUrls[doc.storage_path] || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-tmb-cream border border-tmb-line text-xs hover:bg-tmb-kraft transition-colors ${fileUrls[doc.storage_path] ? 'text-tmb-gold' : 'text-tmb-muted'}`}
                    onClick={(e) => { if (!fileUrls[doc.storage_path]) e.preventDefault(); }}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[160px]">{doc.kind || 'file'}</span>
                    {fileUrls[doc.storage_path] && <ExternalLink className="w-3 h-3" />}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
};

const BookingsPanel = ({ bookings, arrivalBooking, totals, gaps, getFileUrl, loading }) => {
  if (loading) {
    return (
      <GlassCard className="p-8 text-center">
        <LoaderCircle className="w-6 h-6 animate-spin text-tmb-moss mx-auto mb-2" />
        <p className="text-tmb-muted text-sm">Loading bookings...</p>
      </GlassCard>
    );
  }

  if (!bookings.length) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="text-4xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-tmb-ink mb-2">No Bookings Yet</h3>
        <p className="text-tmb-muted text-sm">Run the ingest script to load bookings from the manifest.</p>
      </GlassCard>
    );
  }

  const stageBookings = bookings.filter(b => b.phase === 'stage');

  return (
    <div className="space-y-4">
      {/* Needs Attention */}
      {gaps.length > 0 && (
        <GlassCard className="p-4 border-l-4 border-l-amber-500/60">
          <h4 className="text-sm font-semibold text-amber-300 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" /> Needs Attention
          </h4>
          <div className="space-y-2">
            {gaps.map((gap, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-tmb-amber mt-0.5">•</span>
                <div>
                  <span className="text-tmb-ink">{gap.label}</span>
                  <span className="text-tmb-muted ml-2">— {gap.action}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Cost Summary */}
      <GlassCard className="p-4">
        <h4 className="text-sm font-semibold text-tmb-ink mb-3 flex items-center gap-2">
          <span className="text-lg">💰</span> Cost Summary
        </h4>
        <div className="flex gap-6">
          <div>
            <div className="text-2xl font-bold text-tmb-moss">€{totals.eur.toFixed(2)}</div>
            <div className="text-[10px] text-tmb-muted font-display uppercase tracking-[.12em]">EUR</div>
          </div>
          {totals.chf > 0 && (
            <div>
              <div className="text-2xl font-bold text-tmb-gold">CHF {totals.chf.toFixed(2)}</div>
              <div className="text-[10px] text-tmb-muted font-display uppercase tracking-[.12em]">CHF</div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Arrival Booking */}
      {arrivalBooking && (
        <div>
          <div className="text-xs text-tmb-muted font-display uppercase tracking-[.12em] mb-2 px-1">Arrival</div>
          <BookingCard booking={arrivalBooking} getFileUrl={getFileUrl} />
        </div>
      )}

      {/* Stage Bookings */}
      {stageBookings.length > 0 && (
        <div>
          <div className="text-xs text-tmb-muted font-display uppercase tracking-[.12em] mb-2 px-1">Stages (Days 1–{stageBookings.length})</div>
          <div className="space-y-2">
            {stageBookings.map((b) => (
              <BookingCard key={b.id} booking={b} getFileUrl={getFileUrl} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const { token: urlToken, section: urlSection } = useParams();
  const section = urlSection || 'trail';
  const navigate = useNavigate();
  const { trip, jwt, loading: tripLoading, error: tripError, syncing, connected, online, pendingCount, updateTrip, createTrip, shareToken: tripShareToken } = useTrip(urlToken);
  const { bookings, bookingsByDayIndex, arrivalBooking, totals: bookingTotals, gaps: bookingGaps, getFileUrl, loading: bookingsLoading } = useBookings(trip?.id, jwt);
  const { items: gearItems, loading: gearLoading, error: gearError, togglePacked, updateItem: updateGearItem } = useGearItems(trip?.id, jwt);
  const { legs: transportLegs, legsByDay, loading: transportLoading, error: transportError, createLeg, updateLeg, deleteLeg } = useTransportLegs(trip?.id, jwt);
  const { contacts: safetyContacts, loading: contactsLoading, error: contactsError, createContact, updateContact, deleteContact } = useSafetyContacts(trip?.id, jwt);

  const [scenarios, setScenarios] = useState(DEFAULT_DATA.scenarios);
  const [activeScenarioId, setActiveScenarioId] = useState(DEFAULT_DATA.activeScenarioId);
  const [view, setView] = useState('plan');
  const [logisticsView, setLogisticsView] = useState('bookings');
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
  const [showMigration, setShowMigration] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const tripHydrated = useRef(false);

  // Show toast helper
  const showToast = (message, type = 'info') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  // Hydrate local state from Supabase trip data
  useEffect(() => {
    if (!trip || tripHydrated.current) return;
    tripHydrated.current = true;

    const scenario = {
      id: trip.id,
      name: trip.name,
      startDate: trip.start_date,
      days: trip.day_splits,
    };
    setScenarios([scenario]);
    setActiveScenarioId(trip.id);
    setSelectedShortcuts(trip.selected_shortcuts || {});
    setUseImperial(trip.use_imperial ?? true);
    setIsDirty(false);
  }, [trip]);

  // Handle remote updates from Realtime / polling
  useEffect(() => {
    if (!trip || !tripHydrated.current) return;
    // Only apply remote changes — skip our own optimistic updates
    setScenarios(prev => {
      const current = prev.find(s => s.id === trip.id);
      if (!current) return prev;
      // Check if this is actually a remote change
      if (
        current.name === trip.name &&
        current.startDate === trip.start_date &&
        JSON.stringify(current.days) === JSON.stringify(trip.day_splits)
      ) return prev;
      return prev.map(s =>
        s.id === trip.id
          ? { ...s, name: trip.name, startDate: trip.start_date, days: trip.day_splits }
          : s
      );
    });
    setSelectedShortcuts(trip.selected_shortcuts || {});
    setUseImperial(trip.use_imperial ?? true);
  }, [trip?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally react only to updated_at, not every trip re-render

  // On mount without a share token: check for localStorage to migrate, or check for old ?trip= param
  useEffect(() => {
    if (urlToken) return; // Already loading from share token
    if (tripLoading) return;

    // Handle legacy ?trip= snapshot links
    const urlParams = new URLSearchParams(window.location.search);
    const legacyTrip = urlParams.get('trip');
    if (legacyTrip) {
      const decoded = decodeScenarioFromUrl(legacyTrip, DEFAULT_DATA.scenarios[0].days);
      const scenario = {
        id: Date.now(),
        name: decoded.name,
        startDate: decoded.startDate,
        days: decoded.days,
      };
      setScenarios([scenario]);
      setActiveScenarioId(scenario.id);
      setSelectedShortcuts(decoded.selectedShortcuts);
      window.history.replaceState({}, '', window.location.pathname);
      showToast('Imported legacy shared trip! Use "Share" to get a live link.', 'success');
      return;
    }

    // Check for existing localStorage data to migrate
    const saved = localStorage.getItem(STORAGE_KEY);
    const migrated = localStorage.getItem('tmb-planner-migrated');
    if (saved && !migrated) {
      setShowMigration(true);
      // Load localStorage data as fallback while migration is pending
      try {
        const data = JSON.parse(saved);
        if (data.scenarios) setScenarios(data.scenarios);
        if (data.activeScenarioId) setActiveScenarioId(data.activeScenarioId);
        if (data.selectedShortcuts) setSelectedShortcuts(data.selectedShortcuts);
        if (data.useImperial !== undefined) setUseImperial(data.useImperial);
      } catch { /* ignore parse errors */ }
    }
  }, [urlToken, tripLoading]);

  // Migrate localStorage trip to Supabase
  const handleMigrate = async () => {
    setMigrating(true);
    try {
      // Use the real localStorage data, fall back to saved capture
      let saved;
      try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      } catch { /* ignore parse errors */ }

      const tripData = migrateLocalStorageToTrip(saved, savedTripCapture);
      if (!tripData) throw new Error('No scenario data found');

      const result = await createTrip({
        ...tripData,
        gear_items: gearSeed.items,
      });

      if (result?.share_token) {
        localStorage.setItem('tmb-planner-migrated', 'true');
        setShowMigration(false);
        navigate(`/t/${result.share_token}`, { replace: true });
        showToast('Trip migrated! This is now a live, shareable link.', 'success');
      } else {
        throw new Error('Migration failed');
      }
    } catch (err) {
      showToast(`Migration failed: ${err.message}`, 'error');
    } finally {
      setMigrating(false);
    }
  };

  // Sync changes to Supabase (auto-save, replaces manual Save button)
  const syncToSupabase = useCallback(() => {
    if (!trip?.id) return;
    const activeScen = scenarios.find(s => s.id === activeScenarioId);
    if (!activeScen) return;

    updateTrip({
      name: activeScen.name,
      start_date: activeScen.startDate,
      day_splits: activeScen.days,
      selected_shortcuts: selectedShortcuts,
      use_imperial: useImperial,
    });
    setIsDirty(false);
  }, [trip?.id, scenarios, activeScenarioId, selectedShortcuts, useImperial, updateTrip]);

  // Auto-save when data changes (if connected to Supabase)
  useEffect(() => {
    if (!trip?.id || !isDirty || !tripHydrated.current) return;
    syncToSupabase();
  }, [isDirty, syncToSupabase, trip?.id]);

  // Generate share URL (now uses the live /t/:token link)
  const handleShare = () => {
    if (!tripShareToken) {
      showToast('Save your trip first to get a shareable link', 'error');
      return;
    }
    const url = `${window.location.origin}/t/${tripShareToken}`;
    setShareUrl(url);
    setShowShareModal(true);
  };

  // Fallback save to localStorage (when not connected to Supabase)
  const saveToLocalStorage = () => {
    if (trip?.id) {
      // Connected to Supabase — sync instead
      syncToSupabase();
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      return;
    }
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

  const handleShortcutToggle = (shortcutId) => {
    setSelectedShortcuts(prev => ({
      ...prev,
      [shortcutId]: !prev[shortcutId]
    }));
    setIsDirty(true);
  };

  const getDayData = (scenario) => computeDayData(scenario, WAYPOINTS);

  const dayData = getDayData(activeScenario);

  // Calculate total stats saved from selected shortcuts
  const shortcutSavings = useMemo(() =>
    getShortcutSavings(selectedShortcuts, segmentData),
    [selectedShortcuts]
  );

  const totalTimeSaved = shortcutSavings.timeSaved;

  const totals = getTotals(dayData);

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

    return { shortcuts, totalCost, totalTimeSaved, totalDistanceSaved: shortcutSavings.distanceSaved, totalAscentSaved: shortcutSavings.ascentSaved, totalDescentSaved: shortcutSavings.descentSaved };
  }, [selectedShortcuts, totalTimeSaved, shortcutSavings, maxDist]);

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
    <div className="min-h-screen bg-tmb-cream text-tmb-ink font-body relative">
      {/* Faint topographic contour texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20,100 Q50,60 100,80 T180,70' fill='none' stroke='%232a2720' stroke-width='0.8'/%3E%3Cpath d='M10,140 Q60,100 120,120 T190,110' fill='none' stroke='%232a2720' stroke-width='0.6'/%3E%3Cpath d='M0,60 Q40,30 80,50 T160,40 T200,55' fill='none' stroke='%232a2720' stroke-width='0.5'/%3E%3Cpath d='M30,170 Q70,150 110,160 T200,145' fill='none' stroke='%232a2720' stroke-width='0.7'/%3E%3C/svg%3E")`, backgroundSize: '200px 200px' }} />

      {/* Alpine Hero Header */}
      <div className="relative overflow-hidden" style={{ height: 'clamp(200px, 30vw, 300px)' }}>
        <svg viewBox="0 0 1080 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#16243a"/><stop offset="42%" stopColor="#2c4a44"/>
              <stop offset="74%" stopColor="#c97f37"/><stop offset="100%" stopColor="#efc874"/>
            </linearGradient>
          </defs>
          <rect width="1080" height="300" fill="url(#sky)"/>
          <circle cx="800" cy="208" r="52" fill="#f4d98a" opacity=".9"/>
          <path d="M0,300 L0,150 L150,205 L300,120 L470,210 L520,165 L640,225 L760,150 L900,215 L1080,140 L1080,300 Z" fill="#3a5a45" opacity=".75"/>
          <path d="M0,300 L0,205 L120,235 L280,170 L300,120 L340,150 L470,210 L560,180 L700,240 L820,195 L960,245 L1080,205 L1080,300 Z" fill="#274536"/>
          <polygon points="300,120 270,150 330,150" fill="#f3ecd9"/>
          <polygon points="760,150 738,178 786,178" fill="#f3ecd9" opacity=".85"/>
          <path d="M0,300 L0,255 L160,275 L340,225 L520,272 L680,235 L860,275 L1080,248 L1080,300 Z" fill="#1c3a2a"/>
        </svg>
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.07] mix-blend-multiply" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,.5) .5px, transparent .6px)', backgroundSize: '3px 3px' }} />
        {/* Route stamp badge */}
        <div className="absolute right-4 sm:right-8 top-4 sm:top-6 w-20 h-20 sm:w-[118px] sm:h-[118px] rounded-full flex flex-col items-center justify-center text-center rotate-[7deg]" style={{ background: 'rgba(28,58,42,.55)', border: '2px solid #e3a93c', backdropFilter: 'blur(2px)' }}>
          <span className="absolute inset-2 border border-dashed border-tmb-gold rounded-full opacity-55" />
          <span className="font-poster text-xl sm:text-3xl leading-none text-[#f3d27e]">TMB</span>
          <span className="font-display text-[8px] sm:text-[9.5px] uppercase tracking-[.2em] mt-0.5 text-[#ecd49a]">2026 · 7 days</span>
        </div>
        {/* Hero caption */}
        <div className="absolute left-4 sm:left-8 bottom-4 sm:bottom-6 text-[#fff7e6]" style={{ textShadow: '0 2px 10px rgba(0,0,0,.45)' }}>
          <div className="font-display uppercase tracking-[.34em] text-[10px] sm:text-xs text-[#f3dca6]">France · Italy · Switzerland</div>
          <h1 className="font-poster uppercase text-4xl sm:text-7xl leading-[.84] tracking-[.01em] mt-1">Tour du<span className="block text-xl sm:text-3xl tracking-[.06em] text-[#f1c878]">Mont Blanc</span></h1>
          <div className="font-display uppercase tracking-[.16em] text-[10px] sm:text-[13px] mt-2 text-[#f6e7c4]">Aug 2–11 · the full loop</div>
        </div>
        {/* Sync status badge */}
        {trip?.id && (
          <div className="absolute top-3 left-4 sm:left-8">
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm text-tmb-ink/80" title={connected ? 'Live sync active' : syncing ? 'Syncing...' : !online ? `Offline${pendingCount ? ` (${pendingCount} pending)` : ''}` : 'Offline'}>
              {syncing ? (
                <><LoaderCircle className="w-3 h-3 animate-spin" /><span>Syncing</span></>
              ) : connected ? (
                <><Wifi className="w-3 h-3" /><span>Live</span></>
              ) : !online ? (
                <><CloudOff className="w-3 h-3" /><span>Offline{pendingCount > 0 && ` (${pendingCount})`}</span></>
              ) : (
                <><CloudOff className="w-3 h-3 opacity-50" /><span className="opacity-50">Offline</span></>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Stat ribbon */}
      <div className="grid grid-cols-4 bg-tmb-pine text-[#f4ead2]">
        {[
          { value: Math.round(totals.distance), label: 'km' },
          { value: `${(totals.ascent / 1000).toFixed(0)}K`, label: 'm climb' },
          { value: dayData.length, label: 'trail days' },
          { value: bookings?.filter(b => b.phase === 'stage')?.length || dayData.length, label: 'refuges' },
        ].map((m, i) => (
          <div key={i} className={`py-3 px-2 text-center ${i < 3 ? 'border-r border-tmb-line2' : ''}`}>
            <span className="font-poster text-xl sm:text-2xl text-tmb-ink block leading-none">{m.value}</span>
            <span className="font-display uppercase tracking-[.16em] text-[9px] sm:text-[10px] text-[#bcd0ad]">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Section nav — letterpress tabs */}
      <div className="flex bg-tmb-kraft border-b-2 border-[#c8ad77]">
        {[
          { id: 'trail', label: 'The Trail' },
          { id: 'logistics', label: 'Logistics & Packing' }
        ].map(s => (
          <button
            key={s.id}
            onClick={() => navigate(urlToken ? `/t/${urlToken}/${s.id}` : `/${s.id}`, { replace: false })}
            className={`font-display uppercase tracking-[.13em] text-sm font-semibold px-5 sm:px-7 py-3.5 border-b-4 transition-colors min-h-[48px] ${
              section === s.id
                ? 'text-tmb-pine border-tmb-rust bg-tmb-cream'
                : 'text-[#7d6b43] border-transparent hover:text-tmb-pine'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto relative px-4 sm:px-6 py-5 sm:py-8">

        {section === 'trail' && (<>
        {/* Scenario tabs and action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 mb-4 sm:mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide flex-wrap sm:flex-nowrap items-center">
            {scenarios.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveScenarioId(s.id)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-display uppercase tracking-wider transition-all duration-300 whitespace-nowrap min-h-[44px] ${
                  activeScenarioId === s.id
                    ? 'bg-tmb-pine text-tmb-ink shadow-md'
                    : 'bg-tmb-paper text-tmb-muted hover:bg-tmb-kraft border border-tmb-line'
                }`}
              >
                {s.name}
              </button>
            ))}
            <button
              onClick={createScenario}
              className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-tmb-paper border border-dashed border-tmb-line text-tmb-muted hover:bg-tmb-kraft hover:border-tmb-gold transition-all duration-300 flex items-center justify-center shrink-0"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-2 sm:ml-auto justify-end">
            {showSaved && (
              <span className="text-tmb-moss text-sm animate-pulse font-display uppercase tracking-wider">Saved!</span>
            )}
            <button
              onClick={() => {
                setUseImperial(!useImperial);
                setIsDirty(true);
              }}
              className="px-3 py-2 min-h-[44px] rounded-full text-xs font-display uppercase tracking-wider transition-all duration-300 bg-tmb-paper border border-tmb-line hover:bg-tmb-kraft flex items-center gap-1.5"
              title={useImperial ? 'Switch to metric (km/m)' : 'Switch to imperial (mi/ft)'}
            >
              <span className={useImperial ? 'text-tmb-muted' : 'text-tmb-moss font-bold'}>km</span>
              <span className="text-tmb-line">/</span>
              <span className={useImperial ? 'text-tmb-amber font-bold' : 'text-tmb-muted'}>mi</span>
            </button>
            <button
              onClick={handleShare}
              className="px-3 sm:px-4 py-2 sm:py-2.5 min-h-[44px] rounded-full text-sm font-display uppercase tracking-wider transition-all duration-300 flex items-center gap-2 bg-tmb-paper text-tmb-muted hover:bg-tmb-kraft border border-tmb-line hover:border-tmb-gold hover:text-tmb-ink"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={saveToLocalStorage}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 min-h-[44px] rounded-full text-sm font-display uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                isDirty
                  ? 'bg-tmb-rust text-tmb-ink shadow-md'
                  : 'bg-tmb-paper text-tmb-muted hover:bg-tmb-kraft border border-tmb-line'
              }`}
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
              {isDirty && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
            </button>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex gap-1 mb-4 sm:mb-6 bg-tmb-kraft border border-tmb-line rounded-[13px] p-1 sm:inline-flex w-full sm:w-auto">
          {[
            { id: 'plan', label: 'Itinerary' },
            { id: 'map', label: 'Route Map' },
            { id: 'elevation', label: 'Elevation' },
            { id: 'compare', label: 'Compare' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex-1 sm:flex-initial px-3 sm:px-5 py-2.5 sm:py-2 min-h-[44px] rounded-[9px] text-sm font-display uppercase tracking-[.08em] transition-all duration-300 ${
                view === tab.id ? 'bg-tmb-cream text-tmb-pine shadow-sm border border-tmb-line' : 'text-tmb-muted hover:text-tmb-ink hover:bg-tmb-cream/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
                    <div className="bg-tmb-cream/60 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-tmb-moss">{s.days.length}</div>
                      <div className="text-xs text-tmb-muted">days</div>
                    </div>
                    <div className="bg-tmb-cream/60 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-tmb-ink">{tots.distance.toFixed(0)}</div>
                      <div className="text-xs text-tmb-muted">km</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {data.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg bg-tmb-cream/60">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length].main }} />
                        <span className="text-tmb-muted w-6">D{d.day}</span>
                        <span className="text-tmb-ink flex-1 truncate">{d.endWp.name}</span>
                        <span className="text-tmb-muted">{d.distance}km</span>
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
            <GlassCard className="p-4 sm:p-6 mb-4 sm:mb-6">
              {/* Mobile layout: stacked */}
              <div className="md:hidden space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-display uppercase tracking-[.16em] text-tmb-muted block mb-2">Scenario</label>
                    <input
                      type="text"
                      value={activeScenario.name}
                      onChange={(e) => renameScenario(activeScenario.id, e.target.value)}
                      className="bg-transparent text-lg font-display text-tmb-ink border-b border-tmb-line focus:border-tmb-rust outline-none pb-1 w-full transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-display uppercase tracking-[.16em] text-tmb-muted block mb-2">Start Date</label>
                    <input
                      type="date"
                      value={activeScenario.startDate}
                      onChange={(e) => {
                        setScenarios(scenarios.map(s =>
                          s.id === activeScenarioId ? { ...s, startDate: e.target.value } : s
                        ));
                        setIsDirty(true);
                      }}
                      className="bg-tmb-cream border border-tmb-line px-4 py-3 min-h-[44px] rounded-[9px] text-sm text-tmb-ink focus:border-tmb-rust outline-none transition-colors w-full"
                    />
                  </div>
                </div>
                {/* Row 2: Stats */}
                <div className="flex items-center justify-between px-2 py-3 bg-tmb-cream/60 rounded-xl">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={mergeShortestDay}
                      disabled={dayData.length <= 1}
                      className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-lg bg-tmb-cream border border-tmb-line text-tmb-muted hover:bg-tmb-rust/15 hover:border-tmb-rust/30 hover:text-tmb-rust disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                      title="Remove day (merge shortest)"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="text-center min-w-[2.5rem]">
                      <div className="text-xl font-bold">{dayData.length}</div>
                      <div className="text-[10px] text-tmb-muted font-display uppercase tracking-[.12em]">Days</div>
                    </div>
                    <button
                      onClick={splitLongestDay}
                      className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-lg bg-tmb-cream border border-tmb-line text-tmb-muted hover:bg-tmb-moss/20 hover:border-tmb-moss/30 hover:text-tmb-moss transition-all flex items-center justify-center"
                      title="Add day (split longest)"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-tmb-ink">
                      {formatDistanceValue(totals.distance - shortcutSavings.distanceSaved, useImperial)}{getDistanceUnit(useImperial)}
                    </div>
                    <div className="text-[10px] text-tmb-muted font-display uppercase tracking-[.12em]">
                      {shortcutSavings.distanceSaved > 0 ? `−${formatDistanceValue(shortcutSavings.distanceSaved, useImperial)}` : 'Distance'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-tmb-ink">
                      {formatTime(totals.time - totalTimeSaved)}
                    </div>
                    <div className="text-[10px] text-tmb-muted font-display uppercase tracking-[.12em]">
                      {totalTimeSaved > 0 ? `−${formatTime(totalTimeSaved)}` : 'Hiking'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop layout: horizontal */}
              <div className="hidden md:flex flex-wrap gap-6 items-center justify-between">
                <div className="flex gap-6 items-center">
                  <div>
                    <label className="text-xs text-tmb-muted font-display uppercase tracking-[.12em] block mb-2">Scenario</label>
                    <input
                      type="text"
                      value={activeScenario.name}
                      onChange={(e) => renameScenario(activeScenario.id, e.target.value)}
                      className="bg-transparent text-xl font-light border-b border-tmb-line focus:border-tmb-rust outline-none pb-1 w-44 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-tmb-muted font-display uppercase tracking-[.12em] block mb-2">Start Date</label>
                    <input
                      type="date"
                      value={activeScenario.startDate}
                      onChange={(e) => {
                        setScenarios(scenarios.map(s =>
                          s.id === activeScenarioId ? { ...s, startDate: e.target.value } : s
                        ));
                        setIsDirty(true);
                      }}
                      className="bg-tmb-cream border border-tmb-line px-4 py-2 rounded-xl text-sm focus:border-tmb-rust outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  {/* Days with +/- buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={mergeShortestDay}
                      disabled={dayData.length <= 1}
                      className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg bg-tmb-cream border border-tmb-line text-tmb-muted hover:bg-tmb-rust/15 hover:border-tmb-rust/30 hover:text-tmb-rust disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                      title="Remove day (merge shortest)"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="text-center min-w-[3rem]">
                      <div className="text-2xl font-bold">{dayData.length}</div>
                      <div className="text-xs text-tmb-muted font-display uppercase tracking-[.12em]">Days</div>
                    </div>
                    <button
                      onClick={splitLongestDay}
                      className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg bg-tmb-cream border border-tmb-line text-tmb-muted hover:bg-tmb-moss/20 hover:border-tmb-moss/30 hover:text-tmb-moss transition-all flex items-center justify-center"
                      title="Add day (split longest)"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-px h-10 bg-white/10" />

                  {/* Distance */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-tmb-ink">
                      {formatDistanceValue(totals.distance - shortcutSavings.distanceSaved, useImperial)}{getDistanceUnit(useImperial)}
                    </div>
                    <div className="text-xs text-tmb-muted font-display uppercase tracking-[.12em]">
                      {shortcutSavings.distanceSaved > 0 ? `Distance (-${formatDistanceValue(shortcutSavings.distanceSaved, useImperial)})` : 'Distance'}
                    </div>
                  </div>

                  {/* Hiking time */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-tmb-ink">
                      {formatTime(totals.time - totalTimeSaved)}
                    </div>
                    <div className="text-xs text-tmb-muted font-display uppercase tracking-[.12em]">
                      {totalTimeSaved > 0 ? `Hiking (-${formatTime(totalTimeSaved)})` : 'Hiking'}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Trail line itinerary with Aug 2-11 bookends */}
            <div className="relative pl-8 sm:pl-10 mb-6" style={{ paddingTop: '8px' }}>
              {/* Dashed trail line */}
              <div className="absolute left-[17px] sm:left-[21px] top-6 bottom-6 w-[3px]" style={{ background: 'repeating-linear-gradient(#bf6334 0 7px, transparent 7px 14px)' }} />

              {/* ── Getting there ── */}
              {arrivalBooking && (<>
                <div className="flex items-center gap-2 mb-3 font-display uppercase tracking-[.16em] text-[11px] text-tmb-rust">
                  <span className="h-[2px] w-6 bg-tmb-rust" />Getting there
                </div>

                {/* Travel card — Barcelona → Chamonix */}
                <div className="relative mb-4">
                  <div className="absolute -left-8 sm:-left-10 top-4 w-[46px] h-[46px] rounded-full bg-tmb-clay flex items-center justify-center border-[3px] border-tmb-cream z-10" style={{ boxShadow: '0 4px 12px -3px rgba(0,0,0,.4)' }}>
                    <span className="text-lg">✈</span>
                  </div>
                  <div className="ml-6 sm:ml-8">
                    <GlassCard className="overflow-hidden">
                      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-tmb-line2">
                        <div className="flex items-center gap-2">
                          <span className="font-display uppercase tracking-[.02em] font-semibold text-lg">Barcelona</span>
                          <span className="text-tmb-clay font-display">→</span>
                          <span className="font-display uppercase font-semibold text-lg text-tmb-pine">Chamonix</span>
                        </div>
                        <span className="font-display tracking-[.13em] uppercase text-[10.5px] text-tmb-muted">Sun · Aug 2 · depart</span>
                      </div>
                      <div className="flex items-center gap-4 px-3 sm:px-4 py-2.5">
                        <p className="flex-1 text-[12.5px] text-tmb-muted">Fly BCN → Geneva, transfer to Chamonix. <strong className="font-semibold text-tmb-rust">The trip begins here.</strong></p>
                        <div className="flex items-center gap-2 bg-[#f1e7cf] border border-tmb-line rounded-[9px] px-2.5 py-1.5 shrink-0">
                          <div className="w-6 h-6 rounded-md bg-tmb-forest text-[#f3e7c9] flex items-center justify-center text-sm">⌂</div>
                          <div>
                            <div className="font-display uppercase tracking-[.05em] text-[8px] text-tmb-muted">Night</div>
                            <div className="font-semibold text-xs text-tmb-pine leading-tight">{arrivalBooking.place_name}</div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                </div>

                {/* Rest & acclimatize card */}
                <div className="relative mb-4">
                  <div className="absolute -left-8 sm:-left-10 top-4 w-[46px] h-[46px] rounded-full bg-tmb-moss flex items-center justify-center border-[3px] border-tmb-cream z-10" style={{ boxShadow: '0 4px 12px -3px rgba(0,0,0,.4)' }}>
                    <span className="text-lg">☼</span>
                  </div>
                  <div className="ml-6 sm:ml-8">
                    <GlassCard className="overflow-hidden">
                      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-tmb-line2">
                        <span className="font-display uppercase tracking-[.02em] font-semibold text-lg">Rest & acclimatize</span>
                        <span className="font-display tracking-[.13em] uppercase text-[10.5px] text-tmb-muted">Mon · Aug 3–4 · Chamonix</span>
                      </div>
                      <div className="flex items-center gap-4 px-3 sm:px-4 py-2.5">
                        <p className="flex-1 text-[12.5px] text-tmb-muted">Gear check, short legs-loosener, fuel up before the climb.</p>
                        <div className="flex items-center gap-2 bg-[#f1e7cf] border border-tmb-line rounded-[9px] px-2.5 py-1.5 shrink-0">
                          <div className="w-6 h-6 rounded-md bg-tmb-forest text-[#f3e7c9] flex items-center justify-center text-sm">⌂</div>
                          <div>
                            <div className="font-display uppercase tracking-[.05em] text-[8px] text-tmb-muted">Night</div>
                            <div className="font-semibold text-xs text-tmb-pine leading-tight">{arrivalBooking.place_name}</div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                </div>
              </>)}

              {/* ── On the trail ── */}
              <div className="flex items-center gap-2 mb-3 font-display uppercase tracking-[.16em] text-[11px] text-tmb-rust">
                <span className="h-[2px] w-6 bg-tmb-rust" />On the trail
              </div>

              <div className="space-y-4">
                {dayData.map((day, idx) => (
                  <div key={idx} className="relative">
                    {/* Day medallion on the trail line */}
                    <div
                      className={`absolute -left-8 sm:-left-10 top-4 w-[46px] h-[46px] rounded-full flex flex-col items-center justify-center border-[3px] border-tmb-cream z-10 ${DAY_COLORS[idx % DAY_COLORS.length].gradient}`}
                      style={{ boxShadow: '0 4px 12px -3px rgba(0,0,0,.4)' }}
                    >
                      <span className="text-[8px] font-display uppercase tracking-[.1em] text-white/85 -mt-px">Day</span>
                      <span className="text-xl font-poster text-white leading-none">{day.day}</span>
                    </div>

                    {/* Card offset from medallion */}
                    <div className="ml-6 sm:ml-8">
                      <ExpandableDayCard
                        day={day}
                        dayIndex={idx}
                        color={DAY_COLORS[idx % DAY_COLORS.length]}
                        activeScenario={activeScenario}
                        updateDay={updateDay}
                        removeDay={(dayIndex) => setDeleteConfirmDay(dayIndex)}
                        selectedShortcuts={selectedShortcuts}
                        onShortcutToggle={handleShortcutToggle}
                        useImperial={useImperial}
                        booking={bookingsByDayIndex?.get(idx + 1)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Heading home ── */}
              {bookings?.some(b => b.phase === 'departure') && (<>
                <div className="flex items-center gap-2 mt-5 mb-3 font-display uppercase tracking-[.16em] text-[11px] text-tmb-rust">
                  <span className="h-[2px] w-6 bg-tmb-rust" />Heading home
                </div>

                <div className="relative mb-2">
                  <div className="absolute -left-8 sm:-left-10 top-4 w-[46px] h-[46px] rounded-full bg-tmb-rust flex items-center justify-center border-[3px] border-tmb-cream z-10" style={{ boxShadow: '0 4px 12px -3px rgba(0,0,0,.4)' }}>
                    <span className="text-lg">✈</span>
                  </div>
                  <div className="ml-6 sm:ml-8">
                    <GlassCard className="overflow-hidden">
                      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-tmb-line2">
                        <div className="flex items-center gap-2">
                          <span className="font-display uppercase tracking-[.02em] font-semibold text-lg">Chamonix</span>
                          <span className="text-tmb-clay font-display">→</span>
                          <span className="font-display uppercase font-semibold text-lg text-tmb-pine">Barcelona</span>
                        </div>
                        <span className="font-display tracking-[.13em] uppercase text-[10.5px] text-tmb-muted">Tue · Aug 11 · return</span>
                      </div>
                      <div className="flex items-center gap-4 px-3 sm:px-4 py-2.5">
                        <p className="flex-1 text-[12.5px] text-tmb-muted">Transfer to Geneva, fly home.</p>
                        <div className="flex items-center gap-2 bg-[#f7e6cb] border border-[#e7c794] rounded-[9px] px-2.5 py-1.5 shrink-0">
                          <div className="w-6 h-6 rounded-md bg-tmb-amber text-white flex items-center justify-center text-sm">✈</div>
                          <div>
                            <div className="font-display uppercase tracking-[.05em] text-[8px] text-tmb-muted">Flight</div>
                            <div className="font-semibold text-xs text-[#8a5618] leading-tight">GVA → BCN · to add</div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                </div>
              </>)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: formatDistanceValue(totals.distance - shortcutSavings.distanceSaved, useImperial), unit: getDistanceUnit(useImperial), label: 'Total Distance', accent: 'text-tmb-pine', border: 'bg-tmb-pine', savings: shortcutSavings.distanceSaved, savingsFormatted: `-${formatDistanceValue(shortcutSavings.distanceSaved, useImperial)}${getDistanceUnit(useImperial)} saved` },
                { value: formatTime(totals.time - totalTimeSaved), unit: '', label: 'Hiking Time', accent: 'text-tmb-forest', border: 'bg-tmb-forest', savings: totalTimeSaved, savingsFormatted: `-${formatTime(totalTimeSaved)} saved` },
                { value: formatElevationValue(totals.ascent - shortcutSavings.ascentSaved, useImperial).toLocaleString(), unit: getElevationUnit(useImperial), label: 'Total Ascent', accent: 'text-tmb-moss', border: 'bg-tmb-moss', savings: shortcutSavings.ascentSaved, savingsFormatted: `-${formatElevationValue(shortcutSavings.ascentSaved, useImperial)}${getElevationUnit(useImperial)} saved` },
                { value: formatElevationValue(totals.descent - shortcutSavings.descentSaved, useImperial).toLocaleString(), unit: getElevationUnit(useImperial), label: 'Total Descent', accent: 'text-tmb-rust', border: 'bg-tmb-rust', savings: shortcutSavings.descentSaved, savingsFormatted: `-${formatElevationValue(shortcutSavings.descentSaved, useImperial)}${getElevationUnit(useImperial)} saved` },
              ].map((stat, i) => (
                <GlassCard key={i} className="p-5 text-center relative overflow-hidden" hover>
                  <div className={`text-3xl font-poster ${stat.accent}`}>
                    {stat.value}<span className="text-lg text-tmb-muted font-display">{stat.unit}</span>
                  </div>
                  {stat.savings > 0 && (
                    <div className="text-sm text-tmb-moss mt-1 font-display">{stat.savingsFormatted}</div>
                  )}
                  <div className="text-[10px] text-tmb-muted font-display uppercase tracking-[.12em] mt-1">{stat.label}</div>
                  <div className={`absolute inset-x-0 bottom-0 h-1 ${stat.border}`} />
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
                        <line x1="60" y1={y} x2="760" y2={y} stroke="#dcc699" strokeWidth="1" strokeDasharray="4,4" />
                        <text x="52" y={y + 4} fill="#7a6e52" fontSize="11" textAnchor="end" fontFamily="system-ui">{alt}m</text>
                      </g>
                    );
                  })}

                  {/* X-axis labels */}
                  {[0, 40, 80, 120, 160].map(km => (
                    <text key={km} x={60 + (km / maxDist) * 700} y={280} fill="#7a6e52" fontSize="11" textAnchor="middle" fontFamily="system-ui">{km}km</text>
                  ))}

                  {/* Subtle fill under the line */}
                  <path
                    d={`M 60 250 L ${WAYPOINTS.map(p => `${60 + (p.cumDist / maxDist) * 700} ${250 - ((p.altitude - minAlt) / (maxAlt - minAlt)) * 200}`).join(' L ')} L ${60 + (WAYPOINTS[WAYPOINTS.length-1].cumDist / maxDist) * 700} 250 Z`}
                    fill="rgba(107, 140, 84, 0.12)"
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
                          stroke="#dcc699"
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
                        <circle cx={x1} cy={y1} r={isHovered ? "10" : "8"} fill={color} stroke="#f6eedd" strokeWidth="2" style={{ transition: 'r 0.15s ease' }} />
                        {/* End marker */}
                        <circle cx={x2} cy={y2} r={isHovered ? "8" : "6"} fill={color} stroke="#f6eedd" strokeWidth="2" opacity="0.7" style={{ transition: 'r 0.15s ease' }} />
                        {/* Icon in middle of line */}
                        <circle cx={midX} cy={midY} r={isHovered ? "14" : "12"} fill={color} stroke="#f6eedd" strokeWidth="2" style={{ transition: 'r 0.15s ease' }} />
                        <text x={midX} y={midY + 4} fill="#f6eedd" fontSize={isHovered ? "12" : "10"} textAnchor="middle" fontWeight="bold">
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
                        <circle cx={x} cy={y} r={isHovered ? "13" : "10"} fill={color} stroke="#f6eedd" strokeWidth="2.5" style={{ transition: 'r 0.15s ease' }} />
                        <text x={x} y={y + 4} fill="white" fontSize={isHovered ? "12" : "10"} textAnchor="middle" fontWeight="bold" fontFamily="system-ui">{i + 1}</text>

                        {/* Invisible larger hit area for easier hovering */}
                        <circle cx={x} cy={y} r="20" fill="transparent" />
                      </g>
                    );
                  })}

                  {/* Start marker */}
                  <g>
                    <circle cx={60} cy={250 - ((WAYPOINTS[0].altitude - minAlt) / (maxAlt - minAlt)) * 200} r="6" fill="#1c3a2a" stroke="#f6eedd" strokeWidth="2" />
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
                        className="px-4 py-3 rounded-xl border border-tmb-line2 shadow-xl text-sm min-w-[200px]"
                        style={{ backgroundColor: 'rgba(42, 39, 32, 0.96)', backdropFilter: 'blur(12px)' }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length].main }} />
                          <span className="font-semibold text-tmb-ink">Day {d.day}</span>
                          <span className="text-tmb-muted">·</span>
                          <span className="text-tmb-muted text-xs">{formatDate(d.date)}</span>
                        </div>
                        <div className="text-tmb-ink text-xs mb-2">
                          {d.startWp.name} → {d.endWp.name}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div className="text-tmb-muted">Distance</div>
                          <div className="text-right text-tmb-ink">{d.distance} km</div>
                          <div className="text-tmb-muted">Ascent</div>
                          <div className="text-right text-tmb-moss">↑{d.ascent}m</div>
                          <div className="text-tmb-muted">Descent</div>
                          <div className="text-right text-tmb-rust">↓{d.descent}m</div>
                          <div className="text-tmb-muted">Time</div>
                          <div className="text-right text-tmb-ink">{formatTime(d.time)}</div>
                          <div className="text-tmb-muted">End altitude</div>
                          <div className="text-right text-tmb-ink">{d.endWp.altitude}m</div>
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
                        style={{ backgroundColor: 'rgba(42, 39, 32, 0.96)', backdropFilter: 'blur(12px)', borderColor: `${color}40` }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{isCableCar ? '🚡' : isBus ? '🚌' : '↗️'}</span>
                          <span className="font-semibold text-tmb-ink">{shortcut.name}</span>
                        </div>
                        <div className="text-xs text-tmb-muted mb-2">{shortcut.description}</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div className="text-tmb-muted">Type</div>
                          <div className="text-right" style={{ color }}>{shortcut.type.replace('_', ' ')}</div>
                          {shortcut.timeSaved > 0 && (
                            <>
                              <div className="text-tmb-muted">Time saved</div>
                              <div className="text-right text-tmb-gold">{formatTime(shortcut.timeSaved)}</div>
                            </>
                          )}
                          {shortcut.distanceSaved > 0 && (
                            <>
                              <div className="text-tmb-muted">Distance saved</div>
                              <div className="text-right text-tmb-gold">{shortcut.distanceSaved}km</div>
                            </>
                          )}
                          {shortcut.ascentSaved > 0 && (
                            <>
                              <div className="text-tmb-muted">Ascent saved</div>
                              <div className="text-right text-tmb-gold">↑{shortcut.ascentSaved}m</div>
                            </>
                          )}
                          {shortcut.descentSaved > 0 && (
                            <>
                              <div className="text-tmb-muted">Descent saved</div>
                              <div className="text-right text-tmb-gold">↓{shortcut.descentSaved}m</div>
                            </>
                          )}
                          {shortcut.cost > 0 && (
                            <>
                              <div className="text-tmb-muted">Cost</div>
                              <div className="text-right text-tmb-amber">€{shortcut.cost}</div>
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
                  <div key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-tmb-cream/60 hover:bg-tmb-kraft transition-colors">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length].main }} />
                    <span className="text-tmb-muted">D{d.day}</span>
                    <span className="text-tmb-muted">·</span>
                    <span className="text-tmb-ink">{d.endWp.name}</span>
                  </div>
                ))}
              </div>

              {/* Shortcuts Legend (when shortcuts are active) */}
              {activeShortcuts.shortcuts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-tmb-line2">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <span className="text-xs text-tmb-muted font-display uppercase tracking-[.12em]">Active Shortcuts</span>
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      {activeShortcuts.totalTimeSaved > 0 && (
                        <span className="text-tmb-gold">-{formatTime(activeShortcuts.totalTimeSaved)}</span>
                      )}
                      {activeShortcuts.totalDistanceSaved > 0 && (
                        <span className="text-tmb-gold">-{activeShortcuts.totalDistanceSaved.toFixed(1)}km</span>
                      )}
                      {activeShortcuts.totalAscentSaved > 0 && (
                        <span className="text-tmb-gold">-↑{activeShortcuts.totalAscentSaved}m</span>
                      )}
                      {activeShortcuts.totalDescentSaved > 0 && (
                        <span className="text-tmb-gold">-↓{activeShortcuts.totalDescentSaved}m</span>
                      )}
                      {activeShortcuts.totalCost > 0 && (
                        <span className="text-tmb-amber">€{activeShortcuts.totalCost}</span>
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
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full hover:bg-tmb-kraft transition-colors"
                          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
                        >
                          <span>{isCableCar ? '🚡' : isBus ? '🚌' : '↗️'}</span>
                          <span className="text-tmb-ink">{shortcut.name}</span>
                          <span className="text-tmb-muted">·</span>
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
              <h3 className="text-sm font-medium text-tmb-muted uppercase tracking-wider mb-4">Daily Breakdown</h3>
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
        </>)}

        {section === 'logistics' && (
          <>
            {/* Logistics sub-tabs */}
            <div className="flex gap-1 mb-4 sm:mb-6 bg-tmb-kraft border border-tmb-line rounded-[13px] p-1 sm:inline-flex w-full sm:w-auto">
              {[
                { id: 'bookings', label: 'Bookings' },
                { id: 'packing', label: 'Packing' },
                { id: 'transport', label: 'Transport' },
                { id: 'documents', label: 'Docs & Safety' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setLogisticsView(tab.id)}
                  className={`flex-1 sm:flex-initial px-3 sm:px-5 py-2.5 sm:py-2 min-h-[44px] rounded-[9px] text-sm font-display uppercase tracking-[.08em] transition-all duration-300 ${
                    logisticsView === tab.id ? 'bg-tmb-cream text-tmb-pine shadow-sm border border-tmb-line' : 'text-tmb-muted hover:text-tmb-ink hover:bg-tmb-cream/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {logisticsView === 'bookings' ? (
              <BookingsPanel
                bookings={bookings}
                arrivalBooking={arrivalBooking}
                totals={bookingTotals}
                gaps={bookingGaps}
                getFileUrl={getFileUrl}
                loading={bookingsLoading}
              />
            ) : logisticsView === 'packing' ? (
              <PackingTab
                items={gearItems}
                loading={gearLoading}
                error={gearError}
                onTogglePacked={togglePacked}
                onUpdateItem={updateGearItem}
              />
            ) : logisticsView === 'transport' ? (
              <TransportTab
                legs={transportLegs}
                legsByDay={legsByDay}
                loading={transportLoading}
                error={transportError}
                tripId={trip?.id}
                onCreateLeg={createLeg}
                onUpdateLeg={updateLeg}
                onDeleteLeg={deleteLeg}
              />
            ) : (
              <DocumentsSafetyTab
                bookings={bookings}
                contacts={safetyContacts}
                getFileUrl={getFileUrl}
                contactsLoading={contactsLoading}
                contactsError={contactsError}
                tripId={trip?.id}
                onCreateContact={createContact}
                onUpdateContact={updateContact}
                onDeleteContact={deleteContact}
              />
            )}
          </>
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

      {/* Migration modal */}
      {showMigration && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative max-w-md w-full p-6 rounded-2xl border border-tmb-line2 shadow-2xl" style={{ backgroundColor: 'rgba(42, 39, 32, 0.96)', backdropFilter: 'blur(24px)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-tmb-pine flex items-center justify-center text-xl">⛰️</div>
              <div>
                <h3 className="text-lg font-semibold text-tmb-ink">Upgrade Your Trip</h3>
                <p className="text-tmb-muted text-xs">Go live & shareable</p>
              </div>
            </div>
            <p className="text-sm text-tmb-ink mb-4">
              Found your saved trip in this browser. Import it to get a <strong className="text-tmb-moss">live, shareable link</strong> that syncs between you and Nick in real time.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="flex-1 px-4 py-3 min-h-[44px] rounded-xl text-sm font-medium bg-tmb-pine text-white hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {migrating ? <><LoaderCircle className="w-4 h-4 animate-spin" /> Migrating...</> : 'Import & Go Live'}
              </button>
              <button
                onClick={() => setShowMigration(false)}
                className="px-4 py-3 min-h-[44px] rounded-xl text-sm font-medium bg-tmb-cream border border-tmb-line text-tmb-ink hover:bg-tmb-kraft transition-all"
              >
                Skip
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Loading state */}
      {tripLoading && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-tmb-cream/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <LoaderCircle className="w-8 h-8 animate-spin text-tmb-pine" />
            <p className="text-tmb-muted text-sm font-display uppercase tracking-wider">Loading your trip...</p>
          </div>
        </div>,
        document.body
      )}

      {/* Trip error */}
      {tripError && !trip && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-tmb-cream/90 backdrop-blur-sm">
          <div className="max-w-sm w-full p-6 rounded-2xl border border-tmb-rust/30 text-center bg-tmb-paper shadow-xl">
            <AlertTriangle className="w-10 h-10 text-tmb-rust mx-auto mb-3" />
            <h3 className="text-lg font-display uppercase text-tmb-ink mb-2">Trip Not Found</h3>
            <p className="text-sm text-tmb-muted mb-4">This link may have expired or the trip doesn't exist.</p>
            <button onClick={() => navigate('/', { replace: true })} className="px-4 py-2.5 rounded-xl text-sm font-medium bg-tmb-pine text-white hover:bg-tmb-forest transition-all">
              Go Home
            </button>
          </div>
        </div>,
        document.body
      )}

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
