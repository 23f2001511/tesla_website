'use client';

import { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  FileText, Check, Ban, Eye, RefreshCw, Search, Trash2, Edit3,
  ChevronDown, Clock, ThumbsUp, Layers, CheckCircle2,
  AlertCircle, Loader2, FolderPlus, Tag, Inbox,
  BarChart3, TrendingUp, X, BookOpen
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';

// ─── Types ─────────────────────────────────────────────────────────────────────
type BlogStatus = 'Draft' | 'Pending' | 'Published' | 'Rejected';

interface Author {
  _id: string;
  name: string;
  profileImage?: string;
  designation?: string;
}

interface BlogItem {
  _id: string;
  title: string;
  content: string;
  author: Author | null;
  category: string;
  coverImage?: string;
  status: BlogStatus;
  likes: string[];
  views: number;
  tags: string[];
  createdAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Animated Counter ──────────────────────────────────────────────────────────
const AnimatedNumber = memo(({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const prev = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const from = prev.current;
    const tick = (now: number) => {
      const t = Math.min((now - start) / 700, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * e));
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else prev.current = value;
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current !== null) cancelAnimationFrame(raf.current); };
  }, [value]);
  return <>{display.toLocaleString()}</>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

// ─── Shared UI Primitives ─────────────────────────────────────────────────────
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-white/5 rounded-2xl ${className}`} />
);

const Backdrop = ({ onClick }: { onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
    onClick={onClick}
  />
);

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-gray-200 font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#a78bfa' }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

// ─── Blog Editor Modal ─────────────────────────────────────────────────────────
function BlogEditorModal({
  blog, onClose, onSave
}: {
  blog: Partial<BlogItem> | null;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}) {
  const isEdit = !!blog?._id;
  const [form, setForm] = useState({
    title: blog?.title || '',
    content: blog?.content || '',
    category: blog?.category || '',
    coverImage: blog?.coverImage || '',
    tags: blog?.tags?.join(', ') || ''
  });
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.title || !form.content || !form.category) {
      setError('Title, content, and category are required.'); return;
    }
    setActing(true); setError('');
    await onSave(form);
    setActing(false);
    onClose();
  };

  return (
    <>
      <Backdrop onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-sm font-bold text-white">{isEdit ? 'Edit Article' : 'Write New Article'}</h2>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 max-h-[68vh] overflow-y-auto custom-scrollbar">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Title *</label>
              <input
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none focus:border-purple-500 transition-colors"
                placeholder="e.g. Getting Started with React Server Components"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Category *</label>
                <input
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none focus:border-purple-500 transition-colors"
                  placeholder="e.g. Technical, Design"
                  value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Tags (comma separated)</label>
                <input
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none focus:border-purple-500 transition-colors"
                  placeholder="react, nextjs, tutorial"
                  value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Cover Image URL</label>
              <input
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none focus:border-purple-500 transition-colors"
                placeholder="https://res.cloudinary.com/..."
                value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Content *</label>
              <textarea
                rows={9}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-gray-200 outline-none resize-none focus:border-purple-500 transition-colors"
                placeholder="Write your article in Markdown…"
                value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]">Cancel</button>
            <button
              onClick={handleSave} disabled={acting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 transition-colors"
            >
              {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {acting ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Article'}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ─── Blog Table Row ────────────────────────────────────────────────────────────
const BlogRow = memo(function BlogRow({
  blog, index, onEdit, onDelete, onStatusChange
}: {
  blog: BlogItem; index: number;
  onEdit: (b: BlogItem) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'Published' | 'Rejected') => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
      transition={{ delay: 0.03 * index, duration: 0.28 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="text-xs text-gray-300 transition-colors"
      style={{ background: hovered ? 'rgba(255,255,255,0.018)' : 'transparent' }}
    >
      {/* Title & category */}
      <td className="px-4 py-3 align-middle border-b border-white/[0.04] max-w-[220px]">
        <p className="font-semibold text-[13px] text-gray-100 truncate">{blog.title}</p>
        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold mt-0.5">{blog.category}</p>
      </td>

      {/* Author & date */}
      <td className="px-4 py-3 align-middle border-b border-white/[0.04] whitespace-nowrap">
        <p className="text-[13px] text-gray-300">{blog.author?.name || 'Anonymous'}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{fmtDate(blog.createdAt)}</p>
      </td>

      {/* Metrics */}
      <td className="px-4 py-3 align-middle border-b border-white/[0.04] whitespace-nowrap">
        <div className="flex items-center gap-4 text-gray-400 text-[11px]">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-gray-600" /> {blog.views || 0}</span>
          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-gray-600" /> {blog.likes?.length || 0}</span>
        </div>
      </td>

      {/* Status badge */}
      <td className="px-4 py-3 align-middle border-b border-white/[0.04] whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
          blog.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
          blog.status === 'Rejected'  ? 'bg-red-500/10 text-red-400 border-red-500/20' :
          blog.status === 'Pending'   ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                        'bg-white/5 text-gray-400 border-white/10'
        }`}>{blog.status}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 align-middle border-b border-white/[0.04] whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(blog)} title="Edit"
            className="w-7 h-7 rounded-lg border border-white/[0.07] text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 flex items-center justify-center transition-all"
          ><Edit3 className="w-3 h-3" /></button>
          {blog.status !== 'Published' && (
            <button
              onClick={() => onStatusChange(blog._id, 'Published')} title="Publish"
              className="w-7 h-7 rounded-lg border border-white/[0.07] text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center transition-all"
            ><Check className="w-3 h-3" /></button>
          )}
          {blog.status !== 'Rejected' && (
            <button
              onClick={() => onStatusChange(blog._id, 'Rejected')} title="Reject"
              className="w-7 h-7 rounded-lg border border-white/[0.07] text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 flex items-center justify-center transition-all"
            ><Ban className="w-3 h-3" /></button>
          )}
          <button
            onClick={() => onDelete(blog._id)} title="Delete"
            className="w-7 h-7 rounded-lg border border-white/[0.07] text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all"
          ><Trash2 className="w-3 h-3" /></button>
        </div>
      </td>
    </motion.tr>
  );
});

