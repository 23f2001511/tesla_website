'use client';

import {
  FileText, Plus, Trash2, Edit2, Eye, Heart, Clock, Tag,
  CheckCircle2, RefreshCw, X, Save, Send, Upload,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type StatusFilter = 'All' | 'Published' | 'Pending' | 'Draft' | 'Rejected';

const statusColors: Record<string, string> = {
  Published: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Pending:   'bg-amber-500/15 text-amber-400 border-amber-500/25',
  Rejected:  'bg-red-500/15 text-red-400 border-red-500/25',
  Draft:     'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const stagger = (d = 0.08) => ({ hidden: {}, show: { transition: { staggerChildren: d } } });

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

function Badge({ text, className = '' }: { text: string; className?: string }) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}>{text}</span>;
}

const blankBlog = { title: '', category: '', tags: '', content: '', coverImage: '' };

export default function DashboardBlogsPage() {
  const [serverData, setServerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [viewingBlog, setViewingBlog] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');
  const [blogData, setBlogData] = useState(blankBlog);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/dashboard/blogs/my');
      const data = await res.json();
      if (data.success) setServerData(data);
    } catch (err) {
      console.error('Failed to load blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlogs(); }, []);

  const openCreate = () => {
    setEditingBlog(null);
    setBlogData(blankBlog);
    setShowEditor(true);
  };

  const openEdit = (blog: any) => {
    setEditingBlog(blog);
    setBlogData({
      title: blog.title,
      category: blog.category,
      tags: blog.tags?.join(', ') || '',
      content: blog.content,
      coverImage: blog.coverImage || '',
    });
    setShowEditor(true);
  };

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBlogData(d => ({ ...d, coverImage: reader.result as string }));
    reader.readAsDataURL(file);
  };

  // submitForReview = true → Pending, otherwise → Draft
  const handleSave = async (submitForReview: boolean) => {
    if (!blogData.title || !blogData.category || !blogData.content) {
      alert('Title, category and content are required.');
      return;
    }
    try {
      setSaving(true);
      const url = editingBlog ? `/api/blogs/${editingBlog._id}` : '/api/blogs';
      const res = await fetch(url, {
        method: editingBlog ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...blogData,
          tags: blogData.tags.split(',').map(t => t.trim()).filter(Boolean),
          status: submitForReview ? 'Pending' : 'Draft',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowEditor(false);
        setEditingBlog(null);
        setBlogData(blankBlog);
        fetchBlogs();
      } else {
        alert(data.error || 'Operation failed.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog permanently?')) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchBlogs();
      else alert(data.error || 'Delete failed.');
    } catch {
      alert('Network error. Please try again.');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen text-sm text-slate-500 gap-2">
      <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Loading blogs…
    </div>
  );

  const stats = serverData?.stats || {};
  const summaryStats = [
    { label: 'Total Blogs', value: stats.totalBlogs || 0,     icon: FileText,     color: 'from-blue-500/20 to-blue-600/10',     accent: '#3b82f6' },
    { label: 'Published',   value: stats.publishedCount || 0, icon: CheckCircle2, color: 'from-emerald-500/20 to-emerald-600/10', accent: '#10b981' },
    { label: 'Pending',     value: stats.pendingCount || 0,   icon: Clock,        color: 'from-violet-500/20 to-violet-600/10', accent: '#8b5cf6' },
    { label: 'Views',       value: stats.totalViews || 0,     icon: Eye,          color: 'from-amber-500/20 to-amber-600/10',  accent: '#f59e0b' },
  ];

  const blogs = serverData?.blogs || [];
  const filteredBlogs = blogs.filter((b: any) => activeFilter === 'All' || b.status === activeFilter);

  return (
    <div className="min-h-screen pb-16 space-y-6 text-gray-100">

      {/* ── HEADER ── */}
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
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">My Blogs</h1>
              </div>
              <p className="text-slate-400 text-sm ml-1">Write, submit and track your Tesla Club articles.</p>
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}>
              <Plus className="w-4 h-4" /> Create Blog
            </button>
          </div>
        </GlassCard>
      </motion.div>

      {/* ── STATS ── */}
      <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryStats.map(s => (
          <motion.div key={s.label} variants={fadeUp}>
            <GlassCard className="p-5 hover:border-white/10 transition-all duration-300 h-full">
              <div className={`inline-flex w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5" style={{ color: s.accent }} />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── BLOGS ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <GlassCard className="p-7">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">My Blogs</h2>
              <p className="text-sm text-slate-500 mt-0.5">Manage your drafts, submissions and published articles</p>
            </div>
            <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1 flex-wrap">
              {(['All', 'Published', 'Pending', 'Draft', 'Rejected'] as const).map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeFilter === f ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredBlogs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <FileText className="w-10 h-10 text-slate-700" />
              <p className="text-sm text-slate-500">No blogs to show here yet.</p>
              <button onClick={openCreate} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                Write your first blog →
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredBlogs.map((blog: any, i: number) => {
                  const canEdit = blog.status === 'Draft' || blog.status === 'Rejected';
                  return (
                    <motion.div key={blog._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ delay: 0.04 * i }}
                      className="flex flex-col rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10] transition-all group">
                      {/* Cover */}
                      <div className="relative h-32 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center overflow-hidden border-b border-white/5">
                        {blog.coverImage
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <FileText className="w-10 h-10 text-slate-700" />}
                        <div className="absolute top-3 left-3">
                          <Badge text={blog.status} className={`${statusColors[blog.status] || 'bg-white/5'} backdrop-blur-sm uppercase text-[10px] font-bold tracking-wide`} />
                        </div>
                        <div className="absolute top-3 right-3">
                          <Badge text={blog.category} className="bg-black/40 border-white/10 text-white backdrop-blur-sm text-[10px]" />
                        </div>
                      </div>

                      {/* Body */}
                      <div className="flex flex-col flex-1 p-4 gap-3 bg-white/[0.01]">
                        <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors leading-snug line-clamp-2">{blog.title}</h3>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{new Date(blog.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5"><Eye className="w-3 h-3" />{blog.views}</span>
                          <span className="flex items-center gap-1.5"><Heart className="w-3 h-3" />{blog.likes}</span>
                        </div>

                        {blog.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {blog.tags.slice(0, 4).map((t: string) => (
                              <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-slate-400">
                                <Tag className="w-2.5 h-2.5" />{t}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-auto pt-3 border-t border-white/[0.06] flex gap-2">
                          <button onClick={() => setViewingBlog(blog)}
                            className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all">
                            <Eye className="w-3 h-3" /> View
                          </button>
                          {canEdit && (
                            <button onClick={() => openEdit(blog)}
                              className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all">
                              <Edit2 className="w-3 h-3 text-primary" /> Edit
                            </button>
                          )}
                          <button onClick={() => handleDelete(blog._id)}
                            className="px-3 py-1.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-xs font-medium text-red-400 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* ── EDITOR MODAL ── */}
      <AnimatePresence>
        {showEditor && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditor(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h2 className="text-sm font-bold text-white">{editingBlog ? 'Edit Blog' : 'Create Blog'}</h2>
                </div>
                <button onClick={() => setShowEditor(false)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4 max-h-[68vh] overflow-y-auto">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Title *</label>
                  <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. Building an EV Battery Management System"
                    value={blogData.title} onChange={e => setBlogData({ ...blogData, title: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Category *</label>
                    <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500 transition-colors"
                      placeholder="e.g. AI/ML, Robotics"
                      value={blogData.category} onChange={e => setBlogData({ ...blogData, category: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Tags (comma separated)</label>
                    <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500 transition-colors"
                      placeholder="ev, battery, embedded"
                      value={blogData.tags} onChange={e => setBlogData({ ...blogData, tags: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Cover Image</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.07] transition-colors">
                      <Upload className="w-3.5 h-3.5" /> Upload Image
                    </button>
                    {blogData.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={blogData.coverImage} alt="cover preview" className="w-16 h-10 rounded-lg object-cover border border-white/10" />
                    )}
                    {blogData.coverImage && (
                      <button type="button" onClick={() => setBlogData({ ...blogData, coverImage: '' })}
                        className="text-xs text-red-400 hover:text-red-300">Remove</button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePickImage} className="hidden" />
                  <input className="w-full mt-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500 transition-colors"
                    placeholder="…or paste an image URL"
                    value={blogData.coverImage.startsWith('data:') ? '' : blogData.coverImage}
                    onChange={e => setBlogData({ ...blogData, coverImage: e.target.value })} />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Content *</label>
                  <textarea rows={9}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-gray-200 outline-none resize-none focus:border-indigo-500 transition-colors"
                    placeholder="Write your article in Markdown…"
                    value={blogData.content} onChange={e => setBlogData({ ...blogData, content: e.target.value })} />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
                <button onClick={() => setShowEditor(false)} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]">Cancel</button>
                <button onClick={() => handleSave(false)} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 disabled:opacity-50 transition-colors">
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Draft
                </button>
                <button onClick={() => handleSave(true)} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors">
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Submit For Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── VIEW MODAL ── */}
      <AnimatePresence>
        {viewingBlog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewingBlog(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge text={viewingBlog.status} className={`${statusColors[viewingBlog.status] || 'bg-white/5'} uppercase text-[10px] font-bold`} />
                  <Badge text={viewingBlog.category} className="bg-white/5 border-white/10 text-slate-300 text-[10px]" />
                </div>
                <button onClick={() => setViewingBlog(null)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
              <div className="px-6 py-5 max-h-[72vh] overflow-y-auto space-y-4">
                {viewingBlog.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={viewingBlog.coverImage} alt={viewingBlog.title} className="w-full h-48 object-cover rounded-xl border border-white/10" />
                )}
                <h2 className="text-xl font-bold text-white">{viewingBlog.title}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{new Date(viewingBlog.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><Eye className="w-3 h-3" />{viewingBlog.views}</span>
                  <span className="flex items-center gap-1.5"><Heart className="w-3 h-3" />{viewingBlog.likes}</span>
                </div>
                {viewingBlog.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {viewingBlog.tags.map((t: string) => (
                      <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-slate-400">
                        <Tag className="w-2.5 h-2.5" />{t}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{viewingBlog.content}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
