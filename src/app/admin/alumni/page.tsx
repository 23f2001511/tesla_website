'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GraduationCap, RefreshCw, X, Search } from 'lucide-react';

interface AlumniItem {
  _id?: string;
  name: string;
  role: string;
  company: string;
  batch: string;
  city: string;
  avatar?: string;
  linkedin?: string;
  mentorshipAvailable: boolean;
  order: number;
}

const defaultAlumni: AlumniItem = {
  name: '',
  role: 'SOFTWARE ENGINEER',
  company: 'GOOGLE',
  batch: '2022',
  city: 'BENGALURU',
  avatar: '',
  linkedin: '',
  mentorshipAvailable: true,
  order: 0,
};

export default function AdminAlumniPage() {
  const [alumni, setAlumni] = useState<AlumniItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AlumniItem>(defaultAlumni);
  const [saving, setSaving] = useState(false);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/alumni');
      const data = await res.json();
      if (data.success) {
        setAlumni(data.alumni || []);
      }
    } catch (err) {
      console.error('Error fetching alumni:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(defaultAlumni);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: AlumniItem) => {
    setEditingId(item._id || null);
    setFormData(item);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.batch) {
      alert('Name, Company, and Batch are required.');
      return;
    }

    try {
      setSaving(true);
      const url = editingId ? `/api/admin/alumni/${editingId}` : '/api/admin/alumni';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: formData.role.toUpperCase(),
          company: formData.company.toUpperCase(),
          city: formData.city.toUpperCase(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchAlumni();
      } else {
        alert('Save failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error saving alumni: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove alumni "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/alumni/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAlumni((prev) => prev.filter((a) => a._id !== id));
      } else {
        alert('Delete failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error deleting alumni: ' + err.message);
    }
  };

  const filtered = alumni.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.company.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase()) ||
      a.batch.includes(search)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="tag-mono-acid mb-1">// ALUMNI NETWORK</div>
          <h1 className="display text-3xl sm:text-4xl text-ivory">ALUMNI PROFILES</h1>
          <p className="text-xs sm:text-sm text-ivory-2 mt-1">
            Manage senior club graduates at tier-1 tech companies shown on /alumni.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchAlumni} className="btn-brut text-xs py-2 px-3">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleOpenAdd} className="btn-acid text-xs py-2.5 px-4">
            <Plus className="w-4 h-4" /> Add Alumni
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between bg-ink-2 p-3 border border-line">
        <div className="tag-mono text-xs text-ivory">
          ALUMNI REGISTERED: <span className="text-acid">{alumni.length}</span>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="SEARCH ALUMNI..."
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
              <th className="tag-mono px-5 py-3 font-normal">NAME</th>
              <th className="tag-mono px-5 py-3 font-normal">ROLE</th>
              <th className="tag-mono px-5 py-3 font-normal">COMPANY</th>
              <th className="tag-mono px-5 py-3 font-normal">BATCH / CITY</th>
              <th className="tag-mono px-5 py-3 font-normal text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center tag-mono">
                  LOADING ALUMNI…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center tag-mono">
                  NO ALUMNI FOUND
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr
                  key={a._id}
                  className="border-b border-line last:border-b-0 hover:bg-ink transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 border border-line flex items-center justify-center font-display text-sm text-ivory group-hover:border-acid group-hover:bg-acid group-hover:text-acid-ink transition-colors shrink-0">
                        {a.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <span className="font-bold text-sm text-ivory">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-acid">{a.role}</td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-ivory font-bold">@{a.company}</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-muted">
                    '{a.batch.slice(-2)} BATCH • {a.city}
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(a)}
                      className="p-1.5 border border-line text-ivory-2 hover:text-acid hover:border-acid transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => a._id && handleDelete(a._id, a.name)}
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
                <div className="tag-mono-acid">// {editingId ? 'EDIT ALUMNI' : 'NEW GRADUATE'}</div>
                <h2 className="display text-2xl text-ivory mt-1">
                  {editingId ? formData.name : 'ADD ALUMNI PROFILE'}
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
                <label className="tag-mono block mb-1.5">FULL NAME *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Nikhil Patel"
                  className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="tag-mono block mb-1.5">ROLE / POSITION *</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. SOFTWARE ENGINEER"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="tag-mono block mb-1.5">COMPANY *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. GOOGLE"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none uppercase font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="tag-mono block mb-1.5">BATCH YEAR *</label>
                  <input
                    type="text"
                    required
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    placeholder="e.g. 2021"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="tag-mono block mb-1.5">CITY / LOCATION</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. BENGALURU"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="tag-mono block mb-1.5">LINKEDIN URL</label>
                <input
                  type="url"
                  value={formData.linkedin || ''}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-line">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-acid flex-1 justify-center"
                >
                  {saving ? 'SAVING…' : editingId ? 'UPDATE PROFILE' : 'SAVE ALUMNI'}
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
