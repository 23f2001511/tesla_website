'use client';

import {
  Calendar, Download, Bell, BellOff, MapPin, Clock, Users,
  CheckCircle2, Award, Eye, AlertCircle, CalendarDays,
  Mail, Smartphone, RefreshCw, Ticket, Plus, X, Save,
  ChevronDown, Send, FileText, Timer,
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
interface CompletedEvent extends ApiEvent { attended: boolean; hasCert: boolean; }
interface Proposal {
  id: string; title: string; description: string;
  date: string; venue: string; category: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string; requestNote: string; adminRemarks: string;
}
interface Certificate {
  id: string; event: string; date: string;
  certId: string; verified: boolean; gradient: string; icon: string;
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
function catCls(cat: string) { return CAT_COLORS[cat] || 'bg-white/10 text-slate-300 border-white/15'; }

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    pending:  { cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25',   label: 'Pending' },
    approved: { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', label: 'Approved' },
    rejected: { cls: 'bg-red-500/15 text-red-400 border-red-500/25',         label: 'Rejected' },
  };
  const m = map[status] || map['pending'];
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${m.cls}`}>{m.label}</span>
  );
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

// ─── Toggle switch ────────────────────────────────────────────────────────────
function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <motion.button onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${on ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : 'bg-white/10 border border-white/10'}`}>
      <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md ${on ? 'bg-white left-[22px]' : 'bg-slate-500 left-0.5'}`} />
    </motion.button>
  );
}

// ─── Glass card ───────────────────────────────────────────────────────────────
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

// ─── Input field ─────────────────────────────────────────────────────────────
const iCls = 'w-full bg-[#0d1117] border border-white/[0.09] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/60 transition-colors';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Proposal form modal ──────────────────────────────────────────────────────
const CATEGORIES = ['Web Dev','AI/ML','Robotics','Hackathon','Cybersecurity','Design','Workshop','Seminar','Competition','Social'];
const blankForm = { title:'', description:'', date:'', venue:'', category:'Workshop', speaker:'', seatLimit:'', requestNote:'' };

function ProposalModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.description || !form.date || !form.venue || !form.category) {
      setError('Please fill in all required fields.'); return;
    }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/dashboard/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, seatLimit: form.seatLimit ? Number(form.seatLimit) : undefined }),
      });
      const data = await res.json();
      if (data.success) { onSuccess(); onClose(); }
      else setError(data.error || 'Failed to submit proposal.');
    } catch { setError('Network error. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
        transition={{ type:'spring', stiffness:300, damping:28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl rounded-3xl shadow-2xl"
        style={{ background:'#0b0f1a', border:'1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <Send className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Submit Event Proposal</h2>
              <p className="text-[11px] text-slate-500">Will be reviewed by Admin / President / Office Bearer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto" style={{ scrollbarWidth:'thin', scrollbarColor:'#1e293b transparent' }}>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <Field label="Event Title" required>
            <input className={iCls} placeholder="e.g. Web Development Bootcamp 2026" value={form.title} onChange={e=>set('title',e.target.value)} />
          </Field>

          <Field label="Description" required>
            <textarea className={iCls + ' resize-none'} rows={3} placeholder="Describe the event, its goals and expected outcomes…" value={form.description} onChange={e=>set('description',e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" required>
              <select className={iCls + ' cursor-pointer appearance-none'} style={{ background:'#0d1117', color:'#fff' }}
                value={form.category} onChange={e=>set('category',e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ background:'#0d1117' }}>{c}</option>)}
              </select>
            </Field>
            <Field label="Date & Time" required>
              <input type="datetime-local" className={iCls} value={form.date} onChange={e=>set('date',e.target.value)}
                style={{ colorScheme:'dark' }} />
            </Field>
          </div>

          <Field label="Venue" required>
            <input className={iCls} placeholder="e.g. Lab 301, Main Block" value={form.venue} onChange={e=>set('venue',e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Speaker (optional)">
              <input className={iCls} placeholder="Speaker name" value={form.speaker} onChange={e=>set('speaker',e.target.value)} />
            </Field>
            <Field label="Seat Limit (optional)">
              <input className={iCls} type="number" placeholder="e.g. 50" value={form.seatLimit} onChange={e=>set('seatLimit',e.target.value)} />
            </Field>
          </div>

          <Field label="Proposal Note (optional)">
            <textarea className={iCls + ' resize-none'} rows={2} placeholder="Why should this event be approved? Any additional context…" value={form.requestNote} onChange={e=>set('requestNote',e.target.value)} />
          </Field>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-white/[0.06] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-slate-400 border border-white/[0.07] hover:bg-white/[0.04] transition-all">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow:'0 4px 20px rgba(99,102,241,0.3)' }}>
            {saving ? <><RefreshCw className="w-4 h-4 animate-spin" />Submitting…</>
                    : <><Send className="w-4 h-4" />Submit Proposal</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardEventsPage() {
  const [data,          setData]          = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [notifToggles,  setNotifToggles]  = useState({ push: true, email: true, whatsapp: false });
  const [reminders,     setReminders]     = useState<Record<string, boolean>>({});
  const [proposalTab,   setProposalTab]   = useState<'all'|'pending'|'approved'|'rejected'>('all');

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

  const upcoming:    ApiEvent[]     = data?.upcoming    || [];
  const completed:   CompletedEvent[] = data?.completed || [];
  const proposals:   Proposal[]     = data?.myProposals || [];
  const certs:       Certificate[]  = data?.certificates || [];
  const nextEvent                   = data?.nextEvent   || null;
  const stats                       = data?.stats       || {};

  const visibleProposals = proposalTab === 'all'
    ? proposals
    : proposals.filter(p => p.status === proposalTab);

  const summaryStats = [
    { label:'Total Registered', value: stats.totalRegistered   || 0, icon: Ticket,       color:'from-blue-500/20 to-blue-600/10',     accent:'#3b82f6' },
    { label:'Upcoming',         value: stats.upcomingCount     || 0, icon: Calendar,     color:'from-violet-500/20 to-violet-600/10', accent:'#8b5cf6' },
    { label:'Completed',        value: stats.completedCount    || 0, icon: CheckCircle2, color:'from-emerald-500/20 to-emerald-600/10',accent:'#10b981' },
    { label:'Certificates',     value: stats.certificatesCount || 0, icon: Award,        color:'from-amber-500/20 to-amber-600/10',   accent:'#f59e0b' },
  ];

  return (
    <div className="min-h-screen pb-16 space-y-6 text-gray-100">

      {/* ── HEADER ── */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute -top-20 -left-16 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-12 w-56 h-56 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-7 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Title */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">My Events</h1>
              </div>
              <p className="text-slate-400 text-sm ml-1">Browse approved events, track your proposals and certificates.</p>
            </div>

            {/* Next Event pill + Propose button */}
            <div className="flex flex-col gap-3 shrink-0">
              {nextEvent && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.07]">
                  <Timer className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Next Event</p>
                    <p className="text-sm font-bold text-white line-clamp-1">{nextEvent.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{nextEvent.date}</p>
                    <p className="text-xs mt-1">Starts in <Countdown rawDate={nextEvent.rawDate} /></p>
                  </div>
                </div>
              )}
              <motion.button onClick={() => setShowModal(true)} whileHover={{ y:-1 }} whileTap={{ scale:0.97 }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white"
                style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow:'0 4px 16px rgba(99,102,241,0.3)' }}>
                <Plus className="w-4 h-4" /> Create Event Proposal
              </motion.button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => (
          <motion.div key={s.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.05*i}}>
            <GlassCard className="p-5 hover:border-white/10 transition-all h-full">
              <div className={`inline-flex w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5" style={{ color: s.accent }} />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* ── UPCOMING EVENTS (approved only, View Details only) ── */}
      <GlassCard className="p-7">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
            <p className="text-sm text-slate-500 mt-0.5">All approved club events</p>
          </div>
          <span className="text-[11px] text-slate-500 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03]">
            {upcoming.length} event{upcoming.length !== 1 ? 's' : ''}
          </span>
        </div>

        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <Calendar className="w-10 h-10 text-slate-700" />
            <p className="text-sm text-slate-500">No upcoming events at the moment</p>
            <button onClick={() => setShowModal(true)}
              className="mt-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Propose an event →
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {upcoming.map((ev, i) => (
              <motion.div key={ev.id} initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} transition={{delay:0.04*i}}
                className="flex flex-col rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10] transition-all group">
                {/* Cover */}
                <div className={`relative h-28 bg-gradient-to-br ${ev.gradient} flex items-center justify-center overflow-hidden`}>
                  <span className="text-5xl">{ev.icon}</span>
                  <div className="absolute inset-0 bg-black/20" />
                  {ev.isFeatured && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-500/30 text-amber-300 border-amber-400/30 backdrop-blur-sm">Featured</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${catCls(ev.category)}`}>{ev.category}</span>
                  </div>
                  {/* Reminder bell */}
                  <button onClick={() => setReminders(p => ({ ...p, [ev.id]: !p[ev.id] }))}
                    className="absolute bottom-3 right-3 w-8 h-8 rounded-xl bg-black/30 border border-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors">
                    {reminders[ev.id] ? <Bell className="w-3.5 h-3.5 text-amber-400" /> : <BellOff className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-4 gap-3 bg-white/[0.01]">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">{ev.title}</h3>
                    <div className="space-y-1 mt-2 text-xs text-slate-400">
                      <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{ev.date}</p>
                      <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{ev.venue}</p>
                      {ev.seats !== null && (
                        <p className="flex items-center gap-1.5"><Users className="w-3 h-3" />{ev.seats} seats remaining</p>
                      )}
                    </div>
                  </div>
                  {/* View Details only — no register */}
                  <div className="mt-auto pt-3 border-t border-white/[0.06]">
                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                      className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center gap-1.5 transition-all">
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* ── MY PROPOSALS ── */}
      <GlassCard className="p-7">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">My Event Proposals</h2>
            <p className="text-sm text-slate-500 mt-0.5">Track your submitted proposals and admin feedback</p>
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
                className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:border-white/[0.09] transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
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
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* ── COMPLETED + CERTIFICATES ── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Completed events */}
        <GlassCard className="lg:col-span-3 p-7">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white">Completed Events</h2>
              <p className="text-sm text-slate-500 mt-0.5">Your event attendance history</p>
            </div>
          </div>
          {completed.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-slate-700" />
              <p className="text-sm text-slate-500">No completed events yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completed.map((ev, i) => (
                <div key={ev.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] transition-all group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ev.attended ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-red-500/15 border border-red-500/25'}`}>
                    {ev.attended
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      : <AlertCircle  className="w-5 h-5 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{ev.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ev.date}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.venue}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ev.attended
                      ? <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Attended</span>
                      : <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20">Missed</span>}
                    {ev.hasCert && (
                      <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 text-xs text-amber-400 font-semibold transition-all">
                        <Download className="w-3 h-3" /> Cert
                      </motion.button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Right: Certificates + Reminder settings */}
        <div className="lg:col-span-2 space-y-5">
          {/* Certificates */}
          <GlassCard className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">Certificates</h2>
                <p className="text-xs text-slate-500 mt-0.5">{certs.length} verified credential{certs.length !== 1 ? 's' : ''}</p>
              </div>
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            {certs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Award className="w-7 h-7 text-slate-700" />
                <p className="text-xs text-slate-500">Attend events to earn certificates</p>
              </div>
            ) : (
              <div className="space-y-3">
                {certs.map(c => (
                  <div key={c.id}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-white/[0.05] bg-white/[0.02]">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-lg shrink-0`}>
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{c.event}</p>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">{c.certId}</p>
                      {c.verified && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400 font-semibold">Verified</span>
                        </div>
                      )}
                    </div>
                    <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                      className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all">
                      <Download className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Reminders */}
          <GlassCard className="p-6">
            <h2 className="text-base font-bold text-white mb-4">Reminder Settings</h2>
            <div className="space-y-3">
              {[
                { key:'push'     as const, label:'Push Notifications', sub:'In-app alerts',       icon: Bell,       color:'text-indigo-400' },
                { key:'email'    as const, label:'Email Reminders',    sub:'Before events',        icon: Mail,       color:'text-blue-400' },
                { key:'whatsapp' as const, label:'WhatsApp Alerts',    sub:'Via club contact',     icon: Smartphone, color:'text-emerald-400' },
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
      </div>

      {/* ── Proposal modal ── */}
      <AnimatePresence>
        {showModal && <ProposalModal onClose={() => setShowModal(false)} onSuccess={load} />}
      </AnimatePresence>
    </div>
  );
}