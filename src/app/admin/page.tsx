'use client';

import { motion, AnimatePresence, cubicBezier, useReducedMotion } from 'framer-motion';
import { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import Link from 'next/link';
import {
  Users, Calendar, FileText, Activity, TrendingUp, TrendingDown,
  RefreshCw, BookOpen, GraduationCap, Bell, ArrowRight, Sparkles, Zap, AlertTriangle
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OverviewData {
  stats: {
    totalMembers: number; totalEvents: number; totalBlogs: number;
    pendingBlogs: number; alumniCount: number; memberGrowthPercent: number;
    totalVisitsLast7: number;
  };
  trafficData: { name: string; visitors: number; pageViews: number }[];
  membersGrowthData: { name: string; members: number }[];
  recentActivities: { type: string; text: string; createdAt: string }[];
  upcomingEvents: {
    title: string; day: string; dateNum: number; time: string;
    location: string; category: string;
  }[];
}

const REFRESH_INTERVAL_MS = 60_000;
const FOCUS_REFETCH_STALE_MS = 30_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Single RAF loop counting component
const AnimatedNumber = memo(function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const from = prevValue.current;
    const duration = 700;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else prevValue.current = value;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <>{display.toLocaleString()}</>;
});

// Recharts Tooltip Custom Decorator
const ChartTooltip = memo(function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-950/90 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs">
      <p className="text-slate-200 font-bold mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: <strong className="text-white font-extrabold">{p.value.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
});

// Modern Skeleton Template Loading Matrix
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 bg-white/5 border border-white/10 rounded-3xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white/5 border border-white/5 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-72 bg-white/5 border border-white/5 rounded-2xl" />
        <div className="h-72 bg-white/5 border border-white/5 rounded-2xl" />
      </div>
    </div>
  );
}

// Motion Variants
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: cubicBezier(0.22, 1, 0.36, 1) } },
};

