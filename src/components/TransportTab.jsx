import { useState, useEffect, useMemo, useRef } from 'react';
import { Bus, CableCar, Train, Plus, X, Save, ExternalLink } from 'lucide-react';
import transportSeed from '../data/transportSeed.json';

const TYPE_ICONS = {
  bus: Bus,
  shuttle: Bus,
  lift: CableCar,
  train: Train,
  taxi: Bus,
};

const TYPE_COLORS = {
  bus: 'text-blue-400',
  shuttle: 'text-blue-400',
  lift: 'text-purple-400',
  train: 'text-emerald-400',
  taxi: 'text-amber-400',
};

function GlassCard({ children, className = '' }) {
  return (
    <div className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

function LegCard({ leg, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const Icon = TYPE_ICONS[leg.type] || Bus;

  const startEdit = () => {
    setDraft({ name: leg.name, cost: leg.cost, depart_time: leg.depart_time || '', info: leg.info || '' });
    setEditing(true);
  };

  const saveEdit = () => {
    onUpdate(leg.id, {
      name: draft.name,
      cost: draft.cost != null && draft.cost !== '' ? Number(draft.cost) : null,
      depart_time: draft.depart_time || null,
      info: draft.info || null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="p-3 sm:p-4 space-y-2 bg-white/[0.03] rounded-xl border border-white/10">
        <input
          value={draft.name}
          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
          className="w-full text-sm bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-white"
          placeholder="Name"
        />
        <div className="flex gap-2">
          <input
            value={draft.cost ?? ''}
            onChange={e => setDraft(d => ({ ...d, cost: e.target.value }))}
            className="w-24 text-sm bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-white"
            placeholder="Cost"
            type="number"
            step="0.01"
          />
          <input
            value={draft.depart_time}
            onChange={e => setDraft(d => ({ ...d, depart_time: e.target.value }))}
            className="w-24 text-sm bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-white"
            placeholder="Time"
          />
        </div>
        <textarea
          value={draft.info}
          onChange={e => setDraft(d => ({ ...d, info: e.target.value }))}
          className="w-full text-xs bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-white resize-none"
          rows={2}
          placeholder="Notes / schedule info"
        />
        <div className="flex gap-2">
          <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/30">
            <Save className="w-3 h-3" /> Save
          </button>
          <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 text-slate-400 text-xs hover:bg-white/15">
            Cancel
          </button>
          <button onClick={() => onDelete(leg.id)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 ml-auto">
            <X className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={startEdit} className="w-full text-left p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${TYPE_COLORS[leg.type] || 'text-slate-400'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-white truncate">{leg.name}</span>
            {leg.cost != null && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 whitespace-nowrap font-mono">
                {leg.currency === 'CHF' ? 'CHF ' : '€'}{Number(leg.cost).toFixed(2)}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {leg.from_place} → {leg.to_place}
            {leg.depart_time && <span className="ml-2 text-slate-500">at {leg.depart_time}</span>}
          </div>
          {leg.info && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{leg.info}</p>
          )}
          {leg.url && (
            <a
              href={leg.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"
            >
              <ExternalLink className="w-3 h-3" /> Timetable
            </a>
          )}
        </div>
      </div>
    </button>
  );
}

// Day header labels matching WAYPOINTS structure
const DAY_ROUTES = [
  'Les Houches → Les Contamines',
  'Les Contamines → Les Chapieux',
  'Les Chapieux → Courmayeur',
  'Courmayeur → Rifugio Bonatti',
  'Rifugio Bonatti → Champex-Lac',
  'Champex-Lac → Trient',
  'Trient → Les Houches',
];

export default function TransportTab({ legs, legsByDay, loading, error, tripId, onCreateLeg, onUpdateLeg, onDeleteLeg }) {
  const [seeding, setSeeding] = useState(false);
  const seedingRef = useRef(false);

  // Seed transport legs on first load if empty
  useEffect(() => {
    if (legs.length === 0 && tripId && onCreateLeg && !seedingRef.current && !loading) {
      seedingRef.current = true;
      let cancelled = false;

      (async () => {
        setSeeding(true);
        for (const leg of transportSeed.legs) {
          if (cancelled) break;
          await onCreateLeg({ ...leg, trip_id: tripId });
        }
        if (!cancelled) setSeeding(false);
      })();

      return () => { cancelled = true; };
    }
  }, [legs.length, tripId, onCreateLeg, loading]);

  const allDays = useMemo(() => {
    const days = new Set();
    for (const leg of legs) {
      if (leg.day_index != null) days.add(leg.day_index);
    }
    // Always show all 7 days
    for (let i = 0; i < 7; i++) days.add(i);
    return [...days].sort((a, b) => a - b);
  }, [legs]);

  if (loading || seeding) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-slate-400 text-sm">{seeding ? 'Seeding transport data...' : 'Loading transport...'}</p>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-8 text-center">
        <p className="text-red-400 text-sm">Error: {error}</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {allDays.map(dayIndex => {
        const dayLegs = legsByDay.get(dayIndex) || [];
        return (
          <GlassCard key={dayIndex} className="overflow-hidden">
            {/* Day header */}
            <div className="px-4 py-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-white">Day {dayIndex + 1}</span>
                  {DAY_ROUTES[dayIndex] && (
                    <span className="text-xs text-slate-400 ml-2">{DAY_ROUTES[dayIndex]}</span>
                  )}
                </div>
                <button
                  onClick={() => onCreateLeg({
                    trip_id: tripId,
                    day_index: dayIndex,
                    name: 'New transport',
                    type: 'bus',
                    from_place: '',
                    to_place: '',
                  })}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            </div>

            {/* Legs */}
            <div className="p-3 space-y-2">
              {dayLegs.length > 0 ? (
                dayLegs.map(leg => (
                  <LegCard key={leg.id} leg={leg} onUpdate={onUpdateLeg} onDelete={onDeleteLeg} />
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-2">No transport needed — hiking only</p>
              )}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
