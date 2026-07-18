'use client';

import { motion, cubicBezier, useReducedMotion } from 'framer-motion';
import { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import Link from 'next/link';
import {
  Users, Calendar, FileText, Activity, TrendingUp, TrendingDown,
  RefreshCw, BookOpen, Bell, ArrowRight, Zap, AlertTriangle,
  Crown, ShieldCheck, Award, Layers, BarChart3,
  CheckCircle2, Clock, UserCheck, Star, Building2,
  Upload, PenLine, Eye, MessageSquare, Timer
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useRouter } from 'next/navigation';

type OfficerRole = 'President' | 'OfficeBearer';

const ROLE_CONFIG: Record<OfficerRole, {
  label:        string;
  subLabel:    string;
  Icon:        any;
  accent:      string;
  gradient:    string;
  blobA:       string;
  blobB:       string;
  apiEndpoint: string;
}> = {
  President: {
    label:       'President Dashboard',
    subLabel:    'Club leadership & full operations overview',
    Icon:        Crown,
    accent:      '#fbbf24',
    gradient:    'from-amber-500/20 via-yellow-500/10 to-transparent',
    blobA:       'bg-amber-600/15',
    blobB:       'bg-yellow-600/10',
    apiEndpoint: '/api/dashboard/president',
  },
  OfficeBearer: {
    label:       'Office Bearer Dashboard',
    subLabel:    'Club operations & coordination overview',
    Icon:        ShieldCheck,
    accent:      '#60a5fa',
    gradient:    'from-blue-500/20 via-indigo-500/10 to-transparent',
    blobA:       'bg-blue-600/15',
    blobB:       'bg-indigo-600/10',
    apiEndpoint: '/api/dashboard/office-bearer',
  },
};

interface OfficerData {
  user: {
    name: string; role: OfficerRole; team: string; designation: string;
    profileImage?: string; email: string; batch?: number;
    socialLinks?: { linkedin?: string; github?: string };
  };
  stats: {
    totalMembers: number;    activeMembers: number;   totalTeams: number;
    totalEvents: number;     upcomingEvents: number;  completedEvents: number;
    totalBlogs: number;      pendingBlogs: number;    publishedBlogs: number;
    totalResources: number;
    totalVisitsLast7?: number;  memberGrowthPercent?: number;
    alumniCount?: number;       totalRevenue?: number;
    myTeam?: string; myTeamMemberCount?: number; myTasksDone?: number;
  };
  trafficData:      { name: string; visitors: number; pageViews: number }[];
  membersGrowthData:{ name: string; members: number }[];
  recentActivities: { type: string; text: string; createdAt: string }[];
  upcomingEvents:   { title: string; day: string; dateNum: number; time: string; location: string; category: string; rawDate?: string }[];
  teamBreakdown?:   { name: string; count: number }[];
  pendingApprovals?:{ id: string; title: string; type: string; author: string; submittedAt: string }[];
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: cubicBezier(0.22, 1, 0.36, 1) } },
};

const containerVariants = (reduced: boolean) => ({
  hidden: {},
  show:   { transition: reduced ? {} : { staggerChildren: 0.05, delayChildren: 0.02 } },
});

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ⏳ LIVE COUNTDOWN SUB-COMPONENT
function Countdown({ rawDate }: { rawDate: string }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!rawDate) return;
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
  return <span className="font-mono text-indigo-300 font-bold">{remaining || 'Soon'}</span>;
}

const AnimatedNumber = memo(function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef   = useRef<number | null>(null);
  const prevVal  = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const from  = prevVal.current;
    const tick  = (now: number) => {
      const t = Math.min((now - start) / 700, 1);
      setDisplay(Math.round(from + (value - from) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else prevVal.current = value;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [value]);
  return <>{display.toLocaleString()}</>;
});

const ChartTooltip = memo(function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-950/90 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs">
      <p className="text-slate-200 font-bold mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: <strong className="text-white font-extrabold">{p.value?.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
});

function DashboardSkeleton({ accent }: { accent: string }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-44 rounded-3xl" style={{ background: `${accent}08`, border: `1px solid ${accent}15` }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/5 border border-white/5 rounded-2xl" />)}
      </div>
    </div>
  );
}

