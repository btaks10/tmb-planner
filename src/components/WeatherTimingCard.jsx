// Departure-time card — the day view's answer to "when do I leave?".
//
// Static plan (timing.js) is the baseline and always renders, even fully
// offline. A live forecast (useWeather) only adjusts it: shifts the storm
// window, raises heat/wind warnings, or relaxes a quiet day. Compact mode
// is the one-line strip on the day card; full mode is the Timing tab.

import { useState, useMemo } from 'react';
import { AlertTriangle, Clock, CloudLightning, Flame, Wind, RefreshCw, Moon } from 'lucide-react';
import { WAYPOINTS } from '../waypoints';
import { segmentData } from '../segmentData';
import { computeDayPlan, fmtClock, TIMING_DEFAULTS } from '../lib/timing';
import { dayDateStr, summarizeDay, adjustForForecast, forecastIsStale } from '../lib/weather';

const BAND_LABELS = {
  quiet: { text: 'Stable air — clock relaxed 1 h', cls: 'bg-tmb-moss/15 text-tmb-moss border-tmb-moss/30' },
  normal: { text: 'Normal convection clock', cls: 'bg-tmb-cream text-tmb-muted border-tmb-line2' },
  active: { text: 'Unstable — clock shifted 1 h earlier', cls: 'bg-tmb-amber/15 text-tmb-amber border-tmb-amber/30' },
  extreme: { text: 'High instability — cols close at noon', cls: 'bg-tmb-rust/15 text-tmb-rust border-tmb-rust/30' },
};

function daysOutFrom(scenario, dayIndex, now) {
  const dateStr = dayDateStr(scenario, dayIndex);
  if (!dateStr) return 0;
  const day = Date.parse(`${dateStr}T00:00:00Z`);
  return Math.round((day - now) / 86400000);
}

/** Parse "HH:MM" to minutes from midnight, or null. */
function parseClock(str) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(str ?? '');
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Horizontal convection-clock bar: go / watch / storm bands, 05:00–21:00. */
function StormClockBar({ stormWindowStart, departure, arrival, clearBy }) {
  const START = 5 * 60;
  const END = 21 * 60;
  const SPAN = END - START;
  const pct = (min) => `${Math.max(0, Math.min(100, ((min - START) / SPAN) * 100))}%`;
  const watchStart = stormWindowStart - 120;

  return (
    <div className="mt-3">
      <div className="relative h-3 rounded-full overflow-hidden flex border border-tmb-line2">
        <div className="h-full bg-tmb-moss/50" style={{ width: pct(watchStart) }} />
        <div className="h-full bg-tmb-gold/60" style={{ width: `${((Math.min(stormWindowStart, END) - Math.max(watchStart, START)) / SPAN) * 100}%` }} />
        <div className="h-full bg-tmb-rust/55 flex-1" />
        {departure != null && (
          <div className="absolute top-0 h-full w-[2px] bg-tmb-ink" style={{ left: pct(departure) }} title={`Depart ${fmtClock(departure)}`} />
        )}
        {arrival != null && (
          <div className="absolute top-0 h-full w-[2px] bg-tmb-pine" style={{ left: pct(arrival) }} title={`Arrive ${fmtClock(arrival)}`} />
        )}
        {clearBy != null && (
          <div className="absolute top-0 h-full w-[2px] bg-white/90" style={{ left: pct(clearBy) }} title={`Clear by ${fmtClock(clearBy)}`} />
        )}
      </div>
      <div className="flex justify-between mt-1 font-display uppercase tracking-[.08em] text-[9px] text-tmb-muted">
        <span>05:00</span>
        <span>Go until {fmtClock(watchStart)}</span>
        <span>Storms {fmtClock(stormWindowStart)}+</span>
        <span>21:00</span>
      </div>
    </div>
  );
}