// ─── Main Admin Blogs Page ─────────────────────────────────────────────────────
export default function AdminBlogsPage() {
  const [blogs, setBlogs]           = useState<BlogItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<BlogStatus | 'All'>('All');
  const [sortParam, setSortParam]     = useState<'date' | 'views' | 'likes'>('date');
  const [selected, setSelected]       = useState<string[]>([]);

  // UI state
  const [activeTab, setActiveTab]     = useState<'all' | 'pending'>('all');
  const [editorTarget, setEditorTarget] = useState<Partial<BlogItem> | null>(null);
  const [showEditor, setShowEditor]   = useState(false);

  // Keep ref in sync so handleSave always reads the latest target even after close
  useEffect(() => { editorTargetRef.current = editorTarget; }, [editorTarget]);

  const lastFetch = useRef(0);
  // Keep a ref in sync so mutations always see the latest editorTarget
  const editorTargetRef = useRef<Partial<BlogItem> | null>(null);
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBlogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // Add timestamp to bust Next.js fetch cache on every call
      const res = await fetch(`/api/admin/blogs?_=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success) {
        setBlogs(data.blogs);
        setError('');
        setLastUpdated(new Date());
        lastFetch.current = Date.now();
      } else throw new Error(data.error || 'Fetch failed');
    } catch (err: any) {
      setError(err.message || 'Could not load blogs.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  // Auto-refresh: every 60s + on window focus
  useEffect(() => {
    const t = setInterval(() => fetchBlogs(true), 60_000);
    const onFocus = () => { if (Date.now() - lastFetch.current > 30_000) fetchBlogs(true); };
    const onVis = () => { if (document.visibilityState === 'visible') onFocus(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVis); };
  }, [fetchBlogs]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateStatus = useCallback(async (id: string, status: 'Published' | 'Rejected') => {
    // 1. Optimistic update — UI reflects instantly, no waiting for network
    setBlogs(prev =>
      prev.map(b => b._id === id ? { ...b, status } : b)
    );
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        // 2. Confirm with fresh server data (background sync)
        router.refresh();
        await fetchBlogs(true);
      } else {
        // 3. Rollback on failure
        console.error('[updateStatus] failed:', data.error);
        await fetchBlogs(true); // restore real state
        alert(`Failed to update status: ${data.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('[updateStatus] network error:', e);
      await fetchBlogs(true); // rollback
    }
  }, [fetchBlogs, router]);

  const deleteBlog = useCallback(async (id: string) => {
    if (!confirm('Delete this article permanently?')) return;
    // Optimistic: remove from UI immediately
    setBlogs(prev => prev.filter(b => b._id !== id));
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        // Rollback if server rejected
        await fetchBlogs(true);
        alert(`Delete failed: ${data.error || 'Unknown error'}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      console.error('[deleteBlog] error:', e);
      await fetchBlogs(true); // rollback
    }
  }, [fetchBlogs, router]);

  const handleSave = useCallback(async (formPayload: any) => {
    try {
      const target = editorTargetRef.current;
      const url    = target?._id ? `/api/admin/blogs/${target._id}` : '/api/admin/blogs';
      const method = target?._id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPayload)
      });
      const data = await res.json();
      if (data.success) {
        // For edit: optimistically update the row immediately
        if (target?._id && data.blog) {
          setBlogs(prev => prev.map(b => b._id === target._id ? { ...b, ...data.blog } : b));
        }
        router.refresh();
        await fetchBlogs(true); // sync with DB (catches new blog too)
      } else {
        alert(`Save failed: ${data.error || 'Unknown error'}`);
      }
    } catch (e) { console.error('[handleSave] error:', e); }
  }, [fetchBlogs, router]);

  const executeBulk = async (action: 'Publish' | 'Reject' | 'Delete') => {
    if (!selected.length) return;
    if (!confirm(`Run bulk [${action}] on ${selected.length} article(s)?`)) return;
    try {
      const res = await fetch('/api/admin/blogs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkAction: true, ids: selected, action })
      });
      if ((await res.json()).success) { setSelected([]); router.refresh(); await fetchBlogs(true); }
    } catch (e) { console.error(e); }
  };

  // ── Derived Data ───────────────────────────────────────────────────────────
  const metrics = useMemo(() => ({
    total:     blogs.length,
    pending:   blogs.filter(b => b.status === 'Pending' || b.status === 'Draft').length,
    published: blogs.filter(b => b.status === 'Published').length,
    views:     blogs.reduce((s, b) => s + (b.views || 0), 0),
  }), [blogs]);

  // Monthly activity (last 6 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { name: string; articles: number; views: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const name = d.toLocaleDateString('en-IN', { month: 'short' });
      const y = d.getFullYear(); const m = d.getMonth();
      const monthBlogs = blogs.filter(b => {
        const bd = new Date(b.createdAt);
        return bd.getFullYear() === y && bd.getMonth() === m;
      });
      months.push({ name, articles: monthBlogs.length, views: monthBlogs.reduce((s, b) => s + (b.views || 0), 0) });
    }
    return months;
  }, [blogs]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    blogs.forEach(b => { if (b.category) counts[b.category] = (counts[b.category] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [blogs]);

  const pendingBlogs = useMemo(() => blogs.filter(b => b.status === 'Pending' || b.status === 'Draft'), [blogs]);

  const filteredBlogs = useMemo(() => {
    const q = search.toLowerCase();
    return blogs
      .filter(b => {
        const mQ = !q || b.title.toLowerCase().includes(q) || (b.author?.name || '').toLowerCase().includes(q);
        const mS = statusFilter === 'All' || b.status === statusFilter;
        return mQ && mS;
      })
      .sort((a, b) => {
        if (sortParam === 'views') return b.views - a.views;
        if (sortParam === 'likes') return (b.likes?.length || 0) - (a.likes?.length || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [blogs, search, statusFilter, sortParam]);

  const toggleAll = () => {
    setSelected(selected.length === filteredBlogs.length ? [] : filteredBlogs.map(b => b._id));
  };

  const statCards = useMemo(() => [
    { label: 'Total Articles',    value: metrics.total,     color: '#a78bfa', Icon: Layers },
    { label: 'Awaiting Review',   value: metrics.pending,   color: '#f59e0b', Icon: Clock },
    { label: 'Published Live',    value: metrics.published, color: '#10b981', Icon: CheckCircle2 },
    { label: 'Total Views',       value: metrics.views,     color: '#06b6d4', Icon: Eye },
  ], [metrics]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-32" />
      <div className="grid grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="h-48" />
      <Skeleton className="h-72" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-6">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-red-400 font-semibold">Couldn't load articles</p>
      <p className="text-gray-500 text-sm max-w-xs">{error}</p>
      <button onClick={() => fetchBlogs()} className="mt-2 px-5 py-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25 text-sm font-medium hover:bg-purple-500/25 transition-colors">Try again</button>
    </div>
  );

  const hasMonthly = monthlyData.some(d => d.articles > 0);

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto text-gray-100">

      <AnimatePresence mode="wait">
        {showEditor && (
          <BlogEditorModal
            blog={editorTarget}
            onClose={() => { setShowEditor(false); setEditorTarget(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.07] px-7 py-6">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <FileText className="w-5 h-5 text-purple-400" />
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Blog Management</h1>
            </div>
            <p className="text-gray-400 text-sm">Write articles · review submissions · track engagement</p>
            {lastUpdated && (
              <div className="flex items-center gap-2 mt-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-[11px] text-gray-500">Live · {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {metrics.pending > 0 && (
              <button onClick={() => setActiveTab('pending')} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all">
                <Clock className="w-3.5 h-3.5" />{metrics.pending} pending
              </button>
            )}
            <button onClick={() => fetchBlogs(true)} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:text-gray-200 text-sm font-medium transition-all">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={() => { setEditorTarget(null); setShowEditor(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-500/25"
            >
              <FolderPlus className="w-3.5 h-3.5" /> Write Article
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="relative overflow-hidden bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 border" style={{ background: `${s.color}20`, borderColor: `${s.color}40` }}>
              <s.Icon style={{ color: s.color, width: 16, height: 16 }} />
            </div>
            <p className="text-[26px] font-extrabold text-white tracking-tight leading-none"><AnimatedNumber value={s.value} /></p>
            <p className="text-xs text-gray-500 mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly activity */}
        <div className="lg:col-span-2 bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-100 mb-4">Publishing Activity</h3>
          {!hasMonthly ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <TrendingUp className="w-8 h-8 text-gray-700" />
              <p className="text-xs text-gray-600">No articles published yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBlog" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="articles" stroke="#a78bfa" fill="url(#gBlog)" strokeWidth={2} name="Articles" isAnimationActive={!prefersReducedMotion} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown */}
        <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-100 mb-4">By Category</h3>
          {categoryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-gray-600">
              <Tag className="w-6 h-6 mb-1 mx-auto" />No categories yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryData} margin={{ top: 4, right: 4, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={9} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Articles" isAnimationActive={!prefersReducedMotion} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Table / Pending Tabs ─────────────────────────────────────────── */}
      <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl overflow-hidden">

        {/* Tab bar + filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-5 pt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 text-sm font-semibold border-b-2 px-2 transition-all ${activeTab === 'all' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >All Articles ({blogs.length})</button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 text-sm font-semibold border-b-2 px-2 transition-all ${activeTab === 'pending' ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >Pending Review ({pendingBlogs.length})</button>
          </div>

          {activeTab === 'all' && (
            <div className="flex flex-wrap items-center gap-2 pb-2">
              {/* Search */}
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5">
                <Search className="w-3 h-3 text-gray-600" />
                <input className="bg-transparent text-gray-200 text-xs outline-none w-32 placeholder-gray-600" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {/* Status filter */}
              <div className="relative">
                <select className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-gray-400 px-3 py-1.5 pr-7 outline-none cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                  <option value="All">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Published">Published</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
              </div>
              {/* Sort */}
              <div className="relative">
                <select className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-gray-400 px-3 py-1.5 pr-7 outline-none cursor-pointer" value={sortParam} onChange={e => setSortParam(e.target.value as any)}>
                  <option value="date">Sort: Date</option>
                  <option value="views">Sort: Views</option>
                  <option value="likes">Sort: Likes</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
              </div>
              {/* Bulk actions */}
              {selected.length > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl p-1 px-2 text-xs">
                  <span className="text-purple-400 font-bold pr-1">{selected.length} selected</span>
                  <button onClick={() => executeBulk('Publish')} className="text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg transition-colors">Approve</button>
                  <button onClick={() => executeBulk('Reject')}  className="text-[11px] bg-amber-500/10  hover:bg-amber-500/20  border border-amber-500/20  text-amber-400  px-2.5 py-1 rounded-lg transition-colors">Reject</button>
                  <button onClick={() => executeBulk('Delete')}  className="text-[11px] bg-red-500/10    hover:bg-red-500/20    border border-red-500/20    text-red-400    px-2.5 py-1 rounded-lg transition-colors">Delete</button>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* ── All Articles Table ──────────────────────────────────────────── */}
        {activeTab === 'all' && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.01] text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 w-10 text-center">
                    <input type="checkbox" className="cursor-pointer"
                      checked={selected.length === filteredBlogs.length && filteredBlogs.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                  {['Article', 'Author & Date', 'Engagement', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBlogs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-14 text-xs text-gray-600">No articles match the current filters.</td></tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredBlogs.map((blog, i) => (
                      <motion.tr
                        key={blog._id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: 0.03 * i, duration: 0.28 }}
                        className="text-xs text-gray-300 hover:bg-white/[0.018] transition-colors group"
                      >
                        <td className="px-4 py-3 align-middle border-b border-white/[0.04] text-center">
                          <input type="checkbox" className="cursor-pointer"
                            checked={selected.includes(blog._id)}
                            onChange={() => setSelected(selected.includes(blog._id) ? selected.filter(i => i !== blog._id) : [...selected, blog._id])}
                          />
                        </td>
                        <td className="px-4 py-3 align-middle border-b border-white/[0.04] max-w-[220px]">
                          <p className="font-semibold text-[13px] text-gray-100 truncate group-hover:text-purple-400 transition-colors">{blog.title}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold mt-0.5">{blog.category}</p>
                        </td>
                        <td className="px-4 py-3 align-middle border-b border-white/[0.04] whitespace-nowrap">
                          <p className="text-[13px] text-gray-300">{blog.author?.name || 'Anonymous'}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{fmtDate(blog.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3 align-middle border-b border-white/[0.04] whitespace-nowrap">
                          <div className="flex items-center gap-4 text-gray-400 text-[11px]">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-gray-600" /> {blog.views || 0}</span>
                            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-gray-600" /> {blog.likes?.length || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle border-b border-white/[0.04] whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            blog.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            blog.status === 'Rejected'  ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            blog.status === 'Pending'   ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                          'bg-white/5 text-gray-400 border-white/10'
                          }`}>{blog.status}</span>
                        </td>
                        <td className="px-4 py-3 align-middle border-b border-white/[0.04] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => { setEditorTarget(blog); setShowEditor(true); }} title="Edit" className="w-7 h-7 rounded-lg border border-white/[0.07] text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 flex items-center justify-center transition-all"><Edit3 className="w-3 h-3" /></button>
                            {blog.status !== 'Published' && <button onClick={() => updateStatus(blog._id, 'Published')} title="Publish" className="w-7 h-7 rounded-lg border border-white/[0.07] text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center transition-all"><Check className="w-3 h-3" /></button>}
                            {blog.status !== 'Rejected'  && <button onClick={() => updateStatus(blog._id, 'Rejected')}  title="Reject"  className="w-7 h-7 rounded-lg border border-white/[0.07] text-gray-500 hover:text-amber-400  hover:bg-amber-500/10  flex items-center justify-center transition-all"><Ban   className="w-3 h-3" /></button>}
                            <button onClick={() => deleteBlog(blog._id)} title="Delete" className="w-7 h-7 rounded-lg border border-white/[0.07] text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pending Review Tab ──────────────────────────────────────────── */}
        {activeTab === 'pending' && (
          <div className="p-5">
            {pendingBlogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-2 text-center">
                <Inbox className="w-8 h-8 text-gray-700" />
                <p className="text-sm text-gray-600 font-medium">No pending submissions</p>
                <p className="text-xs text-gray-700">All articles are reviewed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingBlogs.map(blog => (
                  <div key={blog._id} className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/30 rounded-xl p-4 transition-all">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-100 truncate">{blog.title}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">{blog.category}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${blog.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-white/5 text-gray-400 border-white/10'}`}>{blog.status}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>{blog.author?.name || 'Anonymous'}</span>
                          <span>·</span>
                          <span>{fmtDate(blog.createdAt)}</span>
                          <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> {blog.views || 0} views</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => { setEditorTarget(blog); setShowEditor(true); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs text-gray-300 hover:text-white transition-colors">
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => updateStatus(blog._id, 'Rejected')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 hover:bg-red-500/15 transition-colors">
                        <Ban className="w-3 h-3" /> Reject
                      </button>
                      <button onClick={() => updateStatus(blog._id, 'Published')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 hover:bg-emerald-500/15 transition-colors">
                        <Check className="w-3 h-3" /> Publish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}