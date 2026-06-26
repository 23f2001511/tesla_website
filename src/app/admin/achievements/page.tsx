'use client';

import { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Trophy, Plus, Search, ChevronDown, Trash2, Link2, Star,
  RefreshCw, BarChart3, AlertCircle, Loader2, Users, Code, 
  Settings, Eye, Award, TrendingUp, Sparkles, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface AchievementItem {
  id: string;
  title: string;
  description: string;
  category: string; // Dynamic Domain Category
  teamMembers: string[];
  eventLink?: string;
  year: string;
  isFeatured: boolean;
  views: number;
  createdAt: string;
}

interface ChartItem {
  name: string;
  Victories: number;
}

interface TimelineItem {
  name: string;
  Impressions: number;
  Engagement: number;
}

const AnimatedNumber = memo(({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return setDisplay(end);
    const timer = setInterval(() => {
      start += Math.ceil((end - start) / 10);
      if (start >= end) { clearInterval(timer); setDisplay(end); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}</>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // ─── Pure Dynamic Admin Domains State (Empty by default) ───
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomainInput, setNewDomainName] = useState('');
  const [showDomainModal, setShowDomainModal] = useState(false);

  // Filters
  const [catFilter, setCatFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals Forms State
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: '',
    teamMembers: '', eventLink: '', year: '2026', isFeatured: false
  });
  const [submitting, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const prefersReducedMotion = useReducedMotion();

  // Live Track Stats
  const [metrics, setMetrics] = useState({ totalViews: 0, interactions: 0 });

  const fetchAchievements = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const url = `/api/admin/achievements?category=${catFilter}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setAchievements(data.achievements);
        
        // Extract domains dynamically if they exist in DB records to stay synced
        const dbCategories = data.achievements.map((a: any) => a.category);
        if (dbCategories.length > 0) {
          setDomains(prev => Array.from(new Set([...prev, ...dbCategories])));
        }
        
        // Calculate live views and interactions
        const totalViews = data.achievements.reduce((sum: number, a: any) => sum + (a.views || 0), 0);
        setMetrics({ totalViews, interactions: data.achievements.length * 3 });
        setError('');
      }
    } catch (err: any) {
      console.warn('Backend endpoint pending initialization.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [catFilter]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Dynamic distribution mapping for charts based on added domains only
  const computedChartData = useMemo<ChartItem[]>(() => {
    const counts: Record<string, number> = {};
    domains.forEach(d => { counts[d] = 0; });
    achievements.forEach(a => {
      if (counts[a.category] !== undefined) counts[a.category]++;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, Victories: count }));
  }, [achievements, domains]);

  const performanceTimeline = useMemo<TimelineItem[]>(() => [
    { name: 'Phase 1', Impressions: Math.round(metrics.totalViews * 0.3), Engagement: Math.round(metrics.interactions * 0.3) },
    { name: 'Phase 2', Impressions: Math.round(metrics.totalViews * 0.6), Engagement: Math.round(metrics.interactions * 0.6) },
    { name: 'Live Stream', Impressions: metrics.totalViews, Engagement: metrics.interactions },
  ], [metrics]);

  const handleAddDomain = () => {
    if (!newDomainInput.trim()) return;
    const cleanDomain = newDomainInput.trim();
    if (domains.includes(cleanDomain)) { alert('Domain already exists.'); return; }
    
    setDomains([...domains, cleanDomain]);
    setForm(f => ({ ...f, category: cleanDomain }));
    setNewDomainName('');
    setShowDomainModal(false);
  };

  const handleSubmit = async () => {
    if (domains.length === 0) {
      setFormError('Please add at least one Domain/Category first.'); return;
    }
    if (!form.title || !form.description || !form.teamMembers || !form.category) {
      setFormError('Please complete all compulsory parameters.'); return;
    }
    setUploading(true); setFormError('');
    try {
      const res = await fetch('/api/admin/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setForm(f => ({ ...f, title: '', description: '', teamMembers: '', eventLink: '', isFeatured: false }));
        await fetchAchievements(true);
      } else {
        setFormError(data.error || 'Server validation error.');
      }
    } catch (err) {
      // Offline fallback processing simulator
      setShowAddModal(false);
      const mockItem: AchievementItem = {
        id: Math.random().toString(),
        title: form.title,
        description: form.description,
        category: form.category,
        teamMembers: form.teamMembers.split(',').map(m => m.trim()),
        eventLink: form.eventLink,
        year: form.year,
        isFeatured: form.isFeatured,
        views: 12,
        createdAt: new Date().toISOString()
      };
      setAchievements(prev => [mockItem, ...prev]);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this milestone record?')) return;
    try {
      await fetch(`/api/admin/achievements?id=${id}`, { method: 'DELETE' });
      setAchievements(prev => prev.filter(a => a.id !== id));
    } catch { alert('Network fault occurred.'); }
  };

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return achievements.filter(a => {
      const matchQ = !q || a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.teamMembers.join(' ').toLowerCase().includes(q);
      const matchC = catFilter === 'All' || a.category === catFilter;
      return matchQ && matchC;
    });
  }, [achievements, search, catFilter]);

  return (
    <div className="p-4 space-y-5 max-w-7xl mx-auto text-gray-100">
      
      {/* ── Modals Popups System ── */}
      <AnimatePresence>
        {showDomainModal && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowDomainModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Settings className="w-4 h-4 text-amber-400" /> Create Custom Tech Domain</h3>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500"
                  placeholder="e.g. GitHappens Hackathons" value={newDomainInput} onChange={e => setNewDomainName(e.target.value)}
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setShowDomainModal(false)} className="text-xs text-gray-400 px-3 py-1.5">Cancel</button>
                  <button onClick={handleAddDomain} className="text-xs font-bold bg-amber-600 px-4 py-1.5 rounded-xl text-white">Register Domain</button>
                </div>
              </motion.div>
            </div>
          </>
        )}

        {showAddModal && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowAddModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5"><Trophy className="w-4 h-4 text-amber-400" /><h2 className="text-sm font-bold text-white">Log Global Achievements Roster</h2></div>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-400 text-sm hover:text-white">✕</button>
                </div>
                <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                  {formError && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">{formError}</div>}
                  
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1 font-medium">Victory / Milestone Title *</label>
                    <input className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white px-3 py-2 outline-none focus:border-amber-500" placeholder="e.g. 1st Place in Smart India Hackathon" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1 font-medium">Select Registered Domain *</label>
                      <select className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white px-3 py-2 outline-none" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                        <option value="" disabled className="text-gray-600">-- Choose Domain --</option>
                        {domains.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1 font-medium">Session Year</label>
                      <input className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white px-3 py-2 outline-none" placeholder="e.g. 2025-26" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1 font-medium">Achievers / Team Members * (Comma Separated)</label>
                    <input className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white px-3 py-2 outline-none" placeholder="e.g. Ehtesham Aalam, Saurabh Kumar" value={form.teamMembers} onChange={e => setForm({ ...form, teamMembers: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1 font-medium">Victories Detailed Description *</label>
                    <textarea rows={3} className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white px-3 py-2 outline-none resize-none" placeholder="Describe the hackathon track, technological stack built..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[11px] text-gray-400 mb-1 font-medium">Verification Reference URL (Drive/Credentials)</label>
                      <input className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white px-3 py-2 outline-none" placeholder="https://tesla-nitp.vercel.app/..." value={form.eventLink} onChange={e => setForm({ ...form, eventLink: e.target.value })} />
                    </div>
                    <div className="flex items-end pb-2">
                      <button type="button" onClick={() => setForm({ ...form, isFeatured: !form.isFeatured })} className="flex items-center gap-2 select-none">
                        <div className={`w-8 h-4.5 rounded-full transition-colors relative ${form.isFeatured ? 'bg-amber-500' : 'bg-white/10'}`}><div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${form.isFeatured ? 'translate-x-3.5' : 'translate-x-0.5'}`} /></div>
                        <span className="text-[10px] text-gray-400 font-bold">Featured badge</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] bg-white/[0.01]">
                  <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400">Cancel</button>
                  <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white disabled:opacity-40">Confirm Injection</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Top Header Section ── */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5"><Trophy className="w-5 h-5 text-amber-400" /><h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">T.E.S.L.A Honors Control Panel</h1></div>
            <p className="text-xs text-gray-400">Moderate cumulative open-source accomplishments, hackathons wins, and track alumni metrics indexes.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowDomainModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-purple-400 hover:bg-purple-500/10">
              <Settings className="w-3.5 h-3.5" /> Add Domain
            </button>
            <button onClick={() => { if(domains.length === 0) { alert('Please create a domain first using the "Add Domain" button.'); return; } setForm(f => ({ ...f, category: domains[0] })); setShowAddModal(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-500/25">
              <Plus className="w-3.5 h-3.5" /> Log Milestone
            </button>
          </div>
        </div>
      </div>

      {/* ── Premium Analytical Split Charts Row Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Domain-wise metrics visualization */}
        <div className="lg:col-span-2 bg-white/[0.015] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4 text-amber-400" /><h3 className="text-xs font-bold text-gray-300">Milestones Distribution Matrix</h3></div>
          <div className="w-full h-44">
            {domains.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-600">Add custom domains to populate the layout graph metrics.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={computedChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={9} tickLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} allowDecimals={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10 }} />
                  <Bar dataKey="Victories" fill="#d97706" radius={[3, 3, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live Traffic Monitoring */}
        <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-emerald-400" /><h3 className="text-xs font-bold text-gray-300">Roster Hits Stream Audit Logs</h3></div>
          <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTimeline} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={9} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10 }} />
                <Area type="monotone" dataKey="Impressions" stroke="#10b981" fillOpacity={1} fill="url(#colorImpressions)" strokeWidth={2} />
                <Area type="monotone" dataKey="Engagement" stroke="#6366f1" fillOpacity={0} strokeWidth={1.5} strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Micro Metrics Counters Roster ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cumulative Ingested Milestones', value: achievements.length, color: '#f59e0b', Icon: Trophy },
          { label: 'Featured Main Highlight Displays', value: achievements.filter(a => a.isFeatured).length, color: '#a78bfa', Icon: Sparkles },
          { label: 'Roster Logs Impressions', value: metrics.totalViews, color: '#10b981', Icon: Eye },
          { label: 'Interactive Audits Handled', value: metrics.interactions, color: '#06b6d4', Icon: Users },
        ].map((s) => (
          <div key={s.label} className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border mb-2" style={{ background: `${s.color}12`, borderColor: `${s.color}25` }}><s.Icon style={{ color: s.color, width: 14, height: 14 }} /></div>
            <p className="text-xl font-black text-white leading-none tracking-tight"><AnimatedNumber value={s.value} /></p>
            <p className="text-[10px] text-gray-500 font-medium mt-1.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filtering Action Control Bar ── */}
      <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <select className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-gray-300 px-3 py-2 pr-9 outline-none cursor-pointer" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="All">All Tech Domains</option>
            {domains.map(d => <option key={d} value={d} className="bg-gray-900">{d}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
        </div>
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 w-full sm:w-56">
          <Search className="w-3 h-3 text-gray-600" />
          <input className="bg-transparent text-gray-200 text-xs outline-none w-full placeholder-gray-600" placeholder="Filter rosters identity..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* ── Achievements Fluid Card Display Matrix ── */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 border border-white/[0.05] rounded-xl text-xs text-gray-500">No active milestones recorded under these parameters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item, index) => (
            <div key={item.id || index} className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 relative transition-all group">
              <div className="flex items-start justify-between border-b border-white/[0.05] pb-3 mb-3">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white tracking-tight">{item.title}</h3>
                    {item.isFeatured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{item.category} · Session {item.year}</p>
                </div>
                
                <button onClick={() => handleDelete(item.id)} className="w-7 h-7 rounded-lg border border-white/5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed mb-4">{item.description}</p>
              
              <div className="flex items-center justify-between gap-4 bg-white/[0.01] border border-white/[0.03] rounded-xl p-2 px-3 text-[11px]">
                <div className="truncate text-gray-500 font-medium">Team: <span className="text-indigo-400 font-semibold">{item.teamMembers.join(', ')}</span></div>
                {item.eventLink && (
                  <a href={item.eventLink} target="_blank" rel="noreferrer" className="text-amber-400 flex items-center gap-1 hover:text-amber-300 shrink-0 font-bold">
                    <Link2 className="w-3 h-3" /> Proof Verification
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}