'use client';

import {
  FileText, Plus, Trash2, Edit2, Eye, Search, Filter, 
  CheckCircle2, Clock, AlertCircle, RefreshCw, X, Save,
  Layers, ChevronRight, ArrowUpRight, Award, Zap, Heart,
  ToggleLeft, ToggleRight, MessageCircle, Mail, Smartphone
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type CategoryFilter = 'All' | 'Published' | 'Pending' | 'Draft';

const statusColors = {
  Published: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Pending:   'bg-amber-500/15 text-amber-400 border-amber-500/25',
  Rejected:  'bg-red-500/15 text-red-400 border-red-500/25',
  Draft:     'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = (d = 0.08) => ({ hidden: {}, show: { transition: { staggerChildren: d } } });

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Badge({ text, className = '' }: { text: string; className?: string }) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}>{text}</span>;
}

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${on ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : 'bg-white/10 border border-white/10'}`}
    >
      <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 35 }} className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md ${on ? 'bg-white left-[22px]' : 'bg-slate-500 left-0.5'}`} />
    </motion.button>
  );
}

export default function DashboardBlogsFullyFeatured() {
  const [serverData, setServerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifToggles, setNotifToggles] = useState({ push: true, email: false, slack: true });

  const [blogData, setBlogData] = useState({
    title: '',
    category: '',
    tags: '',
    content: '',
    coverImage: ''
  });

  const fetchBlogsPipeline = async () => {
    try {
      const res = await fetch('/api/dashboard/blogs/my');
      const data = await res.json();
      if (data.success) setServerData(data);
    } catch (err) {
      console.error('Failed syncing cloud blogs channel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogsPipeline();
  }, []);

  const handleCreateOrUpdateBlog = async () => {
    try {
      setSaving(true);
      const url = editingBlog ? `/api/blogs/${editingBlog._id}` : '/api/blogs';
      const method = editingBlog ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...blogData,
          tags: blogData.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setEditingBlog(null);
        setBlogData({ title: '', category: '', tags: '', content: '', coverImage: '' });
        fetchBlogsPipeline();
      } else {
        alert(data.message || 'Operation failed.');
      }
    } catch {
      alert('Network transaction breakdown.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently purge this article entity?')) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchBlogsPipeline();
    } catch {
      alert('Thread processing failure.');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen text-xs font-mono text-slate-500 gap-2 bg-[#0d1117]">
      <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Synthesizing Article Array Structures...
    </div>
  );

  const summaryStats = [
    { label: 'Total Articles',  value: serverData?.stats?.totalBlogs || '0',       icon: FileText,     color: 'from-blue-500/20 to-blue-600/10',     accent: '#3b82f6' },
    { label: 'Published Content',value: serverData?.stats?.publishedCount || '0',   icon: CheckCircle2,  color: 'from-emerald-500/20 to-emerald-600/10', accent: '#10b981' },
    { label: 'Awaiting Review',  value: serverData?.stats?.pendingCount || '0',     icon: Clock,         color: 'from-violet-500/20 to-violet-600/10', accent: '#8b5cf6' },
    { label: 'Accumulated Hits', value: serverData?.stats?.totalViews || '0',       icon: Eye,           color: 'from-amber-500/20 to-amber-600/10',  accent: '#f59e0b' },
  ];

  const filteredBlogs = (serverData?.blogs || []).filter((b: any) => {
    const matchFilter = activeFilter === 'All' || b.status === activeFilter;
    const matchSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen pb-16 space-y-6 bg-[#0d1117] text-gray-100">

      {/* ── PAGE LAYOUT HEADER ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <GlassCard className="relative overflow-hidden">
          <div className="absolute -top-20 -left-16 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-12 w-56 h-56 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-7 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">My Articles</h1>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]" />
                  <span className="text-[11px] text-emerald-400 font-semibold">Live Logs</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm ml-1">Write, edit, and evaluate telemetry matrices inside publication pipelines.</p>
            </div>
            
            <div className="relative shrink-0 w-full md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search articles…" className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors" />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ── 1. NUMERICAL SUMMARY METRICS BAR ── */}
      <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryStats.map(s => (
          <motion.div key={s.label} variants={fadeUp}>
            <GlassCard className="p-5 hover:border-white/10 transition-all duration-300 h-full">
              <div className={`inline-flex w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} items-center justify-center mb-3`}><s.icon className="w-5 h-5" style={{ color: s.accent }} /></div>
              <p className="text-2xl font-bold text-white font-mono">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── 2. ACTIVE ARTICLES ENGINE CONTAINER ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <GlassCard className="p-7">
          <SectionTitle title="Articles Management Deck" subtitle="Monitor, adjust or request layout clearance" action={
            <div className="flex gap-4 items-center">
              <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1">
                {(['All', 'Published', 'Pending', 'Draft'] as const).map(f => (
                  <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeFilter === f ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>{f}</button>
                ))}
              </div>
              <button onClick={() => { setEditingBlog(null); setBlogData({ title: '', category: '', tags: '', content: '', coverImage: '' }); setShowCreateModal(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-all shadow-md"><Plus className="w-4 h-4" /> New Entry</button>
            </div>
          } />

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredBlogs.map((blog: any, i: number) => (
                <motion.div key={blog._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ delay: 0.04 * i }} className="flex flex-col rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10] transition-all group">
                  <div className="relative h-28 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center overflow-hidden border-b border-white/5">
                    {blog.coverImage ? <img src={blog.coverImage} className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500" /> : <FileText className="w-10 h-10 text-slate-700" />}
                    <div className="absolute top-3 left-3"><Badge text={blog.status} className={`${statusColors[blog.status as keyof typeof statusColors] || 'bg-white/5'} backdrop-blur-sm tracking-wide uppercase text-[10px] font-bold`} /></div>
                    <div className="absolute top-3 right-3"><Badge text={blog.category} className="bg-white/5 border-white/10 backdrop-blur-sm text-[10px]" /></div>
                  </div>

                  <div className="flex flex-col flex-1 p-4 gap-3 bg-white/[0.01]">
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors leading-snug truncate">{blog.title}</h3>
                      <div className="space-y-1 mt-2 text-xs text-slate-500 font-mono">
                        <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{new Date(blog.createdAt).toLocaleDateString()}</p>
                        <p className="flex items-center gap-1.5"><Eye className="w-3 h-3" />{blog.views} Reads · {blog.likes} Hearts</p>
                      </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-white/[0.06] flex gap-2">
                      <button onClick={() => {
                        setEditingBlog(blog);
                        setBlogData({ title: blog.title, category: blog.category, tags: blog.tags?.join(', ') || '', content: blog.content, coverImage: blog.coverImage });
                        setShowCreateModal(true);
                      }} className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all">
                        <Edit2 className="w-3 h-3 text-primary" /> Modify
                      </button>
                      <button onClick={() => handleDelete(blog._id)} className="px-3 py-1.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-xs font-medium text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>
      </motion.div>

      {/* ── 3. TIMELINE & REMINDER SYNC CONFIG GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <GlassCard className="p-7 h-full">
            <SectionTitle title="Publications Log Pipeline" subtitle="Recent configuration state tracking logs" />
            <div className="space-y-3 font-mono text-xs text-slate-400">
              {serverData?.timeline?.map((t: any, idx: number) => (
                <div key={idx} className="p-3 bg-black/40 border border-white/5 rounded-xl flex justify-between items-center">
                  <span>{t.action}</span>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white/5" style={{ color: t.color }}>{t.type}</span>
                </div>
              ))}
              {(!serverData?.timeline || serverData?.timeline.length === 0) && <p className="text-slate-600">No active state changes reported inside this iteration loop.</p>}
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-2">
          <GlassCard className="p-7 h-full">
            <SectionTitle title="Notification Pipelines" subtitle="Configure event tracking alerts hooks" />
            <div className="space-y-4">
              {[
                { key: 'push' as const,  label: 'Push Validation Alerts', sub: 'In-app clearance alerts', icon: FileText,      color: 'text-blue-400' },
                { key: 'email' as const, label: 'Email Digest Reports', sub: 'Weekly analytic hits logs', icon: Mail,          color: 'text-amber-400' },
                { key: 'slack' as const, label: 'Tesla Slack Sync',      sub: 'Instant webhook trigger', icon: Smartphone,    color: 'text-emerald-400' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center"><item.icon className={`w-4 h-4 ${item.color}`} /></div>
                    <div>
                      <p className="text-xs font-semibold text-white">{item.label}</p>
                      <p className="text-[10px] text-slate-500">{item.sub}</p>
                    </div>
                  </div>
                  <ToggleSwitch on={notifToggles[item.key]} onToggle={() => setNotifToggles(prev => ({ ...prev, [item.key]: !prev[item.key] }))} />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── EXPANDED INTERACTIVE WORKSPACE MODAL ── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-2xl bg-[#0f141c] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" /> {editingBlog ? 'Modify Operational Data Document' : 'Incorporate New Technical Article'}
                </h2>
                <button onClick={() => { setShowCreateModal(false); setEditingBlog(null); }} className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-3 text-xs">
                <input placeholder="Article Headline Title..." value={blogData.title} onChange={e => setBlogData({ ...blogData, title: e.target.value })} className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Category (e.g. AI/ML)..." value={blogData.category} onChange={e => setBlogData({ ...blogData, category: e.target.value })} className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-primary" />
                  <input placeholder="Tags (comma-separated entries)..." value={blogData.tags} onChange={e => setBlogData({ ...blogData, tags: e.target.value })} className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-primary" />
                </div>
                <input placeholder="Cover Image thumbnail network URL address..." value={blogData.coverImage} onChange={e => setBlogData({ ...blogData, coverImage: e.target.value })} className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-primary outline-none focus:border-primary font-mono" />
                <textarea placeholder="Write full markup markdown composition body payload..." value={blogData.content} onChange={e => setBlogData({ ...blogData, content: e.target.value })} rows={8} className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-primary resize-none leading-relaxed" />
                
                <button disabled={saving} onClick={handleCreateOrUpdateBlog} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 font-bold py-3 rounded-xl text-white text-xs disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg">
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{saving ? 'Processing Transaction Core...' : editingBlog ? 'Save Layout Alterations' : 'Commit New Publication Request'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}