const StatCard = memo(function StatCard({ s }: { s: {
  title: string; value: number; accent: string; icon: any;
  href: string; change?: number | null; sub?: string | null;
}}) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }}
      className="relative group block bg-gradient-to-b from-white/[0.025] to-transparent border border-white/10 hover:border-white/20 p-5 rounded-2xl transition-all shadow-lg overflow-hidden">
      <Link href={s.href} className="flex flex-col justify-between h-full">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500"
          style={{ background: `radial-gradient(circle at 20% 0%, ${s.accent}15, transparent 60%)` }} />
        <div className="flex items-center justify-between relative z-10">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3"
            style={{ backgroundColor: `${s.accent}15`, borderColor: `${s.accent}30` }}>
            <s.icon className="w-5 h-5" style={{ color: s.accent }} />
          </div>
          {s.change !== null && s.change !== undefined && (
            <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${s.change >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {s.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {s.change >= 0 ? '+' : ''}{s.change}%
            </span>
          )}
          {s.sub && (
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full">{s.sub}</span>
          )}
        </div>
        <p className="text-3xl font-black text-white tracking-tight mt-5 mb-1.5 relative z-10">
          <AnimatedNumber value={s.value} />
        </p>
        <div className="flex items-center justify-between relative z-10 text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">
          <span>{s.title}</span>
          <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </div>
      </Link>
    </motion.div>
  );
});

const activityMeta: Record<string, { bg: string; text: string; Icon: any }> = {
  blog:     { bg: 'bg-purple-500/10 border-purple-500/20',  text: 'text-purple-400',  Icon: FileText },
  event:    { bg: 'bg-blue-500/10 border-blue-500/20',      text: 'text-blue-400',    Icon: Calendar },
  member:   { bg: 'bg-emerald-500/10 border-emerald-500/20',text: 'text-emerald-400', Icon: Users    },
  resource: { bg: 'bg-cyan-500/10 border-cyan-500/20',      text: 'text-cyan-400',    Icon: BookOpen },
};

const ActivityItem = memo(function ActivityItem({ a }: { a: { type: string; text: string; createdAt: string } }) {
  const meta = activityMeta[a.type] || { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400', Icon: Activity };
  return (
    <motion.div layout initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }}
      className="flex items-start gap-3.5 p-1">
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.text}`}>
        <meta.Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-200 leading-relaxed">{a.text}</p>
        <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{timeAgo(a.createdAt)}</p>
      </div>
    </motion.div>
  );
});

const EVENT_SCHEMES = [
  { text:'text-indigo-400', border:'border-indigo-500/20', fill:'bg-indigo-500/10', gradient:'from-indigo-500 to-indigo-600' },
  { text:'text-purple-400', border:'border-purple-500/20', fill:'bg-purple-500/10', gradient:'from-purple-500 to-purple-600' },
  { text:'text-blue-400',   border:'border-blue-500/20',   fill:'bg-blue-500/10',   gradient:'from-blue-500 to-blue-600'     },
  { text:'text-cyan-400',   border:'border-cyan-500/20',   fill:'bg-cyan-500/10',   gradient:'from-cyan-500 to-cyan-600'     },
];

const EventItem = memo(function EventItem({ ev, index }: { ev: any; index: number }) {
  const s = EVENT_SCHEMES[index % EVENT_SCHEMES.length];
  return (
    <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.04 * index }}
      whileHover={{ x: 3 }}
      className="relative flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all">
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${s.gradient} rounded-l-full`} />
      <div className={`flex flex-col items-center justify-center min-w-[42px] h-11 rounded-lg font-black ${s.text}`}>
        <span className="text-[9px] uppercase tracking-wider font-bold opacity-60">{ev.day}</span>
        <span className="text-lg leading-none mt-0.5">{ev.dateNum}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-200 truncate">{ev.title}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{ev.time} · {ev.location}</p>
      </div>
      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${s.text} ${s.border} ${s.fill} whitespace-nowrap`}>{ev.category}</span>
    </motion.div>
  );
});

function ApprovalRow({ item, accent, onApprove, onReject }: {
  item: { id: string; title: string; type: string; author: string; submittedAt: string };
  accent: string; onApprove: (id: string) => void; onReject: (id: string) => void;
}) {
  const [busy, setBusy] = useState<'approve'|'reject'|null>(null);
  const handle = async (action: 'approve'|'reject') => {
    setBusy(action);
    try {
      // Pending approvals are blogs — publish or reject via the content-manager API.
      const res = await fetch(`/api/admin/blogs/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'approve' ? 'Published' : 'Rejected' }),
      });
      const data = await res.json();
      if (data.success) action === 'approve' ? onApprove(item.id) : onReject(item.id);
      else alert(data.error || 'Could not update the blog status.');
    } catch {
      alert('Network error. The blog status was not changed.');
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] transition-all">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
        style={{ background: `${accent}15`, color: accent }}>
        {item.type === 'blog' ? <FileText className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{item.title}</p>
        <p className="text-[10px] text-slate-500">by {item.author} · {timeAgo(item.submittedAt)}</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button onClick={() => handle('approve')} disabled={!!busy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/25 transition-all disabled:opacity-50">
          {busy === 'approve' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Approve
        </button>
        <button onClick={() => handle('reject')} disabled={!!busy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-bold hover:bg-red-500/25 transition-all disabled:opacity-50">
          {busy === 'reject' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />} Reject
        </button>
      </div>
    </div>
  );
}

const QuickAction = memo(function QuickAction({ a }: { a: { label: string; icon: any; href: string; color: string } }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
      <Link href={a.href}
        className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.04] hover:border-white/[0.12] text-center transition-all group">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-rotate-3"
          style={{ backgroundColor: `${a.color}15` }}>
          <a.icon className="w-5 h-5" style={{ color: a.color }} />
        </div>
        <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">{a.label}</span>
      </Link>
    </motion.div>
  );
});

