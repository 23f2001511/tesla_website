'use client';

import { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Calendar, Plus, RefreshCw, Search, MapPin, Clock,
  ChevronDown, ChevronUp, Eye, Trash2, CheckCircle2,
  AlertCircle, BarChart3, Star, X, Check, Ban,
  Bell, User, FileText, Loader2, CalendarPlus, Inbox, Tag
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ClubEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  category: string;
  speaker: string;
  poster: string;
  seatLimit: number;
  isFeatured: boolean;

  approvalStatus: 'approved' | 'pending' | 'rejected';
  requestedBy: string | null;
  requestNote: string;
  isUpcoming: boolean;
}

interface EventsData {
  events: ClubEvent[];
  pendingRequests: ClubEvent[];
  rejectedEvents: ClubEvent[];
  stats: { total: number; upcoming: number; completed: number; featured: number; pendingCount: number };
  monthlyData: { name: string; events: number }[];
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Cover-image thumbnail with gradient fallback (keeps row height compact)
function Thumb({ src, alt, size = 56 }: { src?: string; alt: string; size?: number }) {
  return (
    <div
      className="rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-500/25 to-violet-500/15 border border-white/[0.08] flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <Calendar className="w-4 h-4 text-indigo-300/70" />
      )}
    </div>
  );
}

