'use client';

import { useEffect, useState } from 'react';
import {
  Lock, Users, ClipboardList, Layers, BookOpen,
  Calendar, MapPin, Clock, FileText, ArrowUpRight,
  Globe, Eye, ChevronRight, RefreshCw,
  Code2, Terminal, ShieldAlert, Cpu, Radio, GitBranch,
  UserPlus, UserMinus, FileCheck, Building2, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';


/* ─────────────────────────── ACCESS DENIED ─────────────────────────── */

function NoAccess() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <Lock className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-sm font-semibold text-gray-300">You don't have access to this page</p>
      <p className="text-xs text-gray-500 max-w-xs">
        This feature isn't available for your role. If you think this is a mistake, ask an Admin or President.
      </p>
    </div>
  );
}

/* ─────────────────────────── TYPES & CONFIG ─────────────────────────── */

type MemberStatus = 'Active' | 'Inactive' | 'On Leave';
type Priority = 'High' | 'Medium' | 'Low';
type TaskStatus = 'In Progress' | 'Completed' | 'Pending' | 'Under Review';

// Admin-only operations — gated by the existing permission system. A Team
// Leader without the permission sees them locked (the default for this page).
const restrictedActions = [
  { label: 'Add New Member',         icon: UserPlus,  note: 'Requires Admin Approval', permission: 'members:create' },
  { label: 'Remove Member',          icon: UserMinus, note: 'Requires Admin Approval', permission: 'members:delete' },
  { label: 'Approve Resources',      icon: FileCheck, note: 'Requires Admin Approval', permission: 'resources:approve' },
  { label: 'Publish Blogs Globally', icon: Globe,     note: 'Requires Admin Approval', permission: 'blogs:publish' },
  { label: 'Upload Resources',       icon: FileText,  note: 'Requires Admin Approval', permission: 'resources:upload' },
  { label: 'Create Events',          icon: Calendar,  note: 'Requires Admin Approval', permission: 'events:create' },
  { label: 'Edit Team Information',  icon: Building2,  note: 'Requires Admin Approval', permission: 'team:edit' },
];

// Helpers for rendering real members.
const GRADIENTS = [
  'from-indigo-500 to-violet-600', 'from-blue-500 to-cyan-500', 'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500', 'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-500', 'from-fuchsia-500 to-pink-600',
];
const initialsOf = (name?: string) =>
  (name || 'U').split(' ').map((n) => n[0] || '').join('').slice(0, 2).toUpperCase();
const mapStatus = (s?: string): MemberStatus =>
  s === 'active' ? 'Active' : s === 'inactive' ? 'Inactive' : 'On Leave';

// Recent-activity icon/colour by derived type.
const activityStyle: Record<string, { icon: any; color: string }> = {
  Published:  { icon: Globe,    color: '#3b82f6' },
  Submission: { icon: FileText, color: '#6366f1' },
};

/* ─────────────────────────── ANIMATION VARIANTS ─────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const stagger = (d = 0.08) => ({ hidden: {}, show: { transition: { staggerChildren: d } } });

/* ─────────────────────────── HELPERS ─────────────────────────── */

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Badge({ text, className = '' }: { text: string; className?: string }) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}>{text}</span>;
}

const statusStyles: Record<MemberStatus, string> = {
  Active:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Inactive:  'bg-slate-500/15 text-slate-400 border-slate-500/25',
  'On Leave':'bg-amber-500/15 text-amber-400 border-amber-500/25',
};

const priorityStyles: Record<Priority, string> = {
  High:   'bg-red-500/15 text-red-400 border-red-500/25',
  Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  Low:    'bg-sky-500/15 text-sky-400 border-sky-500/25',
};

const taskStatusStyles: Record<TaskStatus, string> = {
  'In Progress':  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'Completed':    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  'Pending':      'bg-slate-500/15 text-slate-400 border-slate-500/25',
  'Under Review': 'bg-violet-500/15 text-violet-400 border-violet-500/25',
};

/* ─────────────────────────── LIVE CLOCK ─────────────────────────── */

function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-IN', {
        hour:   '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-3.5 py-2">
      <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
      <span className="text-sm font-mono font-semibold text-white tabular-nums">{time}</span>
    </div>
  );
}

