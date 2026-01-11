import { useState, useMemo } from 'react';

const WAYPOINTS = [
  { id: 0, name: "Les Houches", altitude: 1007, cumDist: 0, cumTime: 0, ascent: 0, descent: 0, stage: 1 },
  { id: 1, name: "Col de Voza", altitude: 1657, cumDist: 6.0, cumTime: 150, ascent: 660, descent: 20, stage: 1 },
  { id: 2, name: "Hôtel du Prarion", altitude: 1860, cumDist: 6.8, cumTime: 165, ascent: 660, descent: 20, stage: 1 },
  { id: 3, name: "Les Contamines", altitude: 1161, cumDist: 17.5, cumTime: 355, ascent: 1000, descent: 530, stage: 2 },
  { id: 4, name: "Notre-Dame de la Gorge", altitude: 1210, cumDist: 18.5, cumTime: 395, ascent: 1060, descent: 540, stage: 2 },
  { id: 5, name: "Nant Borrant", altitude: 1459, cumDist: 22.3, cumTime: 440, ascent: 1310, descent: 540, stage: 2 },
  { id: 6, name: "Refuge de la Balme", altitude: 1706, cumDist: 27.3, cumTime: 525, ascent: 1560, descent: 610, stage: 2 },
  { id: 7, name: "Refuge de la Croix du Bonhomme", altitude: 2433, cumDist: 32.3, cumTime: 615, ascent: 2350, descent: 680, stage: 3 },
  { id: 8, name: "Les Chapieux", altitude: 1554, cumDist: 37.3, cumTime: 705, ascent: 2660, descent: 1560, stage: 3 },
  { id: 9, name: "Refuge des Mottets", altitude: 1868, cumDist: 42.3, cumTime: 795, ascent: 2970, descent: 1570, stage: 4 },
  { id: 10, name: "Rifugio Elisabetta", altitude: 2195, cumDist: 46.0, cumTime: 885, ascent: 3340, descent: 1790, stage: 4 },
  { id: 11, name: "Lac Combal", altitude: 1968, cumDist: 49.6, cumTime: 935, ascent: 3340, descent: 2010, stage: 4 },
  { id: 12, name: "Courmayeur", altitude: 1226, cumDist: 56.0, cumTime: 1050, ascent: 3380, descent: 2760, stage: 4 },
  { id: 13, name: "Rifugio Bertone", altitude: 1989, cumDist: 60.3, cumTime: 1170, ascent: 4140, descent: 2780, stage: 5 },
  { id: 14, name: "Rifugio Bonatti", altitude: 2025, cumDist: 68.0, cumTime: 1320, ascent: 4470, descent: 3070, stage: 5 },
  { id: 15, name: "Rifugio Elena", altitude: 2062, cumDist: 75.9, cumTime: 1470, ascent: 4960, descent: 3460, stage: 6 },
  { id: 16, name: "La Peule", altitude: 1705, cumDist: 79.8, cumTime: 1530, ascent: 4980, descent: 3840, stage: 6 },
  { id: 17, name: "Ferret", altitude: 1700, cumDist: 82.6, cumTime: 1570, ascent: 5000, descent: 3860, stage: 6 },
  { id: 18, name: "La Fouly", altitude: 1610, cumDist: 89.6, cumTime: 1680, ascent: 5020, descent: 4390, stage: 7 },
  { id: 19, name: "Praz-de-Fort", altitude: 1151, cumDist: 97.9, cumTime: 1815, ascent: 5090, descent: 4920, stage: 7 },
  { id: 20, name: "Issert", altitude: 1055, cumDist: 100.4, cumTime: 1845, ascent: 5090, descent: 5020, stage: 7 },
  { id: 21, name: "Champex-Lac", altitude: 1467, cumDist: 105.6, cumTime: 1935, ascent: 5540, descent: 5060, stage: 7 },
  { id: 22, name: "Plan de l'Au", altitude: 1330, cumDist: 110.3, cumTime: 2015, ascent: 5570, descent: 5200, stage: 8 },
  { id: 23, name: "Bovine", altitude: 1987, cumDist: 114.5, cumTime: 2135, ascent: 5870, descent: 5340, stage: 8 },
  { id: 24, name: "Col de la Forclaz", altitude: 1526, cumDist: 119.0, cumTime: 2235, ascent: 5920, descent: 5950, stage: 8 },
  { id: 25, name: "Trient", altitude: 1279, cumDist: 121.1, cumTime: 2275, ascent: 5920, descent: 6200, stage: 8 },
  { id: 26, name: "Col de Balme", altitude: 2191, cumDist: 127.1, cumTime: 2415, ascent: 6730, descent: 6200, stage: 9 },
  { id: 27, name: "Le Tour", altitude: 1460, cumDist: 133.1, cumTime: 2515, ascent: 6730, descent: 6950, stage: 9 },
  { id: 28, name: "Tré-le-Champ", altitude: 1417, cumDist: 141.1, cumTime: 2645, ascent: 6970, descent: 7960, stage: 9 },
  { id: 29, name: "La Flégère", altitude: 1875, cumDist: 148.9, cumTime: 2855, ascent: 7770, descent: 8300, stage: 10 },
  { id: 30, name: "Planpraz", altitude: 2000, cumDist: 151.7, cumTime: 2930, ascent: 8110, descent: 8340, stage: 10 },
  { id: 31, name: "Brévent", altitude: 2525, cumDist: 154.5, cumTime: 3020, ascent: 8600, descent: 8380, stage: 11 },
  { id: 32, name: "Bellachat", altitude: 2152, cumDist: 157.1, cumTime: 3065, ascent: 8620, descent: 8770, stage: 11 },
  { id: 33, name: "Les Houches (End)", altitude: 1007, cumDist: 164.6, cumTime: 3205, ascent: 8660, descent: 9960, stage: 11 },
];

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

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl ${hover ? 'hover:bg-white/10 hover:border-white/20 transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

export default function App() {
  const [scenarios, setScenarios] = useState([
    { id: 1, name: "7-Day Classic", startDate: "2026-08-01", days: [6, 8, 12, 15, 21, 28, 33] }
  ]);
  const [activeScenarioId, setActiveScenarioId] = useState(1);
  const [view, setView] = useState('plan');

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

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
  const totals = dayData.reduce((acc, d) => ({
    distance: acc.distance + parseFloat(d.distance),
    time: acc.time + d.time,
    ascent: acc.ascent + d.ascent,
    descent: acc.descent + d.descent
  }), { distance: 0, time: 0, ascent: 0, descent: 0 });

  const updateDay = (dayIndex, newEndIdx) => {
    setScenarios(scenarios.map(s => {
      if (s.id !== activeScenarioId) return s;
      const newDays = [...s.days];
      newDays[dayIndex] = newEndIdx;
      const validDays = newDays.filter((d, i) => i === 0 || d > newDays[i-1]);
      return { ...s, days: validDays };
    }));
  };

  const addDay = () => {
    setScenarios(scenarios.map(s => {
      if (s.id !== activeScenarioId) return s;
      const lastEnd = s.days[s.days.length - 1] || 0;
      if (lastEnd < WAYPOINTS.length - 1) {
        return { ...s, days: [...s.days, Math.min(lastEnd + 3, WAYPOINTS.length - 1)] };
      }
      return s;
    }));
  };

  const removeDay = (dayIndex) => {
    setScenarios(scenarios.map(s => {
      if (s.id !== activeScenarioId) return s;
      if (s.days.length > 1) return { ...s, days: s.days.filter((_, i) => i !== dayIndex) };
      return s;
    }));
  };

  const createScenario = () => {
    const newId = Math.max(...scenarios.map(s => s.id)) + 1;
    setScenarios([...scenarios, { id: newId, name: `Scenario ${newId}`, startDate: "2026-08-01", days: [6, 8, 12, 15, 21, 28, 33] }]);
    setActiveScenarioId(newId);
  };

  const renameScenario = (id, newName) => setScenarios(scenarios.map(s => s.id === id ? { ...s, name: newName } : s));

  const maxAlt = Math.max(...WAYPOINTS.map(w => w.altitude));
  const minAlt = Math.min(...WAYPOINTS.map(w => w.altitude));
  const maxDist = WAYPOINTS[WAYPOINTS.length - 1].cumDist;

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
                      onChange={(e) => setScenarios(scenarios.map(s => 
                        s.id === activeScenarioId ? { ...s, startDate: e.target.value } : s
                      ))}
                      className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  {[
                    { value: dayData.length, label: 'Days' },
                    { value: `${totals.distance.toFixed(0)}km`, label: 'Distance' },
                    { value: formatTime(totals.time), label: 'Hiking' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            <div className="space-y-3 mb-6">
              {dayData.map((day, idx) => {
                const prevEnd = idx === 0 ? 0 : activeScenario.days[idx - 1];
                const availableWaypoints = WAYPOINTS.filter((w, i) => i > prevEnd);
                const color = DAY_COLORS[idx % DAY_COLORS.length];
                
                return (
                  <GlassCard key={idx} className="p-4 group" hover>
                    <div className="flex items-center gap-4">
                      <div 
                        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 bg-gradient-to-br ${color.gradient} shadow-lg`}
                        style={{ boxShadow: `0 8px 24px -8px ${color.main}50` }}
                      >
                        <span className="text-[10px] uppercase tracking-wider opacity-80">Day</span>
                        <span className="text-xl font-bold -mt-0.5">{day.day}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-500 mb-1">{formatDate(day.date)}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-200">{day.startWp.name}</span>
                          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <select
                            value={activeScenario.days[idx]}
                            onChange={(e) => updateDay(idx, parseInt(e.target.value))}
                            className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-sm flex-1 min-w-48 focus:border-emerald-500 outline-none cursor-pointer hover:bg-white/10 transition-colors"
                          >
                            {availableWaypoints.map(wp => {
                              const delta = wp.cumTime - WAYPOINTS[prevEnd].cumTime;
                              const dist = (wp.cumDist - WAYPOINTS[prevEnd].cumDist).toFixed(1);
                              return (
                                <option key={wp.id} value={wp.id}>
                                  {wp.name} — {dist}km, {formatTime(delta)}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-slate-200">{day.distance}</div>
                          <div className="text-xs text-slate-500">km</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-emerald-400">↑{day.ascent}</div>
                          <div className="text-xs text-slate-500">m up</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-rose-400">↓{day.descent}</div>
                          <div className="text-xs text-slate-500">m down</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-slate-200">{formatTime(day.time)}</div>
                          <div className="text-xs text-slate-500">hike</div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => removeDay(idx)}
                        className="w-8 h-8 rounded-full text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            {activeScenario.days[activeScenario.days.length - 1] < WAYPOINTS.length - 1 && (
              <button 
                onClick={addDay} 
                className="w-full py-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-500 hover:text-emerald-400 transition-all duration-300 mb-6"
              >
                + Add another day
              </button>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: totals.distance.toFixed(1), unit: 'km', label: 'Total Distance', icon: '🥾', gradient: 'from-emerald-500 to-teal-500' },
                { value: formatTime(totals.time), unit: '', label: 'Hiking Time', icon: '⏱️', gradient: 'from-blue-500 to-indigo-500' },
                { value: totals.ascent.toLocaleString(), unit: 'm', label: 'Total Ascent', icon: '⬆️', gradient: 'from-amber-500 to-orange-500' },
                { value: totals.descent.toLocaleString(), unit: 'm', label: 'Total Descent', icon: '⬇️', gradient: 'from-rose-500 to-pink-500' },
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
          <GlassCard className="p-6">
            <h3 className="text-lg font-light mb-6 flex items-center gap-2">
              <span className="text-2xl">📈</span> Elevation Profile
            </h3>
            <svg viewBox="0 0 800 320" className="w-full">
              <defs>
                <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                </linearGradient>
              </defs>
              
              {[1000, 1500, 2000, 2500].map(alt => (
                <g key={alt}>
                  <line x1="60" y1={260 - ((alt - minAlt) / (maxAlt - minAlt)) * 200} x2="780" y2={260 - ((alt - minAlt) / (maxAlt - minAlt)) * 200} stroke="#334155" strokeWidth="1" strokeDasharray="4"/>
                  <text x="55" y={264 - ((alt - minAlt) / (maxAlt - minAlt)) * 200} fill="#64748b" fontSize="10" textAnchor="end">{alt}m</text>
                </g>
              ))}
              
              <path
                d={`M 60 260 L ${WAYPOINTS.map(p => `${60 + (p.cumDist / maxDist) * 720} ${260 - ((p.altitude - minAlt) / (maxAlt - minAlt)) * 200}`).join(' L ')} L 780 260 Z`}
                fill="url(#elevGrad)"
              />
              
              <path
                d={`M ${WAYPOINTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${60 + (p.cumDist / maxDist) * 720} ${260 - ((p.altitude - minAlt) / (maxAlt - minAlt)) * 200}`).join(' ')}`}
                fill="none" stroke="#10b981" strokeWidth="2.5"
              />
              
              {dayData.map((d, i) => {
                const x = 60 + (d.endWp.cumDist / maxDist) * 720;
                const y = 260 - ((d.endWp.altitude - minAlt) / (maxAlt - minAlt)) * 200;
                return (
                  <g key={i}>
                    <line x1={x} y1={40} x2={x} y2={260} stroke={DAY_COLORS[i % DAY_COLORS.length].main} strokeWidth="1.5" strokeDasharray="6" opacity="0.5"/>
                    <circle cx={x} cy={y} r="8" fill={DAY_COLORS[i % DAY_COLORS.length].main} stroke="#0f172a" strokeWidth="2"/>
                    <text x={x} y={y + 4} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">{i+1}</text>
                    <text x={x} y={30} fill={DAY_COLORS[i % DAY_COLORS.length].main} fontSize="10" textAnchor="middle" fontWeight="500">D{i+1}</text>
                  </g>
                );
              })}
              
              {[0, 40, 80, 120, 160].map(km => (
                <text key={km} x={60 + (km / maxDist) * 720} y={285} fill="#64748b" fontSize="10" textAnchor="middle">{km}km</text>
              ))}
            </svg>
            
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              {dayData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-white/5 px-3 py-1.5 rounded-full">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length].main }} />
                  <span className="text-slate-400">Day {d.day}:</span>
                  <span className="text-slate-200">{d.endWp.name}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {view === 'map' && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-light mb-6 flex items-center gap-2">
              <span className="text-2xl">🗺️</span> Route Map
            </h3>
            <svg viewBox="0 0 400 400" className="w-full max-w-md mx-auto">
              <defs>
                <radialGradient id="mtGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1e293b"/>
                  <stop offset="100%" stopColor="#0f172a"/>
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              
              <circle cx="200" cy="200" r="135" fill="none" stroke="#1e293b" strokeWidth="16"/>
              
              {dayData.map((d, i) => {
                const prevEnd = i === 0 ? 0 : activeScenario.days[i - 1];
                const startAngle = (WAYPOINTS[prevEnd].cumDist / maxDist) * 360 - 90;
                const endAngle = (d.endWp.cumDist / maxDist) * 360 - 90;
                const r = 135;
                const x1 = 200 + r * Math.cos(startAngle * Math.PI / 180);
                const y1 = 200 + r * Math.sin(startAngle * Math.PI / 180);
                const x2 = 200 + r * Math.cos(endAngle * Math.PI / 180);
                const y2 = 200 + r * Math.sin(endAngle * Math.PI / 180);
                const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
                
                return (
                  <path
                    key={i}
                    d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
                    fill="none"
                    stroke={DAY_COLORS[i % DAY_COLORS.length].main}
                    strokeWidth="10"
                    strokeLinecap="round"
                    filter="url(#glow)"
                  />
                );
              })}
              
              <circle cx="200" cy="200" r="55" fill="url(#mtGrad)" stroke="#334155" strokeWidth="1"/>
              <text x="200" y="195" fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="500">MONT BLANC</text>
              <text x="200" y="210" fill="#64748b" fontSize="8" textAnchor="middle">4,808m</text>
              
              {dayData.map((d, i) => {
                const angle = (d.endWp.cumDist / maxDist) * 360 - 90;
                const r = 135;
                const x = 200 + r * Math.cos(angle * Math.PI / 180);
                const y = 200 + r * Math.sin(angle * Math.PI / 180);
                const labelR = 175;
                const lx = 200 + labelR * Math.cos(angle * Math.PI / 180);
                const ly = 200 + labelR * Math.sin(angle * Math.PI / 180);
                
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="14" fill={DAY_COLORS[i % DAY_COLORS.length].main} stroke="#0f172a" strokeWidth="3"/>
                    <text x={x} y={y + 4} fill="white" fontSize="11" textAnchor="middle" fontWeight="bold">{i + 1}</text>
                    <text x={lx} y={ly} fill="#94a3b8" fontSize="8" textAnchor="middle">
                      {d.endWp.name.length > 14 ? d.endWp.name.substring(0, 14) + '…' : d.endWp.name}
                    </text>
                  </g>
                );
              })}
              
              <g>
                <circle cx={200} cy={200 - 135} r="10" fill="#10b981" stroke="white" strokeWidth="2"/>
                <text x={200} y={200 - 135 + 4} fill="white" fontSize="8" textAnchor="middle">▶</text>
              </g>
              
              <text x="200" y="355" fill="#475569" fontSize="10" textAnchor="middle">🇫🇷 France</text>
              <text x="340" y="240" fill="#475569" fontSize="10" textAnchor="middle">🇨🇭</text>
              <text x="290" y="130" fill="#475569" fontSize="10" textAnchor="middle">🇮🇹</text>
            </svg>
            
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {dayData.map((d, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                  style={{ backgroundColor: `${DAY_COLORS[i % DAY_COLORS.length].main}15` }}
                >
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length].main }}
                  >
                    {d.day}
                  </div>
                  <span className="text-slate-300">{d.distance}km</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{formatTime(d.time)}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}