// Premium Grid Metric Cards
const StatCard = memo(function StatCard({ s }: { s: any }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      className="relative group block bg-gradient-to-b from-white/[0.02] to-transparent border border-white/10 hover:border-white/20 p-5 rounded-2xl transition-all shadow-lg overflow-hidden"
    >
      <Link href={s.href} className="flex flex-col justify-between h-full group focus:outline-none">
        {/* Subtle Accent Glow Ring */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500"
          style={{ background: `radial-gradient(circle at 20% 0%, ${s.accent}15, transparent 60%)` }}
        />

        <div className="flex items-center justify-between relative z-10">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3"
            style={{ backgroundColor: `${s.accent}15`, borderColor: `${s.accent}30` }}
          >
            <s.icon className="w-5 h-5" style={{ color: s.accent }} />
          </div>
          {s.change !== null && s.change !== undefined && (
            <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${s.change >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {s.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {s.change >= 0 ? '+' : ''}{s.change}%
            </span>
          )}
          {s.sub && (
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              {s.sub}
            </span>
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
  blog: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400', Icon: FileText },
  event: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', Icon: Calendar },
  member: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', Icon: Users },
};

const ActivityItem = memo(function ActivityItem({ a }: { a: { type: string; text: string; createdAt: string } }) {
  const meta = activityMeta[a.type] || { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400', Icon: Activity };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className="flex items-start gap-3.5 p-1"
    >
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

const eventColors = [
  { text: 'text-indigo-400', border: 'border-indigo-500/20', fill: 'bg-indigo-500/10', gradient: 'from-indigo-500 to-indigo-600' },
  { text: 'text-purple-400', border: 'border-purple-500/20', fill: 'bg-purple-500/10', gradient: 'from-purple-500 to-purple-600' },
  { text: 'text-blue-400', border: 'border-blue-500/20', fill: 'bg-blue-500/10', gradient: 'from-blue-500 to-blue-600' },
  { text: 'text-cyan-400', border: 'border-cyan-500/20', fill: 'bg-cyan-500/10', gradient: 'from-cyan-500 to-cyan-600' },
];

const EventItem = memo(function EventItem({ ev, index }: { ev: any; index: number }) {
  const scheme = eventColors[index % eventColors.length];
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.04 * index }}
      whileHover={{ x: 3 }}
      className="relative flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${scheme.gradient} rounded-l-full`} />
      
      <div className={`flex flex-col items-center justify-center min-w-[42px] h-11 rounded-lg font-black ${scheme.text}`}>
        <span className="text-[9px] uppercase tracking-wider font-bold opacity-60">{ev.day}</span>
        <span className="text-lg leading-none mt-0.5">{ev.dateNum}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-200 truncate">{ev.title}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{ev.time} · {ev.location}</p>
      </div>

      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${scheme.text} ${scheme.border} ${scheme.fill} whitespace-nowrap`}>
        {ev.category}
      </span>
    </motion.div>
  );
});

const QuickActionItem = memo(function QuickActionItem({ a }: { a: any }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
      <Link 
        href={a.href} 
        style={{ '--action-clr': a.color } as any}
        className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-[color-mix(in_srgb,var(--action-clr)_8%,transparent)] hover:border-[color-mix(in_srgb,var(--action-clr)_35%,transparent)] text-center transition-all group focus:outline-none"
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-rotate-3" style={{ backgroundColor: `${a.color}15` }}>
          <a.icon className="w-5 h-5" style={{ color: a.color }} />
        </div>
        <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">{a.label}</span>
      </Link>
    </motion.div>
  );
});

const PulseItem = memo(function PulseItem({ p }: { p: any }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -2 }}>
      <Link 
        href={p.href} 
        className="flex items-center gap-3.5 p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/15 transition-all group focus:outline-none"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105" style={{ backgroundColor: `${p.color}15` }}>
          <p.icon className="w-4 h-4" style={{ color: p.color }} />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-black text-white leading-none"><AnimatedNumber value={p.value} /></p>
          <p className="text-[11px] font-medium text-slate-400 mt-1">{p.label}</p>
        </div>
      </Link>
    </motion.div>
  );
});

// ─── Main Administrative Overview ─────────────────────────────────────────────
export default function AdminOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [justRefreshed, setJustRefreshed] = useState(false);

  const lastFetchRef = useRef<number>(0);
  const prefersReducedMotion = useReducedMotion();

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/overview', { cache: 'no-store' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to load dashboard data');
      }
      setData(await res.json());
      setError('');
      setLastUpdated(new Date());
      lastFetchRef.current = Date.now();
      if (isRefresh) {
        setJustRefreshed(true);
        setTimeout(() => setJustRefreshed(false), 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => fetchData(true), REFRESH_INTERVAL_MS);
    const onFocus = () => {
      if (Date.now() - lastFetchRef.current > FOCUS_REFETCH_STALE_MS) {
        fetchData(true);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onFocus();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchData]);

  const statCards = useMemo(() => {
    if (!data) return [];
    const { stats } = data;
    return [
      { title: 'Total Members', value: stats.totalMembers, change: stats.memberGrowthPercent, icon: Users, href: '/admin/members', accent: '#6366f1' },
      { title: 'Events Directory', value: stats.totalEvents, change: null, icon: Calendar, href: '/admin/events', accent: '#3b82f6' },
      { title: 'Blogs Index', value: stats.totalBlogs, sub: stats.pendingBlogs > 0 ? `${stats.pendingBlogs} pending` : null, icon: FileText, href: '/admin/blogs', accent: '#8b5cf6' },
      { title: 'Visits (Last 7d)', value: stats.totalVisitsLast7, change: null, icon: Activity, href: '/admin', accent: '#06b6d4' },
    ];
  }, [data]);

  const pulseData = useMemo(() => {
    if (!data) return [];
    const { stats } = data;
    return [
      { label: 'Alumni Network', value: stats.alumniCount, icon: GraduationCap, href: '/admin/alumni', color: '#f59e0b' },
      { label: 'Total Publications', value: stats.totalBlogs, icon: FileText, href: '/admin/blogs', color: '#8b5cf6' },
      { label: 'Pending Review', value: stats.pendingBlogs, icon: Bell, href: '/admin/blogs', color: '#ef4444' },
      { label: 'Total Events', value: stats.totalEvents, icon: Calendar, href: '/admin/events', color: '#3b82f6' },
    ];
  }, [data]);

  const quickActions = useMemo(() => [
    { label: 'Add Member', icon: Users, href: '/admin/members', color: '#6366f1' },
    { label: 'Create Event', icon: Calendar, href: '/admin/events', color: '#3b82f6' },
    { label: 'Write Blog', icon: FileText, href: '/admin/blogs', color: '#8b5cf6' },
    { label: 'Upload Resource', icon: BookOpen, href: '/admin/resources', color: '#06b6d4' },
  ], []);

  const hasTraffic = useMemo(() => !!data?.trafficData.some(d => d.pageViews > 0), [data]);
  const hasGrowth = useMemo(() => !!data?.membersGrowthData.some(d => d.members > 0), [data]);

  const fade = useCallback((delay = 0) => prefersReducedMotion ? {
    initial: { opacity: 1, y: 0 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0 },
  } : {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay, ease: cubicBezier(0.22, 1, 0.36, 1) },
  }, [prefersReducedMotion]);

  const containerVariants = useMemo(() => ({
    hidden: {},
    show: { transition: prefersReducedMotion ? {} : { staggerChildren: 0.05, delayChildren: 0.02 } },
  }), [prefersReducedMotion]);

  if (loading) return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 text-slate-200 min-h-screen">
      <DashboardSkeleton />
    </div>
  );

  if (error || !data) return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 text-slate-200 min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-3 text-center border border-white/10 bg-white/[0.01] p-10 rounded-2xl max-w-md shadow-2xl backdrop-blur-xl">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-base font-bold text-rose-400">Dashboard Failed to Load</p>
        <p className="text-xs text-slate-400 leading-relaxed">{error || 'Something went wrong fetching data.'}</p>
        <button onClick={() => fetchData()} className="mt-3 px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 transition-all">
          Retry Sync
        </button>
      </div>
    </div>
  );

  const { trafficData, membersGrowthData, recentActivities, upcomingEvents } = data;

  return (
    <div className={`max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8 text-slate-200 min-h-screen transition-all duration-500 ${justRefreshed ? 'ring-1 ring-blue-500/20 rounded-3xl bg-blue-500/[0.01]' : ''}`}>
      
      {/* ── Hero Gradient Board ── */}
      <motion.div {...fade(0)} className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 p-6 sm:p-8 shadow-2xl">
        {/* Abstract Fluid Glowing Spheres */}
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 bg-blue-600/15 rounded-full blur-[70px] pointer-events-none animate-[pulse_6s_infinite]" />
        <div className="absolute bottom-[-80px] left-[-60px] w-60 h-60 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none animate-[pulse_8s_infinite]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-black tracking-tight text-white">Welcome back, Admin</h1>
              <motion.span animate={prefersReducedMotion ? {} : { rotate: [0, 10, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </motion.span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-1.5">TESLA Technical Club Node Operations Directory Matrix</p>
            
            {lastUpdated && (
              <div className="flex items-center gap-2 mt-4 text-[11px] text-slate-500 font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Live · Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            )}
          </div>

          {/* Right Action Control Pill Cluster */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-3">
              <div className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl min-w-[110px]">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Pending</span>
                <span className="text-xl font-black text-white leading-none"><AnimatedNumber value={data.stats.pendingBlogs} /></span>
              </div>
              <div className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl max-w-[150px] min-w-[110px]">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Next Event</span>
                <span className="text-xs font-bold text-slate-300 block truncate">{upcomingEvents[0]?.title || 'None Scheduled'}</span>
              </div>
            </div>

            <motion.button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-xl text-xs font-bold text-blue-400 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Syncing...' : 'Refresh'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Analytics Stat Cards Grid ── */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" variants={containerVariants} initial="hidden" animate="show">
        {statCards.map((s) => <StatCard key={s.title} s={s} />)}
      </motion.div>

      {/* ── Main Data Split Layout Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Traffic Chart Card */}
        <motion.div {...fade(0.12)} className="lg:col-span-2 bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-200">Site Traffic Core Metrics</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/5 px-2.5 py-0.5 rounded-full">Last 7 Days</span>
          </div>
          {!hasTraffic ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-2">
              <Activity className="w-8 h-8 text-slate-700" />
              <p className="text-xs text-slate-500 font-semibold">No visits recorded yet</p>
            </div>
          ) : (
            <div className="flex-1 w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTraffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.15)' }} />
                  <Area
                    type="monotone" dataKey="pageViews" stroke="#6366f1" fill="url(#gTraffic)"
                    strokeWidth={2} name="Page Views" dot={false} activeDot={{ r: 4, fill: '#6366f1' }}
                    isAnimationActive={!prefersReducedMotion} animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Recent Updates Monitor Stream */}
        <motion.div {...fade(0.16)} className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-200">Recent Activity Ledger</h3>
            {recentActivities.length > 0 && (
              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 rounded-full">{recentActivities.length} logs</span>
            )}
          </div>
          <div className="flex-1 space-y-4 max-h-[230px] overflow-y-auto pr-1 custom-scrollbar">
            {recentActivities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                <Bell className="w-7 h-7 text-slate-700" />
                <p className="text-xs text-slate-500 font-semibold">Ledger system quiet</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {recentActivities.map((a, i) => (
                  <ActivityItem key={`${a.type}-${a.createdAt}-${i}`} a={a} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Calendars & Growth Matrix Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upcoming Operational Events */}
        <motion.div {...fade(0.2)} className="lg:col-span-2 bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200">Upcoming Live Syncs</h3>
            <Link href="/admin/events" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {upcomingEvents.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center gap-2">
                <Calendar className="w-8 h-8 text-slate-700" />
                <p className="text-xs text-slate-500 font-semibold">Calendar is clean</p>
                <Link href="/admin/events" className="text-xs text-blue-400 hover:underline mt-1">Schedule new sync →</Link>
              </div>
            ) : upcomingEvents.map((ev, i) => (
              <EventItem key={`${ev.title}-${i}`} ev={ev} index={i} />
            ))}
          </div>
        </motion.div>

        {/* Growth Matrix */}
        <motion.div {...fade(0.24)} className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-200">Members Registration Scaling</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/5 px-2.5 py-0.5 rounded-full">6 Months</span>
          </div>
          {!hasGrowth ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
              <Users className="w-8 h-8 text-slate-700" />
              <p className="text-xs text-slate-500 font-semibold">No growth logs registered</p>
            </div>
          ) : (
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={membersGrowthData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gMembers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
                  <Bar
                    dataKey="members" fill="url(#gMembers)" radius={[5, 5, 0, 0]}
                    isAnimationActive={!prefersReducedMotion} animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Quick Pipeline Terminals ── */}
      <motion.div {...fade(0.28)} className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
        <div className="flex items-center gap-1.5 mb-4 text-sm font-bold text-slate-200">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3>Quick Pipeline Terminals</h3>
        </div>
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={containerVariants} initial="hidden" animate="show">
          {quickActions.map((a) => <QuickActionItem key={a.label} a={a} />)}
        </motion.div>
      </motion.div>

      {/* ── Ecosystem Core Pulse ── */}
      <motion.div {...fade(0.32)} className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-200">Ecosystem Core Pulse</h3>
        </div>
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={containerVariants} initial="hidden" animate="show">
          {pulseData.map((p) => <PulseItem key={p.label} p={p} />)}
        </motion.div>
      </motion.div>
    </div>
  );
}