'use client';

import {
  Calendar, Bell, BellOff, MapPin, Clock, User,
  CheckCircle2, Eye, AlertCircle, CalendarDays,
  Mail, Smartphone, RefreshCw, Ticket, Plus, X,
  ChevronDown, Send, FileText, Timer, CalendarPlus,
  Loader2, Star, Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiEvent {
  id: string; title: string; description: string;
  date: string; rawDate: string; venue: string;
  category: string; speaker: string; poster: string;
  isFeatured: boolean; seats: number | null;
  gradient: string; icon: string;
}
interface CompletedEvent extends ApiEvent { attended: boolean; }
interface Proposal {
  id: string;
  title: string; 
  description: string;
  date: string; 
  venue: string;
  category: string;
  poster: string;
  speaker: string;
  isFeatured: boolean;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string; 
  requestNote: string; 
  adminRemarks: string;
}

// ─── Category colours ─────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'Web Dev':       'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'AI/ML':         'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'Robotics':      'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Hackathon':     'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Cybersecurity': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Design':        'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Workshop':      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Seminar':       'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Competition':   'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Social':        'bg-rose-500/20 text-rose-400 border-rose-500/30',
};
function catCls(cat: string) { return CAT_COLORS[cat] || 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'; }
function iconFor(cat: string) {
  return cat === 'AI/ML' ? '🧠'
       : cat === 'Robotics' ? '🤖'
       : cat === 'Hackathon' ? '⚡'
       : cat === 'Design' ? '🎨'
       : '💻';
}

const CATEGORIES = [
  'Web Dev','AI/ML','Robotics','Hackathon','Cybersecurity',
  'Design','Workshop','Seminar','Competition','Social',
];

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    published: { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', label: 'Published' },
    pending:   { cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25',       label: 'Pending'   },
    approved:  { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', label: 'Approved'  },
    rejected:  { cls: 'bg-red-500/15 text-red-400 border-red-500/25',             label: 'Rejected'  },
  };
  const m = map[status] || map['pending'];
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${m.cls}`}>{m.label}</span>;
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function Countdown({ rawDate }: { rawDate: string }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(rawDate).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Started'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [rawDate]);
  return <span className="font-mono text-indigo-300 font-bold">{remaining}</span>;
}

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <motion.button onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${on ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : 'bg-white/10 border border-white/10'}`}>
      <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md ${on ? 'bg-white left-[22px]' : 'bg-slate-500 left-0.5'}`} />
    </motion.button>
  );
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

// ─── Event cover — poster if available, gradient fallback ─────────────────────
function Cover({ poster, gradient, icon, height = 'h-44' }: {
  poster: string; gradient: string; icon: string; height?: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (poster && !imgError) {
    return (
      <div className={`relative ${height} overflow-hidden bg-black`}>
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div className={`relative ${height} overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span className="text-5xl">{icon}</span>
      </div>
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}

// ─── Input class ──────────────────────────────────────────────────────────────
const iCls = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500 transition-colors';

// ─── Proposal modal ───────────────────────────────────────────────────────────
const blankForm = { title:'', description:'', date:'', venue:'', category:'Workshop', speaker:'', seatLimit:'', poster:'', requestNote:'', newCategoryInput:'' };

function ProposalModal({ onClose, onSuccess, existingCategories }: {
  onClose: () => void; onSuccess: () => void; existingCategories: string[];
}) {
  const [form, setForm] = useState({ ...blankForm, category: existingCategories[0] || 'Workshop' });
  const [useCustom, setUseCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    const finalCategory = useCustom ? form.newCategoryInput.trim() : form.category;
    if (!form.title || !form.description || !form.date || !form.venue || !finalCategory) {
      setError('Please fill in all required fields.'); return;
    }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/dashboard/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, description: form.description, date: form.date,
          venue: form.venue, category: finalCategory, speaker: form.speaker,
          poster: form.poster, requestNote: form.requestNote,
          seatLimit: form.seatLimit ? Number(form.seatLimit) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) { onSuccess(); onClose(); }
      else setError(data.error || 'Failed to submit proposal.');
    } catch { setError('Network error. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <CalendarPlus className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Create Event Proposal</h2>
              <p className="text-[11px] text-slate-500">Reviewed by Admin / President / Office Bearer</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto" style={{ scrollbarWidth:'thin', scrollbarColor:'#1e293b transparent' }}>
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Event Title *</label>
            <input className={iCls} placeholder="e.g. Web Development Bootcamp 2026" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Description *</label>
            <textarea rows={3} className={iCls + ' resize-none'} placeholder="What's this event about?"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Date & Time *</label>
              <input type="datetime-local" className={iCls + ' [color-scheme:dark]'} value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Venue *</label>
              <input className={iCls} placeholder="e.g. Seminar Hall, Block A" value={form.venue} onChange={e => set('venue', e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs text-gray-400 font-medium">Category *</label>
              <button type="button" onClick={() => setUseCustom(!useCustom)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
                {useCustom ? '← Choose existing' : '+ Create custom'}
              </button>
            </div>
            {useCustom ? (
              <input className={iCls} placeholder="e.g. IoT, Blockchain, Open Source…"
                value={form.newCategoryInput} onChange={e => set('newCategoryInput', e.target.value)} />
            ) : (
              <div className="relative">
                <select className={iCls + ' appearance-none pr-8 cursor-pointer'}
                  value={form.category} onChange={e => set('category', e.target.value)}>
                  {existingCategories.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Speaker / Mentor</label>
              <input className={iCls} placeholder="Name of speaker" value={form.speaker} onChange={e => set('speaker', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Seat Limit</label>
              <input type="number" min="0" className={iCls} placeholder="0 = unlimited" value={form.seatLimit} onChange={e => set('seatLimit', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Cover Image URL</label>
            <input className={iCls} placeholder="https://… (poster/banner)" value={form.poster} onChange={e => set('poster', e.target.value)} />
            {form.poster && (
              <div className="mt-2 h-24 rounded-xl overflow-hidden border border-white/10">
                <img src={form.poster} alt="preview" className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Proposal Note</label>
            <textarea rows={2} className={iCls + ' resize-none'} placeholder="Why should this event be approved?"
              value={form.requestNote} onChange={e => set('requestNote', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 hover:bg-white/[0.05] transition-all">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {saving ? 'Submitting…' : 'Submit Proposal'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Read-only event details modal ────────────────────────────────────────────
function DetailsModal({ ev, onClose }: { ev: ApiEvent & { status?: string }; onClose: () => void }) {
  // Optional fields — rendered only when the API provides them.
  const creator = (ev as any).creator || (ev as any).createdBy || (ev as any).requestedByName || '';
  const registeredCount = (ev as any).registeredCount ?? (ev as any).registered;

  const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-2.5">
      <Icon className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
        <div className="text-sm text-slate-200 break-words">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Cover — reuses the same poster/gradient rules as the cards */}
        <div className="relative">
          <Cover poster={ev.poster} gradient={ev.gradient} icon={ev.icon} height="h-40" />
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-black/50 hover:bg-black/70 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-gray-300" />
          </button>
          <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
            {ev.isFeatured && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-500/30 text-amber-300 border-amber-400/30 backdrop-blur-sm flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-amber-300" /> Featured
              </span>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${catCls(ev.category)}`}>{ev.category}</span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth:'thin', scrollbarColor:'#1e293b transparent' }}>
          <h2 className="text-lg font-bold text-white">{ev.title}</h2>
          {ev.description && <p className="text-sm text-slate-400 leading-relaxed">{ev.description}</p>}

          <div className="grid grid-cols-2 gap-4 pt-1">
            <Row icon={FileText} label="Category" value={ev.category} />
            <Row icon={Clock}    label="Date"     value={ev.date} />
            <Row icon={MapPin}   label="Venue"    value={ev.venue} />
            <Row icon={User}     label="Speaker"  value={ev.speaker || '—'} />
            <Row icon={Ticket}   label="Seats Left" value={ev.seats !== null ? `${ev.seats}` : 'Unlimited'} />
            {ev.status && <Row icon={CheckCircle2} label="Approval Status" value={<StatusPill status={ev.status} />} />}
            {creator && <Row icon={User} label="Created By" value={creator} />}
            {registeredCount !== undefined && <Row icon={CheckCircle2} label="Registered" value={`${registeredCount} members`} />}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type EventTab = 'all' | 'featured' | 'approved' | 'pending' | 'rejected';

export default function DashboardEventsPage() {
  const [data,         setData]         = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [notifToggles, setNotifToggles] = useState({ push: true, email: true, whatsapp: false });
  const [reminders,    setReminders]    = useState<Record<string, boolean>>({});
  const [eventTab,     setEventTab]     = useState<EventTab>('all');
  const [proposalTab,  setProposalTab]  = useState<'all'|'pending'|'approved'|'rejected'>('all');
  const [detailEvent,  setDetailEvent]  = useState<(ApiEvent & { status?: string }) | null>(null);

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/dashboard/events');
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen text-sm text-slate-500 gap-2">
      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> Loading events…
    </div>
  );

  const upcoming:  ApiEvent[]       = data?.upcoming    || [];
  const completed: CompletedEvent[] = data?.completed   || [];
  const proposals: Proposal[]       = data?.myProposals || [];
  // Next upcoming event from DB (not from member's proposals)
  const nextEvent                   = data?.nextEvent   || null;
  const stats                       = data?.stats       || {};

  // All DB-approved/published events
  const allApproved = [...upcoming, ...completed];
  const featured    = allApproved.filter(e => e.isFeatured);

  // Member's own proposals as display cards
  const pendingCards  = proposals.filter(p => p.status === 'pending');
  const approvedCards = proposals.filter(p => p.status === 'approved');
  const rejectedCards = proposals.filter(p => p.status === 'rejected');

  // Tab → visible events
  const tabEvents: Record<EventTab, ApiEvent[]> = {
    all:      allApproved,
    featured: featured,
    approved: allApproved,
    pending:  pendingCards.map(p => ({
      id: p.id, 
      title: p.title, 
      description: p.description,
      date: p.date, 
      rawDate: '', 
      venue: p.venue, 
      category: p.category,
      speaker: p.speaker,
      poster: p.poster,
      isFeatured: p.isFeatured, 
      seats: null,
      gradient: 'from-slate-700 via-slate-600 to-slate-700', 
      icon: iconFor(p.category),
    })),
    rejected: rejectedCards.map(p => ({
      id: p.id, 
      title: p.title, 
      description: p.description,
      date: p.date, 
      rawDate: '', 
      venue: p.venue, 
      category: p.category,
      speaker: p.speaker,
      poster: p.poster,
      isFeatured: p.isFeatured, 
      seats: null,
      gradient: 'from-red-900 via-red-800 to-red-900', 
      icon: iconFor(p.category),
    })),
  };
  const visibleEvents = tabEvents[eventTab];

  const visibleProposals = proposalTab === 'all'
    ? proposals
    : proposals.filter(p => p.status === proposalTab);

  const existingCategories = Array.from(new Set([
    ...allApproved.map(e => e.category).filter(Boolean),
    ...CATEGORIES,
  ]));

  // Stats cards
  const statCards = [
    { label:'Total Events',    value: allApproved.length,          icon: CalendarDays, color:'from-blue-500/20 to-blue-600/10',      accent:'#3b82f6' },
    { label:'Approved',        value: allApproved.length,          icon: CheckCircle2, color:'from-emerald-500/20 to-emerald-600/10', accent:'#10b981' },
    { label:'Pending',         value: pendingCards.length,         icon: Timer,        color:'from-amber-500/20 to-amber-600/10',    accent:'#f59e0b' },
    { label:'Completed',       value: completed.length,            icon: Trophy,       color:'from-violet-500/20 to-violet-600/10',  accent:'#8b5cf6' },
    { label:'Featured',        value: featured.length,             icon: Star,         color:'from-pink-500/20 to-pink-600/10',      accent:'#ec4899' },
  ];

  return (
    <div className="min-h-screen pb-16 space-y-6 text-gray-100">

      {/* ── HEADER — single row ── */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute -top-20 -left-16 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-12 w-56 h-56 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative px-7 py-5 md:px-8">
          {/* Single row: title | next event | button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Title */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">My Events</h1>
                <p className="text-slate-400 text-xs mt-0.5">Browse approved events and submit proposals.</p>
              </div>
            </div>

            {/* Next event — grows to fill middle */}
            {nextEvent && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.07] flex-1 min-w-0">
                <Timer className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Next Event</p>
                  <p className="text-sm font-bold text-white truncate">{nextEvent.title}</p>
                  <p className="text-xs text-slate-400">{nextEvent.date} · Starts in <Countdown rawDate={nextEvent.rawDate} /></p>
                </div>
              </div>
            )}

            {/* CTA */}
            <motion.button onClick={() => setShowModal(true)} whileHover={{ y:-1 }} whileTap={{ scale:0.97 }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shrink-0 whitespace-nowrap"
              style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow:'0 4px 16px rgba(99,102,241,0.3)' }}>
              <Plus className="w-4 h-4" /> Create Event Proposal
            </motion.button>
          </div>
        </div>
      </GlassCard>

      {/* ── STATS — 5 cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.05*i}}>
            <GlassCard className="p-4 hover:border-white/10 transition-all h-full">
              <div className={`inline-flex w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} items-center justify-center mb-3`}>
                <s.icon className="w-4 h-4" style={{ color: s.accent }} />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* ── ALL EVENTS — with tabs: all / featured / approved / pending / rejected ── */}
      <GlassCard className="p-7">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Published Events</h2>
            <p className="text-sm text-slate-500 mt-0.5">All approved club events from database</p>
          </div>
          {/* Tabs: All / Featured / Approved / Pending / Rejected */}
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1 flex-wrap">
            {(['all','featured','approved','pending','rejected'] as const).map(t => (
              <button key={t} onClick={() => setEventTab(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${eventTab===t ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {visibleEvents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <Calendar className="w-10 h-10 text-slate-700" />
            <p className="text-sm text-slate-500">
              {eventTab === 'pending'  ? 'You have no pending proposals.'
              : eventTab === 'rejected' ? 'No rejected proposals.'
              : eventTab === 'featured' ? 'No featured events yet.'
              : 'No events to show here.'}
            </p>
            <button onClick={() => setShowModal(true)}
              className="mt-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Propose an event →
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visibleEvents.map((ev, i) => {
              const isPending  = eventTab === 'pending';
              const isRejected = eventTab === 'rejected';
              return (
                <motion.div key={`${eventTab}-${ev.id}`}
                  initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} transition={{delay:0.04*i}}
                  className="flex flex-col rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10] transition-all group">

                  {/* Cover: poster > gradient */}
                  <div className="relative h-44 overflow-hidden">
                    {ev.poster ? (
                      <>
                        <img src={ev.poster} alt={ev.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={e => {
                            const el = e.currentTarget as HTMLImageElement;
                            el.style.display = 'none';
                            // show fallback sibling
                            (el.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                          }}
                        />
                        {/* Fallback gradient (hidden by default) */}
                        <div className={`hidden absolute inset-0 bg-gradient-to-br ${ev.gradient} flex items-center justify-center`}>
                          <span className="text-5xl">{ev.icon}</span>
                        </div>
                      </>
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${ev.gradient} flex items-center justify-center`}>
                        <span className="text-5xl">{ev.icon}</span>
                      </div>
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                    {/* Badges top-left */}
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                      {ev.isFeatured && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-500/30 text-amber-300 border-amber-400/30 backdrop-blur-sm flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-300" /> Featured
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${catCls(ev.category)}`}>{ev.category}</span>
                    </div>

                    {/* Status bottom-left */}
                    {(isPending || isRejected) && (
                      <div className="absolute bottom-3 left-3">
                        <StatusPill status={isPending ? 'pending' : 'rejected'} />
                      </div>
                    )}

                    {/* Reminder bell — only for published events */}
                    {!isPending && !isRejected && (
                      <button onClick={() => setReminders(p => ({ ...p, [ev.id]: !p[ev.id] }))}
                        className="absolute bottom-3 right-3 w-8 h-8 rounded-xl bg-black/40 border border-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors">
                        {reminders[ev.id] ? <Bell className="w-3.5 h-3.5 text-amber-400" /> : <BellOff className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-4 gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">{ev.title}</h3>
                      {ev.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{ev.description}</p>
                      )}
                      <div className="space-y-1 mt-2.5 text-xs text-slate-400">
                        <p className="flex items-center gap-1.5"><Clock className="w-3 h-3 shrink-0" />{ev.date}</p>
                        <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3 shrink-0" />{ev.venue}</p>
                        {ev.speaker && <p className="flex items-center gap-1.5"><User className="w-3 h-3 shrink-0" />{ev.speaker}</p>}
                        {ev.seats !== null && (
                          <p className="flex items-center gap-1.5"><Ticket className="w-3 h-3 shrink-0" />{ev.seats} seats left</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-auto pt-3 border-t border-white/[0.05]">
                      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                        onClick={() => setDetailEvent({ ...ev, status: isPending ? 'pending' : isRejected ? 'rejected' : 'approved' })}
                        className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center gap-1.5 transition-all">
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* ── MY PROPOSALS ── */}
      <GlassCard className="p-7">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">My Event Proposals</h2>
            <p className="text-sm text-slate-500 mt-0.5">Track submissions and admin feedback</p>
          </div>
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1">
            {(['all','pending','approved','rejected'] as const).map(t => (
              <button key={t} onClick={() => setProposalTab(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${proposalTab===t ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {visibleProposals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center border border-dashed border-white/[0.07] rounded-2xl">
            <FileText className="w-8 h-8 text-slate-700" />
            <p className="text-sm text-slate-500">
              {proposalTab === 'all' ? 'No proposals submitted yet.' : `No ${proposalTab} proposals.`}
            </p>
            {proposalTab === 'all' && (
              <button onClick={() => setShowModal(true)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                Submit your first proposal →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleProposals.map((p, i) => (
              <motion.div key={p.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:0.04*i}}
                className="p-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:border-white/[0.09] transition-all">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <StatusPill status={p.status} />
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${catCls(p.category)}`}>{p.category}</span>
                </div>
                <h3 className="text-sm font-bold text-white">{p.title}</h3>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.date}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.venue}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Submitted {p.submittedAt}</span>
                </div>
                {p.requestNote && (
                  <p className="text-xs text-slate-500 mt-2 italic">"{p.requestNote}"</p>
                )}
                {p.adminRemarks && (
                  <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl"
                    style={p.status === 'rejected'
                      ? { background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.15)' }
                      : { background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.15)' }}>
                    <AlertCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${p.status==='rejected'?'text-red-400':'text-emerald-400'}`} />
                    <p className="text-xs text-slate-400"><span className="font-semibold text-white">Admin: </span>{p.adminRemarks}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* ── COMPLETED + REMINDERS ── */}
      <div className="grid lg:grid-cols-5 gap-6">
        <GlassCard className="lg:col-span-3 p-7">
          <h2 className="text-xl font-bold text-white mb-1">Completed Events</h2>
          <p className="text-sm text-slate-500 mb-5">Your attendance history</p>
          {completed.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center border border-dashed border-white/[0.07] rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-slate-700" />
              <p className="text-sm text-slate-500">No completed events yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completed.map(ev => (
                <div key={ev.id}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] transition-all">
                  {/* Thumb */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/[0.07]">
                    {ev.poster ? (
                      <img src={ev.poster} alt="" className="w-full h-full object-cover"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${ev.gradient} flex items-center justify-center text-2xl`}>{ev.icon}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{ev.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ev.date}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.venue}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {ev.attended
                      ? <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Attended</span>
                      : <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20">Missed</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-6">
          <h2 className="text-base font-bold text-white mb-4">Reminder Settings</h2>
          <div className="space-y-3">
            {[
              { key:'push'     as const, label:'Push Notifications', sub:'In-app alerts',    icon: Bell,       color:'text-indigo-400' },
              { key:'email'    as const, label:'Email Reminders',    sub:'Before events',    icon: Mail,       color:'text-blue-400'   },
              { key:'whatsapp' as const, label:'WhatsApp Alerts',    sub:'Via club contact', icon: Smartphone, color:'text-emerald-400' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.sub}</p>
                  </div>
                </div>
                <ToggleSwitch on={notifToggles[item.key]} onToggle={() => setNotifToggles(p => ({ ...p, [item.key]: !p[item.key] }))} />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <AnimatePresence>
        {showModal && (
          <ProposalModal
            onClose={() => setShowModal(false)}
            onSuccess={load}
            existingCategories={existingCategories}
          />
        )}
        {detailEvent && (
          <DetailsModal ev={detailEvent} onClose={() => setDetailEvent(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}