'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Search, RefreshCw, X, Eye } from 'lucide-react';

interface BlogItem {
  _id?: string;
  title: string;
  slug?: string;
  category: string;
  author: string;
  authorRole: string;
  readTime: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  status: 'Draft' | 'Published';
  publishedDate?: string;
  views?: number;
}

const defaultBlog: BlogItem = {
  title: '',
  category: 'WEB',
  author: 'Tesla Team',
  authorRole: 'Member',
  readTime: '5 MIN',
  content: '',
  coverImage: '',
  tags: [],
  status: 'Published',
  publishedDate: '',
  views: 0,
};

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BlogItem>(defaultBlog);
  const [saving, setSaving] = useState(false);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/blogs');
      const data = await res.json();
      if (data.success) {
        setBlogs(data.blogs || []);
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(defaultBlog);
    setModalOpen(true);
  };

  const handleOpenEdit = (blog: BlogItem) => {
    setEditingId(blog._id || null);
    setFormData(blog);
    setModalOpen(true);
  };

  const handleToggleStatus = async (blog: BlogItem) => {
    const nextStatus = blog.status === 'Published' ? 'Draft' : 'Published';
    try {
      const res = await fetch(`/api/admin/blogs/${blog._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setBlogs((prev) =>
          prev.map((b) => (b._id === blog._id ? { ...b, status: nextStatus } : b))
        );
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('Title and Content are required.');
      return;
    }

    try {
      setSaving(true);
      const url = editingId ? `/api/admin/blogs/${editingId}` : '/api/admin/blogs';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchBlogs();
      } else {
        alert('Save failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error saving blog: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete article "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBlogs((prev) => prev.filter((b) => b._id !== id));
      } else {
        alert('Delete failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error deleting blog: ' + err.message);
    }
  };

  const filteredBlogs = blogs.filter((b) => {
    return (
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="tag-mono-acid mb-1">// TECHNICAL WRITING</div>
          <h1 className="display text-3xl sm:text-4xl text-ivory">TECH BLOGS & LOGS</h1>
          <p className="text-xs sm:text-sm text-ivory-2 mt-1">
            Write, review, publish and edit student engineering deep-dives shown on /blogs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchBlogs} className="btn-brut text-xs py-2 px-3">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleOpenAdd} className="btn-acid text-xs py-2.5 px-4">
            <Plus className="w-4 h-4" /> New Article
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-ink-2 p-3 border border-line">
        <div className="tag-mono text-xs text-ivory">
          TOTAL POSTS: <span className="text-acid">{blogs.length}</span>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="SEARCH ARTICLES..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-ink border border-line focus:border-acid px-3 py-2 pl-9 font-mono text-xs text-ivory placeholder:text-muted focus:outline-none"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
        </div>
      </div>

      {/* Table */}
      <div className="border border-line overflow-x-auto bg-ink-2">
        <table className="w-full text-left min-w-[750px]">
          <thead>
            <tr className="border-b border-line bg-ink">
              <th className="tag-mono px-5 py-3 font-normal">TITLE</th>
              <th className="tag-mono px-5 py-3 font-normal">CATEGORY</th>
              <th className="tag-mono px-5 py-3 font-normal">AUTHOR</th>
              <th className="tag-mono px-5 py-3 font-normal">DATE / READ</th>
              <th className="tag-mono px-5 py-3 font-normal">STATUS</th>
              <th className="tag-mono px-5 py-3 font-normal text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center tag-mono">
                  LOADING BLOGS…
                </td>
              </tr>
            ) : filteredBlogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center tag-mono">
                  NO ARTICLES FOUND
                </td>
              </tr>
            ) : (
              filteredBlogs.map((b) => (
                <tr
                  key={b._id}
                  className="border-b border-line last:border-b-0 hover:bg-ink transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="font-bold text-sm text-ivory group-hover:text-acid transition-colors line-clamp-1 max-w-sm">
                      {b.title}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-[10px] tracking-wider uppercase border border-line px-2 py-0.5 text-acid">
                      {b.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-ivory-2">
                    <div>{b.author}</div>
                    <div className="text-muted text-[10px]">{b.authorRole}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-muted">
                    <div>{b.publishedDate || 'Draft'}</div>
                    <div className="text-[10px]">{b.readTime}</div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggleStatus(b)}
                      className={`font-mono text-[10px] uppercase px-2 py-0.5 border cursor-pointer transition-colors ${
                        b.status === 'Published'
                          ? 'border-green-500/40 text-green-400 bg-green-500/10 hover:border-red-400 hover:text-red-400'
                          : 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10 hover:border-green-400 hover:text-green-400'
                      }`}
                    >
                      {b.status} (Toggle)
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 border border-line text-ivory-2 hover:text-acid hover:border-acid transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => b._id && handleDelete(b._id, b.title)}
                      className="p-1.5 border border-line text-ivory-2 hover:text-red-400 hover:border-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Write / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-ink-2 border border-line corner-marks w-full max-w-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <div className="tag-mono-acid">// {editingId ? 'EDIT ARTICLE' : 'NEW WRITEUP'}</div>
                <h2 className="display text-2xl text-ivory mt-1">
                  {editingId ? formData.title : 'AUTHOR TECH LOG'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-muted hover:text-ivory"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="tag-mono block mb-1.5">ARTICLE TITLE *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Building Scalable Web Applications with Next.js"
                  className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="tag-mono block mb-1.5">CATEGORY</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. WEB, AI/ML"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="tag-mono block mb-1.5">AUTHOR NAME</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="tag-mono block mb-1.5">READ TIME</label>
                  <input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    placeholder="e.g. 5 MIN"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="tag-mono block mb-1.5">AUTHOR ROLE</label>
                  <input
                    type="text"
                    value={formData.authorRole || ''}
                    onChange={(e) => setFormData({ ...formData, authorRole: e.target.value })}
                    placeholder="e.g. Technical Lead"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="tag-mono block mb-1.5">STATUS</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'Draft' | 'Published',
                      })
                    }
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none appearance-none"
                  >
                    <option value="Published">Published (Public)</option>
                    <option value="Draft">Draft (Internal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="tag-mono block mb-1.5">CONTENT / WRITEUP *</label>
                <textarea
                  rows={8}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Full writeup or Markdown body..."
                  className="w-full bg-ink border border-line focus:border-acid px-3 py-2.5 text-sm text-ivory font-mono focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-line">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-acid flex-1 justify-center"
                >
                  {saving ? 'SAVING…' : editingId ? 'UPDATE ARTICLE' : 'PUBLISH ARTICLE'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-brut"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