// ─── API ───────────────────────────────────────────────────────────────────────
async function fetchEventsData(): Promise<EventsData> {
  const res = await fetch('/api/admin/events', { cache: 'no-store' });
  if (!res.ok) throw new Error((await res.json()).error || 'Fetch failed');
  return res.json();
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

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-gray-200 font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#818cf8' }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

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

// ─── Add Event Modal Popup ─────────────────────────────────────────────────────
function AddEventModal({ onClose, onCreated, existingCategories }: { onClose: () => void; onCreated: () => void; existingCategories: string[] }) {
  const [form, setForm] = useState({
    title: '', description: '', date: '', venue: '',
    category: existingCategories[0] || 'Technical Workshop', speaker: '', seatLimit: '',
    isFeatured: false, newCategoryInput: ''
  });
  const [useCustomCategory, setUseCustomCategory] = useState(existingCategories.length === 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    const finalCategory = useCustomCategory ? form.newCategoryInput.trim() : form.category;
    
    if (!form.title || !form.description || !form.date || !form.venue || !finalCategory) {
      setError('Please fill all required blocks.'); return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...form, 
          category: finalCategory,
          seatLimit: Number(form.seatLimit) || 0 
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Creation engine anomaly occurred');
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Backdrop onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <CalendarPlus className="w-4 h-4 text-indigo-400" />
              </div>
              <h2 className="text-sm font-bold text-white">Create New Event</h2>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Event Title *</label>
              <input
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500"
                placeholder="e.g. GitHappens Hackathon"
                value={form.title} onChange={e => set('title', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Description *</label>
              <textarea
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500 resize-none"
                placeholder="What's this event about?"
                value={form.description} onChange={e => set('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Date & Time *</label>
                <input
                  type="datetime-local"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none [color-scheme:dark]"
                  value={form.date} onChange={e => set('date', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Venue *</label>
                <input
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none"
                  placeholder="e.g. Mechanical Seminar Hall, NITP"
                  value={form.venue} onChange={e => set('venue', e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs text-gray-400 font-medium">Category Domain *</label>
                {existingCategories.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setUseCustomCategory(!useCustomCategory)} 
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    {useCustomCategory ? 'Choose Existing' : 'Create Custom Type'}
                  </button>
                )}
              </div>
              
              {useCustomCategory ? (
                <input
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500"
                  placeholder="e.g. Hackathon Drive, Core Workshop"
                  value={form.newCategoryInput} onChange={e => set('newCategoryInput', e.target.value)}
                />
              ) : (
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none pr-8"
                    value={form.category} onChange={e => set('category', e.target.value)}
                  >
                    {existingCategories.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Speaker / Mentor</label>
                <input
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none"
                  placeholder="e.g. Senior Alumnus"
                  value={form.speaker} onChange={e => set('speaker', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Seat Limit</label>
                <input
                  type="number" min="0"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none"
                  placeholder="0 = unlimited"
                  value={form.seatLimit} onChange={e => set('seatLimit', e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button" onClick={() => set('isFeatured', !form.isFeatured)}
                className="flex items-center gap-2.5 cursor-pointer select-none"
              >
                <div className={`w-9 h-5 rounded-full transition-colors relative ${form.isFeatured ? 'bg-indigo-500' : 'bg-white/10'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.isFeatured ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-xs text-gray-400">Mark as Featured Event</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]">Cancel</button>
            <button
              onClick={submit} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {loading ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ─── Request Review & Action Modal ───────────────────────────────────────────
function RequestModal({
  event, onClose, onAction,
}: {
  event: ClubEvent;
  onClose: () => void;
  onAction: (id: string, action: 'approve' | 'reject') => Promise<void>;
}) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);

  const handle = async (action: 'approve' | 'reject') => {
    setLoading(action);
    await onAction(event.id, action);
    setLoading(null);
    onClose();
  };

  return (
    <>
      <Backdrop onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Inbox className="w-4 h-4 text-amber-400" />
              </div>
              <h2 className="text-sm font-bold text-white">Review Event Request</h2>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white font-semibold text-base leading-tight">{event.title}</p>
                <p className="text-gray-500 text-xs mt-1">Status: Pending Admin Authorization</p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">{event.category}</span>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 font-medium mb-1">Description</p>
              <p className="text-sm text-gray-300 leading-relaxed">{event.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Clock, label: 'Date & Time', value: `${fmtDate(event.date)} · ${fmtTime(event.date)}` },
                { icon: MapPin, label: 'Venue', value: event.venue },
                { icon: User, label: 'Speaker', value: event.speaker || '—' },
                { icon: Star, label: 'Seats', value: event.seatLimit ? `${event.seatLimit} seats` : 'Unlimited' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3 text-gray-500" />
                    <p className="text-[0.65rem] text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                  </div>
                  <p className="text-xs text-gray-200 font-medium">{value}</p>
                </div>
              ))}
            </div>

            {event.requestNote && (
              <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-3 h-3 text-amber-400" />
                  <p className="text-[0.65rem] text-amber-400 font-medium uppercase tracking-wide">Request Note</p>
                </div>
                <p className="text-xs text-amber-200/80 leading-relaxed">{event.requestNote}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.06]">
            <button
              onClick={() => handle('reject')} disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all disabled:opacity-50"
            >
              {loading === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
              Reject Request
            </button>
            <button
              onClick={() => handle('approve')} disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all disabled:opacity-50"
            >
              {loading === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Approve & Publish
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ─── View Event Details Modal ──────────────────────────────────────────────────
function ViewEventModal({ event, onClose }: { event: ClubEvent; onClose: () => void }) {
  return (
    <>
      <Backdrop onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Eye className="w-4 h-4 text-indigo-400" />
              </div>
              <h2 className="text-sm font-bold text-white">Event Details</h2>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white font-semibold text-base">{event.title}</p>
                {event.isFeatured && (
                  <span className="inline-flex items-center gap-1 text-[0.65rem] text-amber-400 mt-1">
                    <Star className="w-3 h-3 fill-amber-400" /> Featured Event
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">{event.category}</span>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 font-medium mb-1">Description</p>
              <p className="text-sm text-gray-300 leading-relaxed">{event.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Clock, label: 'Date & Time', value: `${fmtDate(event.date)} · ${fmtTime(event.date)}` },
                { icon: MapPin, label: 'Venue', value: event.venue },
                { icon: User, label: 'Speaker', value: event.speaker || '—' },
                { icon: Star, label: 'Seats limit', value: event.seatLimit ? `${event.seatLimit} seats` : 'Unlimited' },
                { icon: CheckCircle2, label: 'Timeline', value: event.isUpcoming ? 'Upcoming' : 'Completed' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3 text-gray-500" />
                    <p className="text-[0.65rem] text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                  </div>
                  <p className="text-xs text-gray-200 font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end px-6 py-4 border-t border-white/[0.06]">
            <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]">
              Close View
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ─── Event Table Row ───────────────────────────────────────────────────────────
const EventRow = memo(function EventRow({
  event, index, onView, onDelete, onToggleFeatured,
}: {
  event: ClubEvent; index: number;
  onView: (e: ClubEvent) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, isFeatured: boolean) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/events?id=${event.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      onDelete(event.id);
    } catch { alert('Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
      transition={{ delay: 0.03 * index, duration: 0.28 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="transition-colors text-xs text-gray-300"
      style={{ background: hovered ? 'rgba(255,255,255,0.02)' : 'transparent' }}
    >
      <td className="px-4 py-2 align-middle border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <Thumb src={event.poster} alt={event.title} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-gray-100 truncate max-w-[180px]">{event.title}</span>
              {event.isFeatured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 max-w-[200px] truncate">{event.description}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-2 align-middle border-b border-white/[0.04]">
        <p className="text-[13px] text-gray-300">{fmtDate(event.date)}</p>
        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
          <Clock className="w-2.5 h-2.5" />{fmtTime(event.date)}
        </p>
      </td>
      <td className="px-4 py-2 align-middle border-b border-white/[0.04]">
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">{event.category}</span>
      </td>
      
      <td className="px-4 py-2 align-middle border-b border-white/[0.04]">
        <span className={`inline-flex items-center gap-1.5 text-[0.7rem] font-semibold px-2.5 py-1 rounded-full border ${
          event.isUpcoming
            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
            : 'bg-violet-500/10 text-violet-400 border-violet-500/25'
        }`}>
          {event.isUpcoming ? <Clock className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
          {event.isUpcoming ? 'Upcoming' : 'Completed'}
        </span>
      </td>
      <td className="px-4 py-2 align-middle border-b border-white/[0.04]">
        <p className="text-[13px] text-gray-300">{event.speaker || '—'}</p>
        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
          <MapPin className="w-2.5 h-2.5" />{event.venue}
        </p>
      </td>
      <td className="px-4 py-2 align-middle border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          <button
            title="View" onClick={() => onView(event)}
            className="w-7 h-7 rounded-lg border border-white/[0.07] text-gray-500 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-400 flex items-center justify-center transition-all cursor-pointer"
          ><Eye className="w-3 h-3" /></button>
          {event.approvalStatus === 'approved' && (
            <button
              title={event.isFeatured ? 'Remove Featured' : 'Mark Featured'}
              onClick={() => onToggleFeatured(event.id, !event.isFeatured)}
              className={`w-7 h-7 rounded-lg border border-white/[0.07] flex items-center justify-center transition-all cursor-pointer ${event.isFeatured ? 'text-amber-400 bg-amber-500/10' : 'text-gray-500 hover:text-amber-400 hover:bg-amber-500/10'}`}
            ><Star className={`w-3 h-3 ${event.isFeatured ? 'fill-amber-400' : ''}`} /></button>
          )}
          <button
            title="Delete" onClick={handleDelete} disabled={deleting}
            className={`w-7 h-7 rounded-lg border border-white/[0.07] text-red-400 hover:bg-red-500/10 hover:border-red-500/30 flex items-center justify-center transition-all ${deleting ? 'opacity-40 cursor-wait' : 'cursor-pointer'}`}
          >{deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}</button>
        </div>
      </td>
    </motion.tr>
  );
});

// ─── Main Admin Module Dashboard Page ──────────────────────────────────────────
export default function AdminEventsPage() {
  const [data, setData] = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [viewEvent, setViewEvent] = useState<ClubEvent | null>(null);
  const [reviewRequest, setReviewRequest] = useState<ClubEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'pending'>('all');
  const [expanded, setExpanded] = useState(false);
  const lastFetch = useRef(0);
  const ROW_LIMIT = 8;
  const prefersReducedMotion = useReducedMotion();

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const d = await fetchEventsData();
      setData(d);
      setError('');
      setLastUpdated(new Date());
      lastFetch.current = Date.now();
    } catch (e: any) {
      setError(e.message || 'Failed to load database contents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const t = setInterval(() => loadData(true), 60_000);
    const onFocus = () => { if (Date.now() - lastFetch.current > 30_000) loadData(true); };
    const onVis = () => { if (document.visibilityState === 'visible') onFocus(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVis); };
  }, [loadData]);

  const handleApproveReject = useCallback(async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        await loadData(true);
      } else {
        alert('Action execution error from server handler');
      }
    } catch {
      alert('Action failed');
    }
  }, [loadData]);

  const handleDeleteEvent = useCallback((id: string) => {
    setData(prev => prev ? {
      ...prev,
      events: prev.events.filter(e => e.id !== id),
      pendingRequests: prev.pendingRequests.filter(e => e.id !== id),
      rejectedEvents: prev.rejectedEvents.filter(e => e.id !== id),
    } : prev);
  }, []);

  const handleToggleFeatured = useCallback(async (id: string, isFeatured: boolean) => {
    // Optimistic update
    setData(prev => prev ? { ...prev, events: prev.events.map(e => e.id === id ? { ...e, isFeatured } : e) } : prev);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isFeatured }),
      });
      if (res.ok) await loadData(true);
      else { await loadData(true); alert('Failed to update featured state'); }
    } catch { await loadData(true); }
  }, [loadData]);

  // Compute categories array purely dynamically based on database entries pool
  const categories = useMemo(() => {
    if (!data) return [];
    const allCats = [...data.events, ...data.pendingRequests, ...data.rejectedEvents].map(e => e.category).filter(Boolean);
    return Array.from(new Set(allCats));
  }, [data]);

  const applyFilter = useCallback((list: ClubEvent[]) => {
    const q = search.toLowerCase();
    return list.filter(e => {
      const mQ = !q || e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) || e.speaker.toLowerCase().includes(q);
      const mC = catFilter === 'All' || e.category === catFilter;
      return mQ && mC;
    });
  }, [search, catFilter]);

  const featuredEvents = useMemo(() => data ? data.events.filter(e => e.isFeatured) : [], [data]);

  // Rows shown in the table tab (All = every event, Published = approved, Pending = pending)
  const tableEvents = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'published') return applyFilter(data.events);
    if (activeTab === 'pending')   return applyFilter(data.pendingRequests);
    return applyFilter([...data.events, ...data.pendingRequests, ...data.rejectedEvents]);
  }, [data, activeTab, applyFilter]);

  const visibleEvents = expanded ? tableEvents : tableEvents.slice(0, ROW_LIMIT);

  const selectTab = (tab: 'all' | 'published' | 'pending') => { setActiveTab(tab); setExpanded(false); };

  // Compute analytical metric datasets dynamically on active domain rows
  const dynamicCategoryChartData = useMemo(() => {
    if (!data) return [];
    const countsMap: Record<string, number> = {};
    categories.forEach(c => { countsMap[c] = 0; });
    data.events.forEach(e => { if (countsMap[e.category] !== undefined) countsMap[e.category]++; });
    return Object.entries(countsMap).map(([name, count]) => ({ name, count }));
  }, [data, categories]);

  const statCards = useMemo(() => !data ? [] : [
    { label: 'Total Events', value: data.stats.total,    color: '#6366f1', Icon: Calendar },
    { label: 'Upcoming',     value: data.stats.upcoming,  color: '#818cf8', Icon: Clock },
    { label: 'Completed',    value: data.stats.completed, color: '#a78bfa', Icon: CheckCircle2 },
    { label: 'Featured',     value: data.stats.featured,  color: '#fbbf24', Icon: Star },
  ], [data]);

  if (loading) return (
    <div className="p-6 space-y-4"><Skeleton className="h-36" /><div className="grid grid-cols-4 gap-4"><Skeleton className="h-24 w-full" /></div></div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-6">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-red-400 font-semibold">Events couldn't load</p>
      <p className="text-gray-500 text-sm max-w-xs">{error}</p>
      <button onClick={() => loadData()} className="mt-2 px-5 py-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 text-sm font-medium hover:bg-indigo-500/25 transition-colors">Try again</button>
    </div>
  );

  const hasMonthly = data.monthlyData?.some(d => d.events > 0);

  return (
    <div className="p-5 space-y-5">
      <AnimatePresence mode="wait">
        {showAdd && (
          <AddEventModal onClose={() => setShowAdd(false)} onCreated={() => loadData(true)} existingCategories={categories} />
        )}
        {viewEvent && (
          <ViewEventModal event={viewEvent} onClose={() => setViewEvent(null)} />
        )}
        {reviewRequest && (
          <RequestModal event={reviewRequest} onClose={() => setReviewRequest(null)} onAction={handleApproveReject} />
        )}
      </AnimatePresence>

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.07] px-7 py-6">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Event Management</h1>
            </div>
            <p className="text-gray-400 text-sm">Manage club events · approve requests · track registrations</p>
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
            {data.stats.pendingCount > 0 && (
              <button onClick={() => setActiveTab('pending')} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all"><Bell className="w-3.5 h-3.5" />{data.stats.pendingCount} pending</button>
            )}
            <button onClick={() => loadData(true)} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:text-gray-200 text-sm font-medium transition-all"><RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25"><Plus className="w-3.5 h-3.5" />Add Event</button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="relative overflow-hidden bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 border" style={{ background: `${s.color}20`, borderColor: `${s.color}40` }}><s.Icon style={{ color: s.color, width: 16, height: 16 }} /></div>
            <p className="text-[26px] font-extrabold text-white tracking-tight leading-none"><AnimatedNumber value={s.value} /></p>
            <p className="text-xs text-gray-500 mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-100 mb-4">Events Activity</h3>
          {!hasMonthly ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2"><BarChart3 className="w-8 h-8 text-gray-700" /><p className="text-xs text-gray-600">No stream entries logged</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data.monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs><linearGradient id="gEv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="events" stroke="#6366f1" fill="url(#gEv)" strokeWidth={2} name="Events" isAnimationActive={!prefersReducedMotion} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-100 mb-4">By Custom Categories</h3>
          {dynamicCategoryChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-gray-600"><Tag className="w-6 h-6 mb-1 mx-auto" />No categories detected.</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dynamicCategoryChartData} margin={{ top: 4, right: 4, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={9} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} name="EventsCount" isAnimationActive={!prefersReducedMotion} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h3 className="text-sm font-bold text-gray-100">Featured Events</h3>
            <span className="text-[11px] text-gray-500">({featuredEvents.length})</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {featuredEvents.map(ev => (
              <div key={ev.id} className="flex gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 hover:border-amber-500/30 transition-all">
                <Thumb src={ev.poster} alt={ev.title} size={104} />
                <div className="min-w-0 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-100 line-clamp-2">{ev.title}</p>
                    <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"><Star className="w-2.5 h-2.5 fill-amber-400" /> Featured</span>
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold mt-1">{ev.category}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {fmtDate(ev.date)}</span>
                    <span className="flex items-center gap-1 truncate"><MapPin className="w-2.5 h-2.5" /> {ev.venue}</span>
                    <span className="flex items-center gap-1 truncate"><User className="w-2.5 h-2.5" /> {ev.speaker || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-auto pt-2">
                    <button onClick={() => setViewEvent(ev)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[11px] text-gray-300 hover:text-white transition-colors">
                      <Eye className="w-3 h-3" /> View
                    </button>
                    <button onClick={() => handleToggleFeatured(ev.id, false)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 hover:bg-amber-500/15 transition-colors">
                      <Star className="w-3 h-3 fill-amber-400" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables Lists */}
      <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-5 pt-4">
          <div className="flex gap-2">
            <button onClick={() => selectTab('all')} className={`pb-3 text-sm font-semibold border-b-2 px-2 transition-all ${activeTab === 'all' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>All Events ({data.events.length + data.pendingRequests.length + data.rejectedEvents.length})</button>
            <button onClick={() => selectTab('published')} className={`pb-3 text-sm font-semibold border-b-2 px-2 transition-all ${activeTab === 'published' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Published ({data.events.length})</button>
            <button onClick={() => selectTab('pending')} className={`pb-3 text-sm font-semibold border-b-2 px-2 transition-all ${activeTab === 'pending' ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Pending ({data.pendingRequests.length})</button>
          </div>

          {activeTab !== 'pending' && (
            <div className="flex items-center gap-2 pb-2">
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5">
                <Search className="w-3 h-3 text-gray-600" />
                <input className="bg-transparent text-gray-200 text-xs outline-none w-36 placeholder-gray-600" placeholder="Search fields…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="relative">
                <select className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-gray-400 px-3 py-1.5 pr-7 outline-none cursor-pointer" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                  <option value="All">All Categories</option>
                  {categories.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {activeTab !== 'pending' && (
          <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.01] text-[10px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {['Event info', 'Timeline schedule', 'Category tag', 'State status', 'Speaker allocation', 'Actions panel'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {visibleEvents.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-14 text-xs text-gray-600">No events data records found.</td></tr>
                ) : (
                  <AnimatePresence mode="popLayout">{visibleEvents.map((ev, i) => <EventRow key={ev.id} event={ev} index={i} onView={e => setViewEvent(e)} onDelete={handleDeleteEvent} onToggleFeatured={handleToggleFeatured} />)}</AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
          {tableEvents.length > ROW_LIMIT && (
            <div className="flex justify-center py-3 border-t border-white/[0.04]">
              <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-gray-400 hover:text-gray-200 transition-all">
                {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> See Less</> : <><ChevronDown className="w-3.5 h-3.5" /> See More ({tableEvents.length - ROW_LIMIT})</>}
              </button>
            </div>
          )}
          </>
        )}

        {activeTab === 'pending' && (
          <div className="p-5">
            {data.pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-2 text-center text-xs text-gray-500"><Inbox className="w-8 h-8 text-gray-700" /><p className="text-sm text-gray-600 font-medium">No pending requests</p></div>
            ) : (
              <div className="space-y-3">
                {data.pendingRequests.map((req) => (
                  <div key={req.id} className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/30 rounded-xl p-4 transition-all">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0"><Calendar className="w-4 h-4 text-amber-400" /></div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-100 truncate">{req.title}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">{req.category}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {fmtDate(req.date)} · {fmtTime(req.date)}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {req.venue}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setReviewRequest(req)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs text-gray-300 hover:text-white"><Eye className="w-3 h-3" /> Inspect View</button>
                      <button onClick={() => handleApproveReject(req.id, 'reject')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400"><Ban className="w-3 h-3" /> Reject</button>
                      <button onClick={() => handleApproveReject(req.id, 'approve')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400"><Check className="w-3 h-3" /> Approve</button>
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