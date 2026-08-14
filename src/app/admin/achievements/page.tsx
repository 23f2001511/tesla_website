'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Trophy, RefreshCw, X, CheckCircle } from 'lucide-react';

interface AchievementItem {
  _id?: string;
  title: string;
  category: string;
  year: string;
  description?: string;
  verified: boolean;
  order: number;
}

const defaultAchievement: AchievementItem = {
  title: '',
  category: 'HACKATHON',
  year: '2025',
  description: '',
  verified: true,
  order: 0,
};

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AchievementItem>(defaultAchievement);
  const [saving, setSaving] = useState(false);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/achievements');
      const data = await res.json();
      if (data.success) {
        setAchievements(data.achievements || []);
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(defaultAchievement);
    setModalOpen(true);
  };

  const handleOpenEdit = (a: AchievementItem) => {
    setEditingId(a._id || null);
    setFormData(a);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.year) {
      alert('Title and Year are required.');
      return;
    }

    try {
      setSaving(true);
      const url = editingId ? `/api/admin/achievements/${editingId}` : '/api/admin/achievements';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchAchievements();
      } else {
        alert('Save failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error saving achievement: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete win "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/achievements/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAchievements((prev) => prev.filter((a) => a._id !== id));
      } else {
        alert('Delete failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error deleting achievement: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="tag-mono-acid mb-1">// TROPHY CABINET</div>
          <h1 className="display text-3xl sm:text-4xl text-ivory">ACHIEVEMENTS & WINS</h1>
          <p className="text-xs sm:text-sm text-ivory-2 mt-1">
            Manage club competition victories, national hackathon wins, and awards shown on /achievements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchAchievements} className="btn-brut text-xs py-2 px-3">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleOpenAdd} className="btn-acid text-xs py-2.5 px-4">
            <Plus className="w-4 h-4" /> Add Achievement
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-line overflow-x-auto bg-ink-2">
        <table className="w-full text-left min-w-[650px]">
          <thead>
            <tr className="border-b border-line bg-ink">
              <th className="tag-mono px-5 py-3 font-normal">YEAR</th>
              <th className="tag-mono px-5 py-3 font-normal">AWARD / WIN TITLE</th>
              <th className="tag-mono px-5 py-3 font-normal">CATEGORY</th>
              <th className="tag-mono px-5 py-3 font-normal">STATUS</th>
              <th className="tag-mono px-5 py-3 font-normal text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center tag-mono">
                  LOADING ACHIEVEMENTS…
                </td>
              </tr>
            ) : achievements.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center tag-mono">
                  NO ACHIEVEMENTS RECORDED
                </td>
              </tr>
            ) : (
              achievements.map((a) => (
                <tr
                  key={a._id}
                  className="border-b border-line last:border-b-0 hover:bg-ink transition-colors group"
                >
                  <td className="px-5 py-4">
                    <span className="display text-xl text-acid font-bold">'{a.year.slice(-2)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-sm text-ivory group-hover:text-acid transition-colors">
                      {a.title}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-[10px] tracking-wider uppercase border border-line px-2 py-0.5 text-ivory-2">
                      {a.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="tag-mono-acid flex items-center gap-1 text-[10px]">
                      <CheckCircle className="w-3.5 h-3.5 text-acid" /> VERIFIED
                    </span>
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
                      onClick={() => a._id && handleDelete(a._id, a.title)}
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
                <div className="tag-mono-acid">// {editingId ? 'EDIT TROPHY' : 'NEW VICTORY'}</div>
                <h2 className="display text-2xl text-ivory mt-1">
                  {editingId ? formData.title : 'ADD ACHIEVEMENT'}
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
                <label className="tag-mono block mb-1.5">AWARD / WIN TITLE *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 1st Prize — Smart India Hackathon"
                  className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="tag-mono block mb-1.5">CATEGORY</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. HACKATHON, ROBOTICS"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="tag-mono block mb-1.5">YEAR *</label>
                  <input
                    type="text"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="e.g. 2025"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-line">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-acid flex-1 justify-center"
                >
                  {saving ? 'SAVING…' : editingId ? 'UPDATE WIN' : 'RECORD WIN'}
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
