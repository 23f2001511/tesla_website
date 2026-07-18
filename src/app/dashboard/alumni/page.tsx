'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, GraduationCap, Layers, Calendar, CheckCircle2, Clock,
  FileText, BookOpen, Trophy, Star, Activity, ArrowRight, MapPin, RefreshCw,
} from 'lucide-react';

interface OverviewData {
  stats: {
    totalMembers: number; totalAlumni: number; totalTeams: number;
    totalEvents: number; completedEvents: number; upcomingEvents: number;
    totalBlogs: number; publishedBlogs: number;
    totalAchievements: number; featuredAchievements: number; totalResources: number;
  };
  upcomingEvents: { id: string; title: string; date: string; venue: string; category: string; poster: string }[];
  latestAchievements: { id: string; title: string; category: string; coverImage: string; date: string; teamMembers: string[] }[];
  recentActivity: { type: string; text: string; createdAt: string }[];
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) {
  return (
    <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex flex-col gap-2">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <p className="text-2xl font-black text-white font-mono leading-none">{value}</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide leading-tight">{label}</p>
    </div>
  );
}

export default function AlumniOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/alumni')
      .then((r) => r.json())
      .then((d) => (d.success ? setData(d) : setError(d.error || 'Failed to load')))
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" /> Loading overview...
      </div>
    );
  }
  if (error || !data) {
    return <div className="text-center text-red-400 py-20">{error || 'No data available'}</div>;
  }

  const { stats } = data;
  const cards = [
    { icon: Users,        label: 'Club Members',         value: stats.totalMembers,        accent: '#60a5fa' },
    { icon: GraduationCap,label: 'Alumni',               value: stats.totalAlumni,         accent: '#a78bfa' },
    { icon: Layers,       label: 'Teams',                value: stats.totalTeams,          accent: '#34d399' },
    { icon: Calendar,     label: 'Total Events',         value: stats.totalEvents,         accent: '#f472b6' },
    { icon: CheckCircle2, label: 'Completed Events',     value: stats.completedEvents,     accent: '#4ade80' },
    { icon: Clock,        label: 'Upcoming Events',      value: stats.upcomingEvents,      accent: '#fbbf24' },
    { icon: FileText,     label: 'Total Blogs',          value: stats.totalBlogs,          accent: '#38bdf8' },
    { icon: FileText,     label: 'Published Blogs',      value: stats.publishedBlogs,      accent: '#818cf8' },
    { icon: Trophy,       label: 'Club Achievements',    value: stats.totalAchievements,   accent: '#fb923c' },
    { icon: Star,         label: 'Featured Achievements',value: stats.featuredAchievements,accent: '#facc15' },
    { icon: BookOpen,     label: 'Resources',            value: stats.totalResources,      accent: '#2dd4bf' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Alumni Overview</h1>
        <p className="text-gray-400 mt-1">A snapshot of the club today — welcome back!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming events */}
        <div className="glass rounded-2xl border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-400" /> Upcoming Events</h2>
            <Link href="/dashboard/alumni/insights" className="text-xs text-primary flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-3">
            {data.upcomingEvents.length === 0 && <p className="text-sm text-gray-500">No upcoming events.</p>}
            {data.upcomingEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="w-11 h-11 rounded-lg bg-amber-500/10 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-amber-400 uppercase">{new Date(e.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className="text-sm font-black text-white leading-none">{new Date(e.date).getDate()}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{e.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" /> {e.venue} · {e.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="glass rounded-2xl border border-white/[0.06] p-5">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-4"><Activity className="w-4 h-4 text-sky-400" /> Recent Club Activity</h2>
          <div className="space-y-3">
            {data.recentActivity.length === 0 && <p className="text-sm text-gray-500">No recent activity.</p>}
            {data.recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${a.type === 'blog' ? 'bg-sky-400' : a.type === 'event' ? 'bg-pink-400' : 'bg-orange-400'}`} />
                <div className="min-w-0">
                  <p className="text-sm text-gray-300 leading-snug">{a.text}</p>
                  <p className="text-[10px] text-gray-600">{fmtDate(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest achievements */}
        <div className="glass rounded-2xl border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2"><Trophy className="w-4 h-4 text-orange-400" /> Latest Achievements</h2>
            <Link href="/dashboard/alumni/insights" className="text-xs text-primary flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-3">
            {data.latestAchievements.length === 0 && <p className="text-sm text-gray-500">No achievements yet.</p>}
            {data.latestAchievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-orange-500/10 shrink-0 flex items-center justify-center">
                  {a.coverImage
                    ? <img src={a.coverImage} alt={a.title} className="w-full h-full object-cover" />
                    : <Trophy className="w-5 h-5 text-orange-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{a.title}</p>
                  <p className="text-xs text-gray-500 truncate">{a.category}{a.date ? ` · ${fmtDate(a.date)}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