const PIE_COLORS = ['#6366f1','#8b5cf6','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444'];

function buildStatCards(role: OfficerRole, stats: OfficerData['stats'], accent: string) {
  const common = [
    { title:'Total Members',    value: stats.totalMembers,   accent: '#6366f1', icon: Users,       href:'/dashboard/leadership/members', change: stats.memberGrowthPercent ?? null },
    { title:'Total Events',     value: stats.totalEvents,    accent: '#3b82f6', icon: Calendar,    href:'/dashboard/leadership/events',  change: null },
    { title:'Blogs',            value: stats.totalBlogs,     accent: '#8b5cf6', icon: FileText,    href:'/dashboard/leadership/blogs',   sub: stats.pendingBlogs > 0 ? `${stats.pendingBlogs} pending` : null },
    { title:'Active Members',   value: stats.activeMembers,  accent: '#10b981', icon: UserCheck,   href:'/dashboard/leadership/members', change: null },
  ];
  const presidentExtra = role === 'President' ? [
    { title:'Site Visits (7d)', value: stats.totalVisitsLast7 ?? 0, accent:'#06b6d4', icon: Activity,   href:'/dashboard/leadership', change: null },
    { title:'Alumni',           value: stats.alumniCount ?? 0,       accent:'#f59e0b', icon: Award,      href:'/dashboard/leadership/members', change: null },
    { title:'Teams',            value: stats.totalTeams,             accent:'#34d399', icon: Layers,     href:'/dashboard/leadership/members', change: null },
    { title:'Resources',        value: stats.totalResources,         accent:'#a78bfa', icon: BookOpen,   href:'/dashboard/leadership/resources', change: null },
  ] : [];
  const obExtra = role === 'OfficeBearer' ? [
    { title:'My Team Size',     value: stats.myTeamMemberCount ?? 0, accent, icon: Building2, href:'/dashboard/members', change: null },
    { title:'Tasks Completed',  value: stats.myTasksDone ?? 0,       accent:'#34d399', icon: CheckCircle2, href:'/dashboard', change: null },
  ] : [];
  return [...common, ...presidentExtra, ...obExtra];
}

function buildQuickActions(role: OfficerRole) {
  const common = [
    { label:'Create Event',    icon: Calendar,     href:'/dashboard/leadership/events',    color:'#3b82f6' },
    { label:'Write Blog',      icon: PenLine,      href:'/dashboard/leadership/blogs',     color:'#8b5cf6' },
    { label:'Upload Resource', icon: Upload,       href:'/dashboard/leadership/resources', color:'#06b6d4' },
    { label:'View Members',    icon: Users,        href:'/dashboard/leadership/members',   color:'#6366f1' },
  ];
  const presidentOnly = [
    { label:'Overview',        icon: BarChart3,    href:'/dashboard/leadership',           color:'#f59e0b' },
    { label:'Announcements',   icon: MessageSquare,href:'/dashboard/leadership',           color:'#10b981' },
  ];
  return role === 'President' ? [...common, ...presidentOnly] : common;
}

export default function LeadershipPage() {
  const [role, setRole] = useState<OfficerRole | null>(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/user/me', { cache: 'no-store' });
        const data = await res.json();
        const r = data?.user?.role;
        if (active) setRole(r === 'President' ? 'President' : 'OfficeBearer');
      } catch {
        if (active) setRole('OfficeBearer');
      } finally {
        if (active) setResolving(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (resolving || !role) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardSkeleton accent="#60a5fa" />
      </div>
    );
  }

  return <OfficerDashboard role={role} />;
}

interface OfficerDashboardProps {
  role: OfficerRole;
}

