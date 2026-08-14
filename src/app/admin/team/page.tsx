'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Check, X, Users, RefreshCw } from 'lucide-react';

interface Member {
  _id?: string;
  name: string;
  role: string;
  category: 'Core' | 'Executive' | 'Faculty';
  tag: string;
  avatar?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  email?: string;
  order: number;
}

const defaultMember: Member = {
  name: '',
  role: '',
  category: 'Core',
  tag: 'MEM',
  avatar: '',
  bio: '',
  linkedin: '',
  github: '',
  email: '',
  order: 0,
};

export default function AdminTeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Member>(defaultMember);
  const [saving, setSaving] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/team');
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(defaultMember);
    setModalOpen(true);
  };

  const handleOpenEdit = (member: Member) => {
    setEditingId(member._id || null);
    setFormData(member);
    setModalOpen(true);
  };

  const handleRoleChange = (role: string) => {
    const tag = role
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase() || 'MEM';
    setFormData((prev) => ({ ...prev, role, tag: prev.tag === 'MEM' || !prev.tag ? tag : prev.tag }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) {
      alert('Name and Role are required.');
      return;
    }

    try {
      setSaving(true);
      const url = editingId ? `/api/admin/team/${editingId}` : '/api/admin/team';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchMembers();
      } else {
        alert('Save failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error saving member: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the roster?`)) return;

    try {
      const res = await fetch(`/api/admin/team/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.filter((m) => m._id !== id));
      } else {
        alert('Delete failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error deleting member: ' + err.message);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesCategory = categoryFilter === 'All' || m.category === categoryFilter;
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      m.tag.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="tag-mono-acid mb-1">// PEOPLE & ROSTER</div>
          <h1 className="display text-3xl sm:text-4xl text-ivory">TEAM MANAGEMENT</h1>
          <p className="text-xs sm:text-sm text-ivory-2 mt-1">
            Manage core officers, leads, executives, and faculty advisors displayed on /team.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchMembers} className="btn-brut text-xs py-2 px-3">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleOpenAdd} className="btn-acid text-xs py-2.5 px-4">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-ink-2 p-3 border border-line">
        <div className="flex flex-wrap gap-2">
          {['All', 'Core', 'Executive', 'Faculty'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 font-mono text-[11px] uppercase border transition-colors ${
                categoryFilter === cat
                  ? 'border-acid bg-acid text-acid-ink font-bold'
                  : 'border-line text-ivory-2 hover:border-line-2 hover:text-ivory'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="SEARCH ROSTER..."
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
              <th className="tag-mono px-5 py-3 font-normal">MEMBER</th>
              <th className="tag-mono px-5 py-3 font-normal">ROLE</th>
              <th className="tag-mono px-5 py-3 font-normal">CATEGORY</th>
              <th className="tag-mono px-5 py-3 font-normal">TAG</th>
              <th className="tag-mono px-5 py-3 font-normal text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center tag-mono">
                  LOADING TEAM ROSTER…
                </td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center tag-mono">
                  NO MEMBERS FOUND
                </td>
              </tr>
            ) : (
              filteredMembers.map((m) => (
                <tr
                  key={m._id}
                  className="border-b border-line last:border-b-0 hover:bg-ink transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 border border-line-2 flex items-center justify-center font-display text-sm text-ivory group-hover:border-acid group-hover:bg-acid group-hover:text-acid-ink transition-colors shrink-0">
                        {m.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-ivory">{m.name}</div>
                        {m.email && <div className="text-[11px] font-mono text-muted">{m.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-ivory-2">{m.role}</td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-[10px] tracking-wider uppercase border border-line px-2 py-0.5 text-ivory-2">
                      {m.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-acid">[{m.tag}]</td>
                  <td className="px-5 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="p-1.5 border border-line text-ivory-2 hover:text-acid hover:border-acid transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => m._id && handleDelete(m._id, m.name)}
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-ink-2 border border-line corner-marks w-full max-w-lg p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <div className="tag-mono-acid">// {editingId ? 'EDIT MEMBER' : 'NEW ROSTER ENTRY'}</div>
                <h2 className="display text-2xl text-ivory mt-1">
                  {editingId ? formData.name : 'ADD TEAM MEMBER'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="tag-mono block mb-1.5">FULL NAME *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Aarav Mehta"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="tag-mono block mb-1.5">ROLE / DESIGNATION *</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    placeholder="e.g. Technical Lead"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="tag-mono block mb-1.5">CATEGORY</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as 'Core' | 'Executive' | 'Faculty',
                      })
                    }
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none appearance-none"
                  >
                    <option value="Core">Core</option>
                    <option value="Executive">Executive</option>
                    <option value="Faculty">Faculty</option>
                  </select>
                </div>

                <div>
                  <label className="tag-mono block mb-1.5">TAG (3 CHARS)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formData.tag}
                    onChange={(e) =>
                      setFormData({ ...formData, tag: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. TEC"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-acid font-mono focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="tag-mono block mb-1.5">EMAIL (OPTIONAL)</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@college.edu"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="tag-mono block mb-1.5">SORT PRIORITY</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="tag-mono block mb-1.5">LINKEDIN URL (OPTIONAL)</label>
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
                  {saving ? 'SAVING…' : editingId ? 'UPDATE MEMBER' : 'SAVE TO ROSTER'}
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
