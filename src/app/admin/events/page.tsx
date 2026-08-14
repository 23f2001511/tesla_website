'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Search, RefreshCw, X, Check } from 'lucide-react';

interface EventItem {
  _id?: string;
  title: string;
  category: 'workshop' | 'hackathon' | 'talk' | 'bootcamp' | 'hands-on lab' | 'competition';
  date: string;
  time: string;
  venue: string;
  description?: string;
  status: 'upcoming' | 'past';
  registrationLink?: string;
  isFeatured: boolean;
  order: number;
}

const defaultEvent: EventItem = {
  title: '',
  category: 'workshop',
  date: '',
  time: '10:00 — 16:00',
  venue: 'Lab 1, CSE Block',
  description: '',
  status: 'upcoming',
  registrationLink: '',
  isFeatured: true,
  order: 0,
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventItem>(defaultEvent);
  const [saving, setSaving] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(defaultEvent);
    setModalOpen(true);
  };

  const handleOpenEdit = (event: EventItem) => {
    setEditingId(event._id || null);
    setFormData(event);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.venue) {
      alert('Title, Date, and Venue are required.');
      return;
    }

    try {
      setSaving(true);
      const url = editingId ? `/api/admin/events/${editingId}` : '/api/admin/events';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchEvents();
      } else {
        alert('Save failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error saving event: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete event "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => prev.filter((e) => e._id !== id));
      } else {
        alert('Delete failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error deleting event: ' + err.message);
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesTab = activeTab === 'all' || e.status === activeTab;
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="tag-mono-acid mb-1">// SCHEDULE & CALENDAR</div>
          <h1 className="display text-3xl sm:text-4xl text-ivory">EVENTS MANAGEMENT</h1>
          <p className="text-xs sm:text-sm text-ivory-2 mt-1">
            Publish workshops, hackathons, guest lectures, and manage homepage feature highlights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchEvents} className="btn-brut text-xs py-2 px-3">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleOpenAdd} className="btn-acid text-xs py-2.5 px-4">
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-ink-2 p-3 border border-line">
        <div className="flex gap-2">
          {(['all', 'upcoming', 'past'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 font-mono text-[11px] uppercase border transition-colors ${
                activeTab === tab
                  ? 'border-acid bg-acid text-acid-ink font-bold'
                  : 'border-line text-ivory-2 hover:border-line-2 hover:text-ivory'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="SEARCH EVENTS..."
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
              <th className="tag-mono px-5 py-3 font-normal">EVENT TITLE</th>
              <th className="tag-mono px-5 py-3 font-normal">CATEGORY</th>
              <th className="tag-mono px-5 py-3 font-normal">DATE & TIME</th>
              <th className="tag-mono px-5 py-3 font-normal">VENUE</th>
              <th className="tag-mono px-5 py-3 font-normal">STATUS</th>
              <th className="tag-mono px-5 py-3 font-normal text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center tag-mono">
                  LOADING EVENTS…
                </td>
              </tr>
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center tag-mono">
                  NO EVENTS FOUND
                </td>
              </tr>
            ) : (
              filteredEvents.map((event) => (
                <tr
                  key={event._id}
                  className="border-b border-line last:border-b-0 hover:bg-ink transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="font-bold text-sm text-ivory group-hover:text-acid transition-colors">
                      {event.title}
                    </div>
                    {event.isFeatured && (
                      <span className="tag-mono-acid text-[9px] block mt-0.5">
                        ★ HOMEPAGE FEATURED
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-[10px] tracking-wider uppercase border border-line px-2 py-0.5 text-acid">
                      {event.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-ivory-2">
                    <div>{event.date}</div>
                    <div className="text-muted text-[10px]">{event.time}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-muted">{event.venue}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${
                        event.status === 'upcoming'
                          ? 'border-green-500/40 text-green-400 bg-green-500/10'
                          : 'border-line text-muted bg-ink'
                      }`}
                    >
                      {event.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(event)}
                      className="p-1.5 border border-line text-ivory-2 hover:text-acid hover:border-acid transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => event._id && handleDelete(event._id, event.title)}
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-ink-2 border border-line corner-marks w-full max-w-lg p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <div className="tag-mono-acid">// {editingId ? 'EDIT EVENT' : 'CREATE EVENT'}</div>
                <h2 className="display text-2xl text-ivory mt-1">
                  {editingId ? formData.title : 'ADD NEW EVENT'}
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
                <label className="tag-mono block mb-1.5">EVENT TITLE *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Full-Stack Web Dev Bootcamp"
                  className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="tag-mono block mb-1.5">CATEGORY</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none appearance-none"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="talk">Tech Talk</option>
                    <option value="bootcamp">Bootcamp</option>
                    <option value="hands-on lab">Hands-on Lab</option>
                    <option value="competition">Competition</option>
                  </select>
                </div>

                <div>
                  <label className="tag-mono block mb-1.5">STATUS</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'upcoming' | 'past',
                      })
                    }
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none appearance-none"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past / Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="tag-mono block mb-1.5">DATE (DISPLAY FORMAT) *</label>
                  <input
                    type="text"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="e.g. 28 MAY 2026 or 28 OCT"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="tag-mono block mb-1.5">TIME</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="e.g. 10:00 — 16:00"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="tag-mono block mb-1.5">VENUE / LOCATION *</label>
                <input
                  type="text"
                  required
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g. Lab 1, CSE Block"
                  className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="tag-mono block mb-1.5">DESCRIPTION</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description for attendees..."
                  className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-ink border border-line">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 accent-[#d8ff3d]"
                />
                <label htmlFor="featured" className="text-xs font-mono text-ivory cursor-pointer">
                  Feature in homepage "WHAT'S NEXT" calendar strip
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-line">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-acid flex-1 justify-center"
                >
                  {saving ? 'SAVING…' : editingId ? 'UPDATE EVENT' : 'PUBLISH EVENT'}
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