function OfficerDashboard({ role }: OfficerDashboardProps) {
  const cfg     = ROLE_CONFIG[role];
  const reduced = useReducedMotion();
  const router  = useRouter();

  const [data, setData] = useState<OfficerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const [approvals, setApprovals] = useState<OfficerData['pendingApprovals']>([]);

  const lastFetchRef = useRef<number>(0);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(cfg.apiEndpoint, { cache:'no-store' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to load');
      const json: OfficerData = await res.json();
      setData(json);
      setApprovals(json.pendingApprovals || []);
      setError('');
      setLastUpdated(new Date());
      lastFetchRef.current = Date.now();
      if (isRefresh) { setJustRefreshed(true); setTimeout(() => setJustRefreshed(false), 1200); }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cfg.apiEndpoint]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 60_000);
    const onFocus  = () => { if (Date.now() - lastFetchRef.current > 30_000) fetchData(true); };
    const onVis    = () => { if (document.visibilityState === 'visible') onFocus(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVis); };
  }, [fetchData]);

  const handleApprove = useCallback((id: string) => setApprovals(p => p?.filter(a => a.id !== id)), []);
  const handleReject  = useCallback((id: string) => setApprovals(p => p?.filter(a => a.id !== id)), []);

  const statCards    = useMemo(() => data ? buildStatCards(role, data.stats, cfg.accent) : [], [data, role, cfg.accent]);
  const quickActions = useMemo(() => buildQuickActions(role), [role]);
  const hasTraffic   = useMemo(() => data?.trafficData.some(d => d.pageViews > 0), [data]);
  const hasGrowth    = useMemo(() => data?.membersGrowthData.some(d => d.members > 0), [data]);

  const fade = useCallback((delay = 0) =>
    reduced
      ? { initial:{ opacity:1, y:0 }, animate:{ opacity:1, y:0 }, transition:{ duration:0 } }
      : { initial:{ opacity:0, y:12 }, animate:{ opacity:1, y:0 }, transition:{ duration:0.35, delay, ease:cubicBezier(0.22,1,0.36,1) } }
  , [reduced]);

  const cvars = useMemo(() => containerVariants(!!reduced), [reduced]);

  if (loading) return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 text-slate-200 min-h-screen">
      <DashboardSkeleton accent={cfg.accent} />
    </div>
  );

  if (error || !data) return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center border border-white/10 bg-white/[0.01] p-10 rounded-2xl max-w-md">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-xs text-slate-400">{error || 'Something went wrong.'}</p>
        <button onClick={() => fetchData()} className="mt-2 px-5 py-2 bg-white/5 border rounded-xl text-xs font-bold text-slate-300">Retry</button>
      </div>
    </div>
  );

  const { trafficData, membersGrowthData, recentActivities, upcomingEvents, teamBreakdown } = data;
  const RoleIcon = cfg.Icon;

  return (
    <div className={`max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8 text-slate-200 min-h-screen transition-all duration-500 ${justRefreshed ? 'ring-1 ring-blue-500/20 rounded-3xl' : ''}`}>

      {/* ── HERO BANNER SECTION (With live time, refresh, next event, and working View Profile button) ── */}
      <motion.div {...fade(0)} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${cfg.gradient} border p-6 sm:p-8 shadow-2xl`} style={{ borderColor: `${cfg.accent}25` }}>
        <div className={`absolute -top-16 -right-16 w-64 h-64 ${cfg.blobA} rounded-full blur-[70px] pointer-events-none`} />
        <div className={`absolute -bottom-16 -left-12 w-56 h-56 ${cfg.blobB} rounded-full blur-[60px] pointer-events-none`} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0 shadow-xl" style={{ borderColor: `${cfg.accent}50` }}>
              {data.user.profileImage ? <img src={data.user.profileImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white" style={{ background: `linear-gradient(135deg, ${cfg.accent}60, ${cfg.accent}30)` }}>{data.user.name?.charAt(0).toUpperCase()}</div>}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <RoleIcon className="w-5 h-5 shrink-0" style={{ color: cfg.accent }} />
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">{data.user.name}</h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border" style={{ background:`${cfg.accent}15`, color:cfg.accent, borderColor:`${cfg.accent}35` }}>{role}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{cfg.subLabel}</p>
              
              {/* Profile Context Infos */}
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                {data.user.email && <span>{data.user.email}</span>}
                {data.user.designation && <span className="font-semibold" style={{ color: cfg.accent }}>{data.user.designation}</span>}
              </div>
              
              {/* Live update timestamp */}
              {lastUpdated && (
                <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500 font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Live · Updated {lastUpdated.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Pending Approvals Metric Pill */}
            {data.stats.pendingBlogs > 0 && (
              <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl hidden md:block">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Pending</span>
                <span className="text-xl font-black text-white"><AnimatedNumber value={data.stats.pendingBlogs} /></span>
              </div>
            )}
            {/* Next Upcoming Event Pill with Countdown */}
            {upcomingEvents[0] && (
              <div className="flex items-start gap-3 px-4 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.07] hidden md:flex">
                <Timer className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Next Event</p>
                  <p className="text-xs font-black text-white line-clamp-1">{upcomingEvents[0].title}</p>
                  <p className="text-[10px] mt-0.5">Starts in <Countdown rawDate={upcomingEvents[0].rawDate || new Date().toISOString()} /></p>
                </div>
              </div>
            )}
            
            {/* Refresh Button */}
            <motion.button onClick={() => fetchData(true)} disabled={refreshing} whileTap={{ scale:0.96 }}
              className="flex items-center gap-2 px-4 py-3 border rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              style={{ background:`${cfg.accent}10`, borderColor:`${cfg.accent}25`, color:cfg.accent }}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Syncing…' : 'Refresh'}
            </motion.button>
            
            {/* View Profile Button (Redirects to /dashboard/profile as requested) */}
            <button onClick={() => router.push('/dashboard/profile')} className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14] text-white text-xs font-bold transition-all"><Eye className="w-3.5 h-3.5 text-slate-400" /> View Profile</button>
          </div>
        </div>
      </motion.div>

      {/* STATS */}
      <motion.div className={`grid gap-4 ${role === 'President' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`} variants={cvars} initial="hidden" animate="show">
        {statCards.map(s => <StatCard key={s.title} s={s} />)}
      </motion.div>

      {/* PENDING APPROVALS */}
      {approvals && approvals.length > 0 && (
        <motion.div {...fade(0.1)} className="bg-white/[0.01] border rounded-2xl p-5" style={{ borderColor:`${cfg.accent}20` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2"><Bell className="w-4 h-4" style={{ color:cfg.accent }} /> Pending Approvals</h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background:`${cfg.accent}15`, color:cfg.accent }}>{approvals.length}</span>
          </div>
          <div className="space-y-2">
            {approvals.slice(0, 5).map(a => <ApprovalRow key={a.id} item={a} accent={cfg.accent} onApprove={handleApprove} onReject={handleReject} />)}
          </div>
        </motion.div>
      )}

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div {...fade(0.12)} className="lg:col-span-2 bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col">
          <h3 className="text-sm font-bold text-slate-200 mb-5">{role === 'President' ? 'Site Traffic (Last 7 Days)' : 'Club Activity (Last 7 Days)'}</h3>
          {!hasTraffic ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2"><Activity className="w-8 h-8 text-slate-700" /><p className="text-xs text-slate-500 font-semibold">No data recorded yet</p></div>
          ) : (
            <div className="flex-1 w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData} margin={{ top:5, right:5, left:-25, bottom:0 }}>
                  <defs><linearGradient id={`gTraffic-${role}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={cfg.accent} stopOpacity={0.25} /><stop offset="95%" stopColor={cfg.accent} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke:`${cfg.accent}20` }} />
                  <Area type="monotone" dataKey="pageViews" stroke={cfg.accent} fill={`url(#gTraffic-${role})`} strokeWidth={2} name="Page Views" dot={false} activeDot={{ r:4, fill:cfg.accent }} isAnimationActive={!reduced} animationDuration={600} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        <motion.div {...fade(0.16)} className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col">
          <h3 className="text-sm font-bold text-slate-200 mb-5">Recent Activity</h3>
          <div className="flex-1 space-y-3 max-h-[240px] overflow-y-auto pr-1" style={{ scrollbarWidth:'thin', scrollbarColor:'#1e293b transparent' }}>
            {recentActivities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-10"><Bell className="w-7 h-7 text-slate-700" /><p className="text-xs text-slate-500 font-semibold">All quiet</p></div>
            ) : recentActivities.map((a, i) => <ActivityItem key={i} a={a} />)}
          </div>
        </motion.div>
      </div>

      {/* QUICK ACTIONS */}
      <motion.div {...fade(0.28)} className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
        <div className="flex items-center gap-1.5 mb-4 text-sm font-bold text-slate-200"><Zap className="w-4 h-4 text-amber-400" /> Quick Actions</div>
        <motion.div className={`grid gap-4 ${role === 'President' ? 'grid-cols-3 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-4'}`} variants={cvars} initial="hidden" animate="show">
          {quickActions.map(a => <QuickAction key={a.label} a={a} />)}
        </motion.div>
      </motion.div>

    </div>
  );
}