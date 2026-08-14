'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Search, RefreshCw, X, Download } from 'lucide-react';

interface ResourceItem {
  _id?: string;
  title: string;
  type: 'NOTES' | 'PYQ' | 'LAB' | 'SLIDES' | 'BOOK';
  subject: string;
  semester: string;
  fileUrl: string;
  downloads: number;
}

const defaultResource: ResourceItem = {
  title: '',
  type: 'NOTES',
  subject: '',
  semester: 'Sem 1',
  fileUrl: '#',
  downloads: 0,
};

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ResourceItem>(defaultResource);
  const [saving, setSaving] = useState(false);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/resources');
      const data = await res.json();
      if (data.success) {
        setResources(data.resources || []);
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(defaultResource);
    setModalOpen(true);
  };

  const handleOpenEdit = (res: ResourceItem) => {
    setEditingId(res._id || null);
    setFormData(res);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.subject) {
      alert('Title and Subject code are required.');
      return;
    }

    try {
      setSaving(true);
      const url = editingId ? `/api/admin/resources/${editingId}` : '/api/admin/resources';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchResources();
      } else {
        alert('Save failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error saving resource: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete resource "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/resources/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setResources((prev) => prev.filter((r) => r._id !== id));
      } else {
        alert('Delete failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error deleting resource: ' + err.message);
    }
  };

  const filtered = resources.filter((r) => {
    const matchSem = semesterFilter === 'All' || r.semester === semesterFilter;
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.subject.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase());
    return matchSem && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="tag-mono-acid mb-1">// ACADEMIC VAULT</div>
          <h1 className="display text-3xl sm:text-4xl text-ivory">RESOURCES VAULT</h1>
          <p className="text-xs sm:text-sm text-ivory-2 mt-1">
            Manage shared semester notes, previous year questions (PYQ), and lab manuals for students.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchResources} className="btn-brut text-xs py-2 px-3">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleOpenAdd} className="btn-acid text-xs py-2.5 px-4">
            <Plus className="w-4 h-4" /> Add File
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-ink-2 p-3 border border-line">
        <div className="flex flex-wrap gap-1.5">
          {['All', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'].map((sem) => (
            <button
              key={sem}
              onClick={() => setSemesterFilter(sem)}
              className={`px-2.5 py-1 font-mono text-[10px] uppercase border transition-colors ${
                semesterFilter === sem
                  ? 'border-acid bg-acid text-acid-ink font-bold'
                  : 'border-line text-ivory-2 hover:border-line-2 hover:text-ivory'
              }`}
            >
              {sem}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="SEARCH FILES / SUBJECTS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-ink border border-line focus:border-acid px-3 py-2 pl-9 font-mono text-xs text-ivory placeholder:text-muted focus:outline-none"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
        </div>
      </div>

      {/* Table */}
      <div className="border border-line overflow-x-auto bg-ink-2">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="border-b border-line bg-ink">
              <th className="tag-mono px-5 py-3 font-normal">TITLE / FILE</th>
              <th className="tag-mono px-5 py-3 font-normal">TYPE</th>
              <th className="tag-mono px-5 py-3 font-normal">SUBJECT / SEM</th>
              <th className="tag-mono px-5 py-3 font-normal text-right">DOWNLOADS</th>
              <th className="tag-mono px-5 py-3 font-normal text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center tag-mono">
                  LOADING VAULT FILES…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center tag-mono">
                  NO FILES MATCH
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r._id}
                  className="border-b border-line last:border-b-0 hover:bg-ink transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="font-bold text-sm text-ivory group-hover:text-acid transition-colors">
                      {r.title}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-[10px] tracking-wider uppercase border border-line px-2 py-0.5 text-ivory-2">
                      {r.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-muted">
                    {r.subject} / {r.semester}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-acid text-right">
                    {r.downloads}
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(r)}
                      className="p-1.5 border border-line text-ivory-2 hover:text-acid hover:border-acid transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => r._id && handleDelete(r._id, r.title)}
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-ink-2 border border-line corner-marks w-full max-w-lg p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <div className="tag-mono-acid">// {editingId ? 'EDIT RESOURCE' : 'NEW FILE'}</div>
                <h2 className="display text-2xl text-ivory mt-1">
                  {editingId ? formData.title : 'ADD VAULT RESOURCE'}
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
                <label className="tag-mono block mb-1.5">RESOURCE TITLE *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Data Structures Notes"
                  className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="tag-mono block mb-1.5">FILE TYPE</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none appearance-none"
                  >
                    <option value="NOTES">NOTES</option>
                    <option value="PYQ">PYQ</option>
                    <option value="LAB">LAB MANUAL</option>
                    <option value="SLIDES">SLIDES</option>
                    <option value="BOOK">BOOK</option>
                  </select>
                </div>

                <div>
                  <label className="tag-mono block mb-1.5">SUBJECT CODE *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value.toUpperCase() })}
                    placeholder="e.g. CS201"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="tag-mono block mb-1.5">SEMESTER</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none appearance-none"
                  >
                    <option value="Sem 1">Sem 1</option>
                    <option value="Sem 2">Sem 2</option>
                    <option value="Sem 3">Sem 3</option>
                    <option value="Sem 4">Sem 4</option>
                    <option value="Sem 5">Sem 5</option>
                    <option value="Sem 6">Sem 6</option>
                    <option value="Sem 7">Sem 7</option>
                    <option value="Sem 8">Sem 8</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="tag-mono block mb-1.5">FILE URL / DRIVE LINK</label>
                <input
                  type="text"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-line">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-acid flex-1 justify-center"
                >
                  {saving ? 'SAVING…' : editingId ? 'UPDATE FILE' : 'ADD TO VAULT'}
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