export default function WeatherTimingCard({
  dayIndex,
  scenario,
  selectedShortcuts,
  weather = null,
  compact = false,
  onOpen,
  now: nowProp = null,
}) {
  const [lateInput, setLateInput] = useState('');
  const [mountNow] = useState(() => Date.now()); // stable "now" unless the caller pins one
  const now = nowProp ?? mountNow;

  // ── Forecast adjustment (null-safe: static plan stands alone) ──
  const adjustment = useMemo(() => {
    const pointRec = weather?.forecasts?.[`day-${dayIndex}`];
    const valleyRec = weather?.forecasts?.valley;
    if (!pointRec) return null;
    const dateStr = dayDateStr(scenario, dayIndex);
    const pointSummary = summarizeDay(pointRec.data, dateStr);
    if (!pointSummary) return null;
    const valleySummary = valleyRec ? summarizeDay(valleyRec.data, dateStr) : null;
    return adjustForForecast({
      pointSummary,
      valleySummary,
      daysOut: daysOutFrom(scenario, dayIndex, now),
    });
  }, [weather, dayIndex, scenario, now]);

  const plan = useMemo(() => {
    const opts = { selectedShortcuts };
    if (adjustment?.stormWindowStart != null) opts.stormWindowStart = adjustment.stormWindowStart;
    return computeDayPlan(dayIndex, scenario, WAYPOINTS, segmentData, opts);
  }, [dayIndex, scenario, selectedShortcuts, adjustment]);

  if (!plan) return null;

  const stormWindow = adjustment?.stormWindowStart ?? TIMING_DEFAULTS.stormWindowStart;
  const critical = plan.critical;
  const criticalIsStorm = critical.kind === 'storm';

  // ── Compact strip on the day card ──
  if (compact) {
    return (
      <button
        onClick={onOpen}
        className="w-full flex items-center gap-2 px-3 sm:px-4 py-1.5 border-t border-tmb-line2 bg-tmb-cream/40 hover:bg-tmb-cream/70 transition-colors text-left"
      >
        <Clock className="w-3.5 h-3.5 text-tmb-pine shrink-0" />
        {plan.feasible ? (
          <span className="text-[11.5px] text-tmb-ink truncate">
            <span className="font-semibold">Leave {fmtClock(plan.recommendedDeparture)}</span>
            <span className="text-tmb-muted"> → arrive {fmtClock(plan.arrival)} · latest {fmtClock(plan.latestDeparture)}</span>
          </span>
        ) : (
          <span className="text-[11.5px] text-tmb-rust font-semibold truncate">
            Not walkable on the storm clock — use a lift or shortcut
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5 shrink-0">
          {plan.sleepIn && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-tmb-moss/15 text-tmb-moss border border-tmb-moss/30 font-display uppercase flex items-center gap-1">
              <Moon className="w-2.5 h-2.5" />Sleep in
            </span>
          )}
          {adjustment?.warnings?.some((w) => w.kind === 'heat') && <Flame className="w-3.5 h-3.5 text-tmb-amber" />}
          {adjustment?.warnings?.some((w) => w.kind === 'wind') && <Wind className="w-3.5 h-3.5 text-tmb-rust" />}
          {(adjustment?.band === 'active' || adjustment?.band === 'extreme') && (
            <CloudLightning className="w-3.5 h-3.5 text-tmb-rust" />
          )}
        </span>
      </button>
    );
  }

  // ── Full timing panel (Timing tab) ──
  const lateMin = parseClock(lateInput);
  const missed = lateMin != null
    ? plan.constraints.filter((c) => lateMin > c.latestDeparture)
    : [];

  return (
    <div className="space-y-3">
      {/* Headline: the three moments */}
      <div className="flex gap-0 flex-wrap">
        {plan.feasible ? (
          [
            { label: 'Leave', value: fmtClock(plan.recommendedDeparture), cls: 'text-tmb-pine' },
            { label: 'Latest', value: fmtClock(plan.latestDeparture), cls: 'text-tmb-rust' },
            { label: 'Arrive', value: fmtClock(plan.arrival), cls: 'text-tmb-ink' },
            { label: 'Walking', value: `${Math.floor(plan.walkMin / 60)}h${String(plan.walkMin % 60).padStart(2, '0')}`, cls: 'text-tmb-muted' },
          ].map((s, i) => (
            <div key={s.label} className={`px-3 sm:px-4 ${i > 0 ? 'border-l border-tmb-line2' : 'pl-0'}`}>
              <div className="font-display uppercase tracking-[.1em] text-[9px] text-tmb-muted">{s.label}</div>
              <div className={`font-display font-semibold text-lg ${s.cls}`}>{s.value}</div>
            </div>
          ))
        ) : (
          <div className="flex items-start gap-2 text-tmb-rust">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">This day doesn't fit the storm clock on foot</span>
              <span className="text-tmb-muted"> — you'd need to leave before {fmtClock(plan.latestDeparture)}. Check the Shortcuts tab: a lift makes it work.</span>
            </div>
          </div>
        )}
        {plan.sleepIn && (
          <span className="self-center ml-auto text-[10px] px-2 py-1 rounded-full bg-tmb-moss/15 text-tmb-moss border border-tmb-moss/30 font-display uppercase flex items-center gap-1">
            <Moon className="w-3 h-3" />Sleep in — short day
          </span>
        )}
      </div>

      {/* Why: the constraint that binds */}
      <div className="text-[12.5px] text-tmb-muted">
        {criticalIsStorm ? (
          <>
            <span className="font-semibold text-tmb-ink">Clear {critical.label} by {fmtClock(critical.clearBy)}</span>
            {' '}— last safe entry {fmtClock(critical.enterBy)}.
            {critical.shelter && <> Shelter: <span className="font-semibold text-tmb-pine">{critical.shelter}</span>.</>}
            {critical.note && <> {critical.note}.</>}
          </>
        ) : critical.kind === 'heat' ? (
          <>
            <span className="font-semibold text-tmb-ink">Start the {critical.label} climb by {fmtClock(critical.startBy)}</span>
            {' '}— south-facing, no shade once the sun is on it.
          </>
        ) : (
          <>Bound by dinner: <span className="font-semibold text-tmb-ink">{critical.label.toLowerCase()}</span> ({fmtClock(critical.clearBy)}).</>
        )}
      </div>

      {/* Convection clock */}
      <StormClockBar
        stormWindowStart={stormWindow}
        departure={plan.recommendedDeparture}
        arrival={plan.arrival}
        clearBy={criticalIsStorm ? critical.clearBy : null}
      />

      {/* Forecast strip */}
      {adjustment ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-display uppercase tracking-[.05em] ${BAND_LABELS[adjustment.band]?.cls ?? BAND_LABELS.normal.cls}`}>
            {BAND_LABELS[adjustment.band]?.text ?? 'Forecast'}
          </span>
          {adjustment.confidence === 'low' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-tmb-line2 bg-tmb-cream text-tmb-muted font-display uppercase">
              Trend only — recheck within 5 days
            </span>
          )}
          {adjustment.warnings.map((w) => (
            <span
              key={w.kind}
              className="text-[10px] px-2 py-0.5 rounded-full border border-tmb-rust/30 bg-tmb-rust/10 text-tmb-rust font-display uppercase flex items-center gap-1"
            >
              {w.kind === 'wind'
                ? <><Wind className="w-3 h-3" />Gusts {Math.round(w.maxGustKmh)} km/h on the col</>
                : <><Flame className="w-3 h-3" />Valley {Math.round(w.valleyMaxC)}°C — carry extra water</>}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-tmb-muted">
          No forecast loaded — static Alpine convection clock (storms from {fmtClock(TIMING_DEFAULTS.stormWindowStart)}).
        </div>
      )}

      {/* Running-late mode */}
      <div className="border-t border-tmb-line2 pt-2.5">
        <div className="flex items-center gap-2">
          <label className="font-display uppercase tracking-[.1em] text-[9px] text-tmb-muted" htmlFor={`late-${dayIndex}`}>
            Running late? Actual departure
          </label>
          <input
            id={`late-${dayIndex}`}
            type="time"
            value={lateInput}
            onChange={(e) => setLateInput(e.target.value)}
            className="text-xs border border-tmb-line2 rounded-md px-1.5 py-0.5 bg-tmb-paper text-tmb-ink"
          />
        </div>
        {lateMin != null && (
          missed.length ? (
            <div className="mt-2 space-y-1.5">
              {missed.map((c) => (
                <div key={`${c.kind}-${c.segmentKey}`} className="flex items-start gap-1.5 text-[11.5px] text-tmb-rust">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    {c.kind === 'storm' ? (
                      <>Too late for <span className="font-semibold">{c.label}</span> — don't enter after {fmtClock(c.enterBy)}.
                        {c.shelter && <> Wait at <span className="font-semibold">{c.shelter.replace(' (ahead)', '')}</span> or turn back.</>}</>
                    ) : c.kind === 'heat' ? (
                      <>The <span className="font-semibold">{c.label}</span> climb will be in full sun — double the water, halve the pace.</>
                    ) : (
                      <>You'll miss dinner at {fmtClock(c.clearBy)} — call ahead. Arrival ≈ {fmtClock(lateMin + plan.totalMin)}.</>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-[11.5px] text-tmb-moss">
              Still inside every window — new arrival ≈ {fmtClock(lateMin + plan.totalMin)}.
            </div>
          )
        )}
      </div>

      {/* Forecast age + attribution */}
      {weather && (
        <div className="flex items-center gap-2 text-[10px] text-tmb-muted border-t border-tmb-line2 pt-2">
          {weather.fetchedAt ? (
            <span className={forecastIsStale(weather.fetchedAt, now) ? 'text-tmb-amber font-semibold' : ''}>
              Forecast {forecastIsStale(weather.fetchedAt, now) ? 'stale — ' : ''}updated{' '}
              {new Date(weather.fetchedAt).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
            </span>
          ) : (
            <span>No forecast cached yet</span>
          )}
          <button
            onClick={() => weather.refresh?.(true)}
            disabled={weather.loading}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-tmb-line2 hover:bg-tmb-cream/70 transition-colors disabled:opacity-50"
            title="Download all forecasts (do this on refuge wifi)"
          >
            <RefreshCw className={`w-3 h-3 ${weather.loading ? 'animate-spin' : ''}`} />
            Download all
          </button>
          <span className="ml-auto">{weather.attribution}</span>
        </div>
      )}
    </div>
  );
}
