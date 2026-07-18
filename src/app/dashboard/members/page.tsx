'use client';

import {
  FileText, Calendar, BookOpen, Trophy, Star, Eye, RefreshCw,
  Clock, CheckCircle2, Edit, ArrowRight, Zap, Upload, PenLine,
  Users, TrendingUp, Award, ChevronRight, Bell, ExternalLink,
  BarChart2, Activity, Flame, Target, Hash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import ProfileDrawer from '@/components/profile/ProfileForm';
import { isAchievementManager } from '@/lib/permissions';

// ─── Primitives ───────────────────────────────────────────────────────────────

function GlassCard({ children, className = '', onClick }: {
  children: React.ReactNode; className?: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-white/[0.06] bg-white/[0.025] backdrop-blur-xl
        shadow-xl shadow-black/20 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-white">{children}</h3>
        {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const bars = 7;
  return (
    <div className="flex items-end gap-0.5 h-6">
      {Array.from({ length: bars }).map((_, i) => {
        const height = Math.max(15, Math.min(100,
          i === bars - 1 ? 100 :
          i === bars - 2 ? 70 :
          i === bars - 3 ? 85 :
          20 + Math.sin(i * 1.2) * 30 + (value / (max || 1)) * 20
        ));
        return (
          <div
            key={i}
            className="w-1 rounded-sm transition-all"
            style={{
              height: `${height}%`,
              background: i === bars - 1 ? color : `${color}40`,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, accent, sub, trend }: {
  icon: any; label: string; value: number | string;
  accent: string; sub?: string; trend?: number;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] flex flex-col gap-3 group transition-all hover:border-white/[0.12]"
    >
      <div className="flex items-start justify-between">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18` }}
        >
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <MiniBar value={Number(value)} max={50} color={accent} />
      </div>
      <div>
        <p className="text-2xl font-black text-white font-mono leading-none">{value}</p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">{label}</p>
        {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-bold">+{trend} this month</span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────

function QuickAction({ icon: Icon, label, sub, accent, onClick }: {
  icon: any; label: string; sub: string; accent: string; onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.02]
        hover:bg-white/[0.05] hover:border-white/[0.10] transition-all text-left w-full group"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}18` }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white group-hover:text-white transition-colors">{label}</p>
        <p className="text-[10px] text-slate-600">{sub}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors shrink-0" />
    </motion.button>
  );
}

// ─── Upcoming Event Row ───────────────────────────────────────────────────────

function EventRow({ event, index }: { event: any; index: number }) {
  const date = new Date(event.date);
  const isUpcoming = date >= new Date();
  const day = date.toLocaleDateString('en-IN', { day: '2-digit' });
  const mon = date.toLocaleDateString('en-IN', { month: 'short' });

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.04] bg-white/[0.015]
        hover:border-white/[0.08] hover:bg-white/[0.03] transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center shrink-0">
        <span className="text-[11px] font-black text-indigo-400 leading-none">{day}</span>
        <span className="text-[9px] text-indigo-400/60 uppercase">{mon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{event.title}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {date.toLocaleDateString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isUpcoming && (
        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase shrink-0">
          Soon
        </span>
      )}
    </motion.div>
  );
}

// ─── Activity Item ────────────────────────────────────────────────────────────

function ActivityItem({ item, index }: { item: any; index: number }) {
  const typeColors: Record<string, string> = {
    Blog: '#3b82f6',
    Resource: '#6366f1',
    Event: '#8b5cf6',
    System: '#10b981',
    Achievement: '#f59e0b',
  };
  const color = typeColors[item.type] || '#6366f1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex gap-3 items-start group"
    >
      <div className="relative mt-0.5">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border"
          style={{ background: `${color}12`, borderColor: `${color}25` }}
        >
          <Activity className="w-3 h-3" style={{ color }} />
        </div>
        {index < 4 && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-px h-4 bg-white/[0.04]" />
        )}
      </div>
      <div className="flex-1 pb-4">
        <p className="text-xs text-slate-300 font-medium leading-relaxed">{item.action}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono text-slate-600">{item.time}</span>
          <span
            className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded"
            style={{ color, background: `${color}12` }}
          >
            {item.type}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function MembersDashboardWorkspace() {
  const router = useRouter();
  const [dbData, setDbData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);

  const fetchDashboardDataset = async () => {
    try {
      const res = await fetch('/api/dashboard/members');
      const data = await res.json();
      if (data.success) {
        setDbData(data);
        setLoadError(false);
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error(err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardDataset(); }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-screen gap-3 text-xs font-mono text-slate-500 bg-[#080c14]">
      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
      Loading your workspace...
    </div>
  );

  if (loadError || !dbData) return (
    <div className="flex flex-col justify-center items-center h-screen gap-3 text-xs font-mono text-slate-500 bg-[#080c14]">
      <p>Couldn&apos;t load your workspace.</p>
      <button
        onClick={() => { setLoading(true); fetchDashboardDataset(); }}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black text-indigo-400
          border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all"
      >
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </div>
  );

  const user = dbData?.user;
  const stats = dbData?.stats;
  const timeline = dbData?.timeline || [];
  const blogs = dbData?.blogs || [];
  const events = dbData?.events || [];

  const initials = (user?.name || 'EA')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const upcomingEvents = events.filter((e: any) => new Date(e.date) >= new Date()).slice(0, 4);
  const pastEvents = events.filter((e: any) => new Date(e.date) < new Date()).slice(0, 2);
  const displayEvents = [...upcomingEvents, ...pastEvents].slice(0, 4);

  const statCards = [
    {
      icon: FileText, label: 'Blogs Written',
      value: stats?.blogsWritten || 0, accent: '#3b82f6',
      sub: 'Published articles', trend: 0,
    },
    {
      icon: Calendar, label: 'Events Attended',
      value: stats?.approvedEvents || 0, accent: '#8b5cf6',
      sub: 'Club participations', trend: 0,
    },
    {
      icon: BookOpen, label: 'Resources Shared',
      value: stats?.resourcesUploaded || 0, accent: '#6366f1',
      sub: 'Study materials', trend: 0,
    },
    {
      icon: Trophy, label: 'Achievements',
      value: stats?.achievementsCount || 0, accent: '#f59e0b',
      sub: 'Milestones earned',
    },
    {
      icon: Star, label: 'Skills Listed',
      value: stats?.skillsCount || 0, accent: '#10b981',
      sub: 'Technologies & tools',
    },
    {
      icon: Eye, label: 'Profile Views',
      value: stats?.profileViews ?? 0, accent: '#ec4899',
      sub: 'Total impressions',
    },
  ];

  return (
    <div className="min-h-screen pb-20 bg-[#080c14] text-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* ── Drawer ── */}
        <AnimatePresence>
          {openDrawer && (
            <ProfileDrawer
              user={user}
              onClose={() => setOpenDrawer(false)}
              onSaveSuccess={fetchDashboardDataset}
            />
          )}
        </AnimatePresence>

        {/* ── HERO ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.06]">
            {/* Banner */}
            <div className="h-28 relative overflow-hidden"
              style={{
                background: user?.preferences?.coverBanner
                  ? `url(${user.preferences.coverBanner}) center/cover`
                  : 'linear-gradient(135deg, #0a0f1e 0%, #1e1040 40%, #0f1a2e 70%, #080c14 100%)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-transparent to-transparent" />
              {/* Ambient glow */}
              <div className="absolute top-2 left-1/3 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full" />
              <div className="absolute top-0 right-1/4 w-32 h-32 bg-purple-500/10 blur-2xl rounded-full" />
            </div>

            {/* Content row */}
            <div className="bg-[#080c14]/90 backdrop-blur-sm px-6 pb-5 -mt-12 relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex items-end gap-4">
                  {/* Avatar */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#080c14] shadow-xl ring-1 ring-white/10 shrink-0"
                  >
                    {user?.profileImage
                      ? <img src={user.profileImage} className="w-full h-full object-cover" alt={user.name} />
                      : <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center text-2xl font-black text-white">{initials}</div>
                    }
                    {user?.isVerified && (
                      <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-indigo-500 border border-[#080c14] flex items-center justify-center">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </motion.div>

                  {/* Info */}
                  <div className="pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-black text-white tracking-tight">{user?.name}</h1>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 uppercase tracking-widest">
                        {user?.role || 'Member'}
                      </span>
                      {user?.preferences?.openToCollaboration && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Open to collab
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {user?.email}
                      {user?.team && <span className="text-slate-600"> · {user.team}</span>}
                      {user?.designation && <span className="text-slate-600"> · {user.designation}</span>}
                    </p>
                    {user?.bio && (
                      <p className="text-[11px] text-slate-400 mt-1 max-w-md leading-relaxed line-clamp-1">{user.bio}</p>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/dashboard/profile')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]
                      hover:bg-white/[0.08] hover:border-white/[0.14] text-white transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" /> View Profile
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setOpenDrawer(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-500
                      hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Profile
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── STAT CARDS ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3"
        >
          {statCards.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </motion.div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Activity + Quick Actions ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="lg:col-span-2 space-y-5"
          >
            {/* Recent Activity */}
            <GlassCard className="p-5">
              <SectionTitle sub="Your latest actions in the club">Recent Activity</SectionTitle>
              {timeline.length > 0
                ? (
                  <div className="space-y-0">
                    {timeline.slice(0, 5).map((item: any, i: number) => (
                      <ActivityItem key={i} item={item} index={i} />
                    ))}
                  </div>
                )
                : (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Activity className="w-8 h-8 text-slate-800" />
                    <p className="text-xs text-slate-600 font-medium">No activity yet</p>
                    <p className="text-[10px] text-slate-700">Start by writing a blog or uploading a resource</p>
                  </div>
                )
              }
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard className="p-5">
              <SectionTitle sub="Jump into your most used features">Quick Actions</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <QuickAction
                  icon={PenLine} label="Write a Blog" sub="Share your knowledge"
                  accent="#3b82f6" onClick={() => router.push('/dashboard/members/blogs')}
                />
                <QuickAction
                  icon={Upload} label="Upload Resource" sub="Study material, notes"
                  accent="#6366f1" onClick={() => router.push('/dashboard/resources')}
                />
                <QuickAction
                  icon={Calendar} label="Browse Events" sub="Upcoming club events"
                  accent="#8b5cf6" onClick={() => router.push('/dashboard/members/events')}
                />
                <QuickAction
                  icon={Trophy} label="Add Club Achievements" sub="View your milestones"
                  accent="#f59e0b" onClick={() => router.push('/dashboard/members/achievments')}
                />
                {/* Visible only to members holding the Achievement Manager grant.
                    Reuses the existing club Achievement module — no duplicate page. */}
                {isAchievementManager(user?.permissions) && (
                  <QuickAction
                    icon={Award} label="Add Club Achievement" sub="Log a club-wide milestone"
                    accent="#34d399" onClick={() => router.push('/admin/achievements')}
                  />
                )}
              </div>
            </GlassCard>

            {/* Blogs Table */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.18em] text-white">Recent Blogs</h3>
                  <p className="text-[10px] text-slate-600 mt-0.5">Your published articles</p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/members/blogs')}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {blogs.length > 0
                ? (
                  <div className="space-y-2">
                    {blogs.slice(0, 4).map((b: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl
                          border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]
                          hover:border-white/[0.08] transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{b.title}</p>
                            <p className="text-[10px] text-slate-600 font-mono">
                              {b.category} · {new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0 font-mono">
                          <Eye className="w-3 h-3" /> {b.views || 0}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )
                : (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <FileText className="w-7 h-7 text-slate-800" />
                    <p className="text-xs text-slate-600">No blogs yet</p>
                    <button
                      onClick={() => router.push('/dashboard/members/blogs')}
                      className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Write your first blog →
                    </button>
                  </div>
                )
              }
            </GlassCard>
          </motion.div>

          {/* ── RIGHT: Upcoming Events + Team + Profile Completion ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="space-y-5"
          >
            {/* Profile Completion Widget */}
            {(() => {
              const checks = [
                !!user?.bio, !!user?.profileImage, !!user?.phone,
                !!user?.portfolio, !!user?.socialLinks?.github,
                (user?.skills?.length || 0) > 0, !!user?.location,
              ];
              const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
              const r = 30;
              const circ = 2 * Math.PI * r;
              const offset = circ - (pct / 100) * circ;
              const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
              const missing = [
                !user?.bio && 'Bio',
                !user?.profileImage && 'Profile Photo',
                !user?.phone && 'Phone',
                !user?.portfolio && 'Portfolio',
                !user?.socialLinks?.github && 'GitHub',
                (user?.skills?.length || 0) === 0 && 'Skills',
                !user?.location && 'Location',
              ].filter(Boolean) as string[];

              return (
                <GlassCard className="p-5">
                  <SectionTitle>Profile Strength</SectionTitle>
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <svg width="72" height="72" viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="4"
                          strokeDasharray={circ} strokeDashoffset={offset}
                          strokeLinecap="round" transform="rotate(-90 36 36)"
                          style={{ transition: 'stroke-dashoffset 1s ease' }}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">{pct}%</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white mb-1">
                        {pct >= 80 ? 'Looking great!' : pct >= 50 ? 'Almost there' : 'Complete your profile'}
                      </p>
                      {missing.slice(0, 3).map(m => (
                        <p key={m} className="text-[10px] text-slate-600 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-slate-700" />{m}
                        </p>
                      ))}
                      {missing.length > 3 && <p className="text-[10px] text-slate-700">+{missing.length - 3} more</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenDrawer(true)}
                    className="mt-4 w-full py-2 rounded-xl text-[11px] font-black text-indigo-400
                      border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all"
                  >
                    Complete Profile →
                  </button>
                </GlassCard>
              );
            })()}

            {/* Upcoming Events */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.18em] text-white">Upcoming Events</h3>
                  <p className="text-[10px] text-slate-600 mt-0.5">Next on the calendar</p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/members/events')}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {displayEvents.length > 0
                ? (
                  <div className="space-y-2">
                    {displayEvents.map((e: any, i: number) => <EventRow key={i} event={e} index={i} />)}
                  </div>
                )
                : (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Calendar className="w-7 h-7 text-slate-800" />
                    <p className="text-xs text-slate-600">No upcoming events</p>
                  </div>
                )
              }
            </GlassCard>

            {/* Team + Member Info */}
            <GlassCard className="p-5">
              <SectionTitle>Member Info</SectionTitle>
              <div className="space-y-3">
                {[
                  { label: 'Team', value: user?.team || 'Unassigned', icon: Users, color: '#6366f1' },
                  { label: 'Branch', value: user?.branch || '—', icon: Hash, color: '#8b5cf6' },
                  { label: 'Role', value: user?.role || 'Member', icon: Target, color: '#3b82f6' },
                  { label: 'Joined', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—', icon: Clock, color: '#10b981' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-600 uppercase tracking-wide font-bold">{label}</span>
                      <span className="text-xs font-bold text-slate-300">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Skills snapshot */}
            {(user?.skills?.length || 0) > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.18em] text-white">Top Skills</h3>
                  <span className="text-[10px] text-slate-600">{user.skills.length} total</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.slice(0, 8).map((skill: string, i: number) => (
                    <span key={i}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-white/[0.06]
                        bg-white/[0.02] text-slate-300 hover:border-indigo-500/30 hover:text-indigo-300
                        hover:bg-indigo-500/5 transition-all cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                  {user.skills.length > 8 && (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-white/[0.04] text-slate-600">
                      +{user.skills.length - 8}
                    </span>
                  )}
                </div>
              </GlassCard>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}