/* ─────────────────────────── PAGE ─────────────────────────── */

export default function TeamDashboardPage() {
  const router = useRouter();
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadTeam = async () => {
    const res = await fetch('/api/dashboard/team', {
  cache: 'no-store',
});
    const json = await res.json();
    if (json.success) { setData(json); setError(false); }
    else setError(true);
  };

  useEffect(() => {
    (async () => {
      try { await loadTeam(); }
      catch (err) { console.error(err); setError(true); }
      finally { setLoading(false); }
    })();
  }, []);

  // Sync Team = real data refresh (no fake synchronization).
  const handleSync = async () => {
    setSyncing(true);
    try { await loadTeam(); }
    catch (err) { console.error(err); setError(true); }
    finally { setSyncing(false); }
  };

  if (loading) return <div className="text-center py-20 text-sm text-gray-500">Loading…</div>;

  if (error || !data) return (
    <div className="text-center py-20 text-sm text-gray-500">
      Couldn&apos;t load your team right now.{' '}
      <button onClick={handleSync} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">Retry</button>
    </div>
  );

  // ─── Derived, real data ───
  const leader        = data.leader || {};
  const teamName      = data.team || 'Unassigned Team';
  const members       = data.members || [];
  const recentActivity = data.recentActivity || [];
  const upcomingEvents = data.upcomingEvents || [];
  const perms: string[] = leader.permissions || [];

  return (
    <div className="min-h-screen pb-16 space-y-6">

      {/* ── 1. HERO HEADER ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <GlassCard className="relative overflow-hidden">
          {/* blobs */}
          <div className="absolute -top-24 -left-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-16 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative p-7 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">

              {/* Avatar — no live indicator */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-indigo-500/20 shrink-0">
                {initialsOf(leader.name)}
              </div>

              {/* Info — members count only */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{teamName}</h1>
                  <Badge text={leader.designation || leader.role || 'Team Leader'} className="bg-indigo-500/15 text-indigo-400 border-indigo-500/25" />
                </div>
                <p className="text-slate-400 text-sm mb-4">
                  Led by <span className="text-white font-semibold">{leader.name}</span>
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Members</p>
                    <p className="text-sm font-bold text-white">{members.length}</p>
                  </div>
                </div>
              </div>

              {/* Right side: clock + sync */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <LiveClock />
                <motion.button
                  onClick={handleSync}
                  disabled={syncing}
                  whileHover={{ scale: syncing ? 1 : 1.03 }}
                  whileTap={{ scale: syncing ? 1 : 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing…' : 'Sync Team'}
                </motion.button>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

     

      {/* ── 3. TEAM MEMBERS ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <GlassCard className="p-7">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Team Members</h2>
              <p className="text-sm text-slate-500 mt-0.5">Your current team roster</p>
            </div>
            <Badge text={`${members.length} members`} className="bg-white/5 text-slate-400 border-white/10" />
          </div>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2 text-center">
              <Users className="w-8 h-8 text-slate-700" />
              <p className="text-sm font-semibold text-slate-400">No members in this team yet</p>
              <p className="text-xs text-slate-600 max-w-xs">Members assigned to your team by an Admin will appear here.</p>
            </div>
          ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {members.map((m: any, i: number) => {
              const status = mapStatus(m.status);
              return (
              <motion.div key={m._id || i}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                className="flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] hover:bg-white/[0.04] transition-all group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                    {m.profileImage
                      ? <img src={m.profileImage} alt={m.name} className="w-full h-full rounded-xl object-cover" />
                      : initialsOf(m.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.designation || m.role || 'Member'}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-400">
                  <p className="flex items-center gap-1.5"><Building2 className="w-3 h-3" />{m.branch || '—'}{m.year ? ` · Year ${m.year}` : ''}</p>
                  <p className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3" />{m.email}</p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <Badge text={status} className={statusStyles[status]} />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/dashboard/profile/${m._id}`)}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-medium transition-all">
                    <Eye className="w-3 h-3" /> View
                  </motion.button>
                </div>
              </motion.div>
              );
            })}
          </div>
          )}
        </GlassCard>
      </motion.div>

     

      {/* ── 5 + 6. REPOSITORIES + RECENT LOGS ── */}
      <div className="grid lg:grid-cols-5 gap-6">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="lg:col-span-2">
          <GlassCard className="p-7 h-full">
            <SectionTitle title="Active Targets" subtitle="Live deployment / project targets" />
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <GitBranch className="w-7 h-7 text-slate-700" />
                <p className="text-xs text-slate-500">No active targets</p>
                <p className="text-[10px] text-slate-600 max-w-[12rem]">Targets will appear here once they are assigned to your team.</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="lg:col-span-3">
          <GlassCard className="p-7 h-full">
            <SectionTitle title="Recent Activity" subtitle="Latest team action logs" />
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <FileText className="w-7 h-7 text-slate-700" />
                <p className="text-xs text-slate-500">No recent activity yet</p>
              </div>
            ) : (
            <div className="space-y-0">
              {recentActivity.map((item: any, i: number) => {
                const st = activityStyle[item.type] || { icon: FileText, color: '#6366f1' };
                const ItemIcon = st.icon;
                return (
                <div key={i} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${st.color}22`, border: `1px solid ${st.color}33` }}>
                      <ItemIcon className="w-4 h-4" style={{ color: st.color }} />
                    </div>
                    {i < recentActivity.length - 1 && <div className="w-px flex-1 my-1 bg-white/[0.05]" />}
                  </div>
                  <div className="pb-5 flex-1 flex items-start justify-between gap-4 min-w-0">
                    <div>
                      <p className="text-sm text-slate-300 group-hover:text-white transition-colors leading-snug">{item.action}</p>
                      <Badge text={item.type} className="mt-1.5 bg-white/5 text-slate-500 border-white/10" />
                    </div>
                    <span className="text-xs text-slate-600 shrink-0 mt-0.5">{item.time}</span>
                  </div>
                </div>
                );
              })}
            </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* ── 7. UPCOMING SCHEDULES ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <GlassCard className="p-7">
          <SectionTitle title="Upcoming Schedules" subtitle="Club events matching team bounds" />
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <Calendar className="w-7 h-7 text-slate-700" />
              <p className="text-xs text-slate-500">No upcoming schedules</p>
            </div>
          ) : (
          <div className="grid sm:grid-cols-1 xl:grid-cols-3 gap-4">
            {upcomingEvents.map((ev: any, i: number) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i }}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] hover:bg-white/[0.04] transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 uppercase font-semibold leading-none">{ev.date.split(' ')[0]}</p>
                    <p className="text-3xl font-black text-white leading-tight">{ev.date.split(' ')[1]}</p>
                  </div>
                  <Badge text={ev.tag} className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30" />
                </div>
                <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">{ev.title}</p>
                <div className="space-y-1 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{ev.time}</p>
                  <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{ev.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
          )}
        </GlassCard>
      </motion.div>

      {/* ── 8. RESTRICTED ACTIONS ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <GlassCard className="p-7">
          <SectionTitle
            title="Restricted Operations"
            subtitle="These endpoints require explicit Admin approval validation tokens."
            action={<Badge text="Read-only" className="bg-red-500/10 text-red-400 border-red-500/20" />}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {restrictedActions.map((r, i) => {
              const allowed = perms.includes(r.permission);
              return (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.04 * i }}
                aria-disabled={!allowed}
                className={`relative flex flex-col items-center text-center gap-2.5 p-4 rounded-2xl bg-red-500/[0.03] border border-red-500/10 group select-none ${allowed ? 'cursor-default' : 'cursor-not-allowed'}`}
                title={allowed ? r.label : r.note}
              >
                <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-red-500/15 flex items-center justify-center relative">
                  <r.icon className="w-5 h-5 text-slate-600" />
                  {!allowed && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500/80 border border-[#0d1117] flex items-center justify-center">
                      <Lock className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-500 leading-tight">{r.label}</p>
                <span className="text-[10px] text-red-400/70 font-medium leading-tight">{allowed ? 'Available' : r.note}</span>
              </motion.div>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>

    </div>
  );
}