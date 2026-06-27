import { useState, useMemo } from 'react';
import { Check, ChevronDown, ChevronRight, ShoppingCart, Package, X } from 'lucide-react';

const STATUS_OPTIONS = ['Need to Buy', 'Bought', 'Packed', 'Not Bringing', 'Not Reviewed'];
const FILTER_OPTIONS = ['All', 'Need to Buy', 'Bought', 'Packed', 'Not Bringing'];

const STATUS_COLORS = {
  'Need to Buy': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Bought': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Packed': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Not Bringing': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'Not Reviewed': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

const PRIORITY_BADGE = {
  Essential: 'text-red-400',
  Recommended: 'text-amber-400',
  Optional: 'text-slate-400',
};

const TRAVELER_COLORS = [
  { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30', bar: 'from-blue-500 to-blue-400' },
  { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30', bar: 'from-rose-500 to-rose-400' },
  { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', bar: 'from-amber-500 to-amber-400' },
  { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30', bar: 'from-purple-500 to-purple-400' },
];

function getTravelerColor(name, sortedNames) {
  const idx = sortedNames.indexOf(name);
  return TRAVELER_COLORS[idx % TRAVELER_COLORS.length];
}

function GlassCard({ children, className = '' }) {
  return (
    <div className={`bg-tmb-paper border border-tmb-line rounded-[13px] shadow-lg font-body ${className}`}>
      {children}
    </div>
  );
}

export default function PackingTab({ items, loading, error, onTogglePacked, onUpdateItem }) {
  const [filter, setFilter] = useState('All');
  const [activeTraveler, setActiveTraveler] = useState('All');
  const [expandedItem, setExpandedItem] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [newTravelerInput, setNewTravelerInput] = useState('');
  const [showNewTraveler, setShowNewTraveler] = useState(null);

  const travelerNames = useMemo(() => {
    const names = [...new Set(items.map(i => i.traveler || 'Traveler 1'))];
    names.sort();
    return names;
  }, [items]);

  const travelerFiltered = useMemo(() => {
    if (activeTraveler === 'All') return items;
    return items.filter(it => (it.traveler || 'Traveler 1') === activeTraveler);
  }, [items, activeTraveler]);

  const filtered = useMemo(() => {
    if (filter === 'All') return travelerFiltered;
    return travelerFiltered.filter(it => it.status === filter);
  }, [travelerFiltered, filter]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of filtered) {
      const cat = item.category || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(item);
    }
    return map;
  }, [filtered]);

  const packedCount = travelerFiltered.filter(it => it.packed).length;
  const totalCount = travelerFiltered.length;
  const pct = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  const travelerStats = useMemo(() => {
    const stats = {};
    for (const name of travelerNames) {
      const tItems = items.filter(it => (it.traveler || 'Traveler 1') === name);
      const packed = tItems.filter(it => it.packed).length;
      stats[name] = { packed, total: tItems.length, pct: tItems.length > 0 ? Math.round((packed / tItems.length) * 100) : 0 };
    }
    return stats;
  }, [items, travelerNames]);

  const toggleCategory = (cat) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleTravelerChange = (itemId, value) => {
    if (value === '__new__') {
      setShowNewTraveler(itemId);
      setNewTravelerInput('');
    } else {
      onUpdateItem(itemId, { traveler: value });
    }
  };

  const submitNewTraveler = (itemId) => {
    const name = newTravelerInput.trim();
    if (name) {
      onUpdateItem(itemId, { traveler: name });
    }
    setShowNewTraveler(null);
    setNewTravelerInput('');
  };

  if (loading) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading packing list...</p>
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

  if (items.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="text-4xl mb-4">📦</div>
        <p className="text-slate-400 text-sm">No gear items yet. Create a trip to get started.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Traveler tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveTraveler('All')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            activeTraveler === 'All'
              ? 'bg-white/20 text-white border border-white/30'
              : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          All
        </button>
        {travelerNames.map(name => {
          const color = getTravelerColor(name, travelerNames);
          return (
            <button
              key={name}
              onClick={() => setActiveTraveler(name)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                activeTraveler === name
                  ? `${color.bg} ${color.text} ${color.border}`
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
              }`}
            >
              {name}
              <span className="ml-1 opacity-60">
                ({travelerStats[name]?.total || 0})
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">
            {packedCount}/{totalCount} packed
          </span>
          <span className="text-sm text-emerald-400 font-semibold">{pct}%</span>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Per-traveler breakdown (shown when "All" is active and there are multiple travelers) */}
        {activeTraveler === 'All' && travelerNames.length > 1 && (
          <div className="mt-3 space-y-1.5">
            {travelerNames.map(name => {
              const stat = travelerStats[name];
              const color = getTravelerColor(name, travelerNames);
              return (
                <div key={name} className="flex items-center gap-2">
                  <span className={`text-[10px] w-20 truncate ${color.text}`}>{name}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${color.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${stat.pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 w-10 text-right">
                    {stat.packed}/{stat.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {f}
            {f !== 'All' && (
              <span className="ml-1 opacity-60">
                ({travelerFiltered.filter(it => it.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Category groups */}
      {[...grouped.entries()].map(([category, categoryItems]) => {
        const catPacked = categoryItems.filter(it => it.packed).length;
        const collapsed = collapsedCategories.has(category);

        return (
          <GlassCard key={category} className="overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                {collapsed ? (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm font-semibold text-white">{category}</span>
              </div>
              <span className="text-xs text-slate-400">
                {catPacked}/{categoryItems.length} packed
              </span>
            </button>

            {/* Items */}
            {!collapsed && (
              <div className="border-t border-white/5">
                {categoryItems.map(item => {
                  const traveler = item.traveler || 'Traveler 1';
                  const color = getTravelerColor(traveler, travelerNames);

                  return (
                    <div key={item.id} className="border-b border-white/5 last:border-b-0">
                      {/* Item row */}
                      <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5">
                        {/* Packed checkbox */}
                        <button
                          onClick={() => onTogglePacked(item.id, item.packed)}
                          className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                            item.packed
                              ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                              : 'border-white/20 hover:border-white/40'
                          }`}
                          style={{ minWidth: 28, minHeight: 28 }}
                        >
                          {item.packed && <Check className="w-4 h-4" />}
                        </button>

                        {/* Name + tap to expand */}
                        <button
                          onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                          className="flex-1 text-left min-w-0 flex items-center gap-1.5"
                        >
                          <span className={`text-sm ${item.packed ? 'line-through text-slate-500' : item.status === 'Not Bringing' ? 'text-slate-500' : 'text-white'}`}>
                            {item.name}
                          </span>
                          {/* Traveler badge (only in "All" view with multiple travelers) */}
                          {activeTraveler === 'All' && travelerNames.length > 1 && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border flex-shrink-0 ${color.bg} ${color.text} ${color.border}`}>
                              {traveler}
                            </span>
                          )}
                        </button>

                        {/* Status pill */}
                        {item.status && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_COLORS[item.status] || STATUS_COLORS['Not Reviewed']}`}>
                            {item.status}
                          </span>
                        )}

                        {/* Qty badge */}
                        {item.qty > 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                            ×{item.qty}
                          </span>
                        )}
                      </div>

                      {/* Expanded details */}
                      {expandedItem === item.id && (
                        <div className="px-4 sm:px-5 pb-3 pt-1 bg-white/[0.02] space-y-2">
                          {item.priority && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">Priority:</span>
                              <span className={PRIORITY_BADGE[item.priority] || 'text-slate-400'}>{item.priority}</span>
                            </div>
                          )}
                          {item.cost != null && (
                            <div className="flex items-center gap-2 text-xs">
                              <ShoppingCart className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-300">€{Number(item.cost).toFixed(2)}</span>
                            </div>
                          )}
                          {item.where_to_buy && item.where_to_buy !== 'TBD' && (
                            <div className="flex items-center gap-2 text-xs">
                              <Package className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-300">{item.where_to_buy}</span>
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-xs text-slate-400 italic">{item.notes}</p>
                          )}

                          {/* Status dropdown */}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-slate-500">Status:</span>
                            <select
                              value={item.status || 'Not Reviewed'}
                              onChange={(e) => onUpdateItem(item.id, { status: e.target.value })}
                              className="text-xs bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white appearance-none cursor-pointer"
                            >
                              {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s} className="bg-slate-800">{s}</option>
                              ))}
                            </select>
                          </div>

                          {/* Traveler selector */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Traveler:</span>
                            {showNewTraveler === item.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={newTravelerInput}
                                  onChange={(e) => setNewTravelerInput(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') submitNewTraveler(item.id); }}
                                  placeholder="Name..."
                                  autoFocus
                                  className="text-xs bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white w-28"
                                />
                                <button
                                  onClick={() => submitNewTraveler(item.id)}
                                  className="text-xs text-emerald-400 hover:text-emerald-300 px-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setShowNewTraveler(null)}
                                  className="text-xs text-slate-400 hover:text-slate-300 px-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <select
                                value={traveler}
                                onChange={(e) => handleTravelerChange(item.id, e.target.value)}
                                className="text-xs bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white appearance-none cursor-pointer"
                              >
                                {travelerNames.map(n => (
                                  <option key={n} value={n} className="bg-slate-800">{n}</option>
                                ))}
                                <option value="__new__" className="bg-slate-800">+ New traveler...</option>
                              </select>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}
