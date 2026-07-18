'use client';

// PI (Professor In-Charge) dashboard — a READ-ONLY oversight & analytics view.
// Every number here comes from /api/dashboard/pi (real DB data, PI-role gated).
// There are intentionally no create/edit/delete affordances on this page.

import { useCallback, useEffect, useState } from 'react';
import {
  Users, Building2, Calendar, FileText, Trophy, GraduationCap,
  Eye, Heart, TicketCheck, Globe, BookOpen, Download, Activity,
  MapPin, Mic, Tag, ExternalLink, Clock, X, Award, Loader2,
  RefreshCw, TrendingUp, UserPlus, ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';
const timeAgo = (d: string | Date) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(d);
};

const PERIODS = [
  { key: '30d', label: '30 Days' },
  { key: '6m', label: '6 Months' },
  { key: '1y', label: '1 Year' },
  { key: 'all', label: 'All Time' },
] as const;
type PeriodKey = (typeof PERIODS)[number]['key'];

// CSS variables so the tooltip follows the dashboard's light/dark theme;
// mid-tone slate lines read as subtle on both backgrounds.
const chartTooltip = {
  contentStyle: {
    background: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 10,
    fontSize: 12,
    color: 'var(--color-card-foreground)',
  },
  labelStyle: { color: 'var(--color-muted-foreground)' },
};

const CHART_GRID_STROKE = 'rgba(148,163,184,0.16)';
const CHART_CURSOR_FILL = 'rgba(148,163,184,0.08)';

// ─── Small shared UI ─────────────────────────────────────────────────────────
function Avatar({ src, name, size = 32 }: { src?: string; name?: string; size?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden shrink-0 bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || ''} className="w-full h-full object-cover" />
      ) : (
        (name || 'U').charAt(0).toUpperCase()
      )}
    </div>
  );
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="sticky top-3 left-full mr-3 z-10 p-2 rounded-full bg-black/50 text-gray-300 hover:text-white">
          <X className="w-4 h-4" />
        </button>
        <div className="px-6 pb-6 -mt-8">{children}</div>
      </div>
    </div>
  );
}

function Cover({ src, alt, icon: Icon, className = 'h-52' }: { src?: string; alt: string; icon: any; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`w-full ${className} object-cover rounded-xl`} />
  ) : (
    <div className={`w-full ${className} rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 flex items-center justify-center`}>
      <Icon className="w-10 h-10 text-white/25" />
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-gray-300">
      <Icon className="w-4 h-4 text-gray-500 shrink-0" />
      <span className="text-gray-500">{label}:</span> <span className="min-w-0">{value}</span>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="p-2 rounded-lg bg-primary/15 text-primary"><Icon className="w-4 h-4" /></div>
      <div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {sub && <p className="text-[11px] text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-xs text-gray-500 py-6 text-center">{text}</p>;
}

// ─── Read-only detail modals ─────────────────────────────────────────────────
function EventModal({ e, onClose }: { e: any; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <Cover src={e.poster} alt={e.title} icon={Calendar} />
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${e.status === 'Upcoming' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'}`}>{e.status}</span>
          {e.category && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300">{e.category}</span>}
        </div>
        <h3 className="text-xl font-bold text-white">{e.title}</h3>
        <div className="space-y-1.5">
          <DetailRow icon={Calendar} label="Date" value={fmtDateTime(e.date)} />
          <DetailRow icon={MapPin} label="Venue" value={e.venue} />
          <DetailRow icon={Mic} label="Speaker" value={e.speaker} />
          <DetailRow icon={TicketCheck} label="Registrations" value={String(e.registrations)} />
        </div>
        {e.description && <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{e.description}</p>}
      </div>
    </Modal>
  );
}

function BlogModal({ b, onClose }: { b: any; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <Cover src={b.coverImage} alt={b.title} icon={FileText} />
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {b.category && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-300">{b.category}</span>}
          <span className="flex items-center gap-1 text-[11px] text-gray-400"><Eye className="w-3 h-3" /> {b.views}</span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400"><Heart className="w-3 h-3" /> {b.likes}</span>
        </div>
        <h3 className="text-xl font-bold text-white">{b.title}</h3>
        <div className="flex items-center gap-2">
          <Avatar src={b.authorImage} name={b.author} size={26} />
          <span className="text-sm text-gray-300">{b.author}</span>
          <span className="text-xs text-gray-500">· {fmtDate(b.createdAt)}</span>
        </div>
        {b.excerpt && <p className="text-sm text-gray-400 leading-relaxed">{b.excerpt}{b.excerpt.length >= 260 ? '…' : ''}</p>}
        {b.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {b.tags.map((t: string) => (
              <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-gray-400 border border-white/10">#{t}</span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function AchievementModal({ a, onClose }: { a: any; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <Cover src={a.coverImage} alt={a.title} icon={Trophy} />
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {a.category && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300">{a.category}</span>}
        </div>
        <h3 className="text-xl font-bold text-white">{a.title}</h3>
        <div className="space-y-1.5">
          <DetailRow icon={Calendar} label="Date" value={fmtDate(a.achievementDate)} />
          <DetailRow icon={MapPin} label="Venue" value={a.venue} />
          <DetailRow icon={Building2} label="Organizer" value={a.organizer} />
          <DetailRow icon={Users} label="Team" value={a.teamMembers?.length ? a.teamMembers.join(', ') : ''} />
        </div>
        {a.description && <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{a.description}</p>}
        {a.eventLink && (
          <a href={a.eventLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
            <ExternalLink className="w-3.5 h-3.5" /> Event / certificate link
          </a>
        )}
        {a.gallery?.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {a.gallery.slice(0, 6).map((g: string, i: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={g} alt="" className="h-20 w-full object-cover rounded-lg" />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function TeamModal({ t, onClose }: { t: any; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <Cover src={t.coverImage} alt={t.name} icon={Users} className="h-40" />
      <div className="mt-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold text-white">{t.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
              {t.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Created {fmtDate(t.createdAt)}</p>
          {t.description && <p className="text-sm text-gray-400 mt-2 leading-relaxed">{t.description}</p>}
        </div>

        {t.lead ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <Avatar src={t.lead.profileImage} name={t.lead.name} size={36} />
            <div>
              <p className="text-sm font-semibold text-white">{t.lead.name}</p>
              <p className="text-[11px] text-emerald-400 font-semibold">Team Leader</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> No leader assigned</p>
        )}

        {/* Contribution summary */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Members', value: t.memberCount, Icon: Users },
            { label: 'Blogs', value: t.blogs, Icon: FileText },
            { label: 'Events', value: t.events, Icon: Calendar },
            { label: 'Resources', value: t.resources, Icon: BookOpen },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <s.Icon className="w-4 h-4 text-gray-500" />
              <span className="text-lg font-black text-white leading-none">{s.value}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{s.label}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          {t.lastActivity ? `Last blog contribution ${timeAgo(t.lastActivity)}` : 'No blog contributions yet'}
        </p>

        {/* Members */}
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Members ({t.members.length})</p>
          {t.members.length === 0 ? (
            <EmptyNote text="No members assigned to this team yet." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {t.members.map((m: any) => (
                <div key={m._id} className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <Avatar src={m.profileImage} name={m.name} size={30} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-200 truncate">{m.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{m.designation || m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── Chart card ──────────────────────────────────────────────────────────────
function TrendCard({ title, icon: Icon, color, data, kind = 'area' }: {
  title: string; icon: any; color: string; data: { label: string; count: number }[]; kind?: 'area' | 'bar';
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const gid = `grad-${title.replace(/\s/g, '')}`;
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-xs font-bold text-gray-300"><Icon className="w-3.5 h-3.5" style={{ color }} /> {title}</span>
        <span className="text-xs font-black text-white">{total}<span className="text-gray-500 font-medium"> in period</span></span>
      </div>
      <div className="h-40">
        {total === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-600">No data in this period</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {kind === 'area' ? (
              <AreaChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...chartTooltip} />
                <Area type="monotone" dataKey="count" stroke={color} strokeWidth={2} fill={`url(#${gid})`} name={title} />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...chartTooltip} cursor={{ fill: CHART_CURSOR_FILL }} />
                <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} name={title} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PIDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>('6m');

  const [selEvent, setSelEvent] = useState<any>(null);
  const [selBlog, setSelBlog] = useState<any>(null);
  const [selAch, setSelAch] = useState<any>(null);
  const [selTeam, setSelTeam] = useState<any>(null);

  const load = useCallback(async (p: PeriodKey, soft = false) => {
    if (soft) setRefreshing(true);
    try {
      const res = await fetch(`/api/dashboard/pi?period=${p}`);
      if (res.status === 401 || res.status === 403) { setForbidden(true); return; }
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(period, !loading); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [period]);

  if (forbidden) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
        <ShieldAlert className="w-10 h-10 text-rose-400" />
        <h1 className="text-lg font-bold text-white">PI access only</h1>
        <p className="text-xs text-gray-500 max-w-sm">This oversight dashboard is restricted to the Professor In-Charge account.</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-xs text-gray-400">Loading club analytics…</span>
      </div>
    );
  }

  const { kpis, series, teams, activity, events, blogs, achievements, visibility } = data;

  const kpiCards = [
    { label: 'Total Members', value: kpis.totalMembers, Icon: Users, color: '#60a5fa', delta: kpis.newMembers30d, deltaLabel: 'joined in 30d' },
    { label: 'Active Teams', value: kpis.activeTeams, Icon: Building2, color: '#34d399', sub: `of ${kpis.totalTeams} total` },
    { label: 'Total Events', value: kpis.totalEvents, Icon: Calendar, color: '#fbbf24', delta: kpis.events30d, deltaLabel: 'added in 30d' },
    { label: 'Published Blogs', value: kpis.publishedBlogs, Icon: FileText, color: '#a78bfa', delta: kpis.blogs30d, deltaLabel: 'in 30d' },
    { label: 'Club Achievements', value: kpis.totalAchievements, Icon: Trophy, color: '#f472b6', delta: kpis.achievements30d, deltaLabel: 'in 30d' },
    { label: 'Alumni', value: kpis.alumniCount, Icon: GraduationCap, color: '#38bdf8' },
  ];

  const visibilityTiles = [
    { label: 'Blog Views', value: visibility.blogViews, Icon: Eye, color: '#60a5fa' },
    { label: 'Blog Likes', value: visibility.blogLikes, Icon: Heart, color: '#f472b6' },
    { label: 'Event Registrations', value: visibility.eventRegistrations, Icon: TicketCheck, color: '#fbbf24' },
    { label: 'Resource Views', value: visibility.resourceViews, Icon: BookOpen, color: '#34d399' },
    { label: 'Resource Downloads', value: visibility.resourceDownloads, Icon: Download, color: '#a78bfa' },
    { label: 'Site Visits (all time)', value: visibility.visitsTotal, Icon: Globe, color: '#38bdf8', sub: `${visibility.visits30d} in last 30 days` },
  ];

  const activityIcon: Record<string, { Icon: any; color: string }> = {
    event: { Icon: Calendar, color: '#fbbf24' },
    blog: { Icon: FileText, color: '#a78bfa' },
    achievement: { Icon: Trophy, color: '#f472b6' },
    member: { Icon: UserPlus, color: '#34d399' },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 text-slate-200">
      {/* Modals (all read-only) */}
      {selEvent && <EventModal e={selEvent} onClose={() => setSelEvent(null)} />}
      {selBlog && <BlogModal b={selBlog} onClose={() => setSelBlog(null)} />}
      {selAch && <AchievementModal a={selAch} onClose={() => setSelAch(null)} />}
      {selTeam && <TeamModal t={selTeam} onClose={() => setSelTeam(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">PI Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">Tesla Technical Club oversight and performance analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">Read-only oversight</span>
          <button onClick={() => load(period, true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ── 1. KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{c.label}</span>
              <c.Icon className="w-4 h-4" style={{ color: c.color }} />
            </div>
            <p className="text-2xl font-black text-white mt-1.5">{c.value}</p>
            {typeof c.delta === 'number' && c.delta > 0 ? (
              <p className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +{c.delta} {c.deltaLabel}</p>
            ) : c.sub ? (
              <p className="text-[10px] text-gray-500 mt-0.5">{c.sub}</p>
            ) : (
              <p className="text-[10px] text-gray-600 mt-0.5">No change in 30d</p>
            )}
          </div>
        ))}
      </div>

      {/* ── 2. Club activity analytics ── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SectionTitle icon={Activity} title="Club Activity Analytics" sub="Real created/scheduled dates from the database" />
          <div className="flex items-center gap-1.5 flex-wrap">
            {PERIODS.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                  period === p.key
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : 'bg-white/[0.02] text-gray-400 border-white/10 hover:text-white hover:bg-white/[0.05]'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 transition-opacity ${refreshing ? 'opacity-50' : ''}`}>
          <TrendCard title="Events" icon={Calendar} color="#fbbf24" data={series.events} kind="bar" />
          <TrendCard title="Blogs Published" icon={FileText} color="#a78bfa" data={series.blogs} kind="bar" />
          <TrendCard title="Achievements" icon={Trophy} color="#f472b6" data={series.achievements} kind="bar" />
          <TrendCard title="Member Growth (new joins)" icon={Users} color="#60a5fa" data={series.members} kind="area" />
        </div>
      </section>

      {/* ── 6. Club visibility / engagement ── */}
      <section className="space-y-4">
        <SectionTitle icon={Globe} title="Club Visibility & Engagement" sub="Only metrics actually tracked in the database" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {visibilityTiles.map((t) => (
            <div key={t.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <t.Icon className="w-4 h-4 mb-1.5" style={{ color: t.color }} />
              <p className="text-xl font-black text-white">{t.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{t.label}</p>
              {t.sub && <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">{t.sub}</p>}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Visits trend */}
          <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <span className="flex items-center gap-2 text-xs font-bold text-gray-300 mb-2"><Globe className="w-3.5 h-3.5 text-sky-400" /> Website visits — last 30 days</span>
            <div className="h-44">
              {visibility.visits30d === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-600">No visits recorded in the last 30 days</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={visibility.visitsTrend} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-visits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={30} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip {...chartTooltip} />
                    <Area type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2} fill="url(#grad-visits)" name="Visits" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          {/* Most viewed / most engaged content */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
            <span className="flex items-center gap-2 text-xs font-bold text-gray-300"><Eye className="w-3.5 h-3.5 text-blue-400" /> Top content</span>
            {blogs.topViewed.length === 0 && blogs.topLiked.length === 0 && events.topByRegistrations.length === 0 ? (
              <EmptyNote text="No engagement data recorded yet." />
            ) : (
              <div className="space-y-2">
                {blogs.topViewed.map((b: any) => (
                  <button key={`v-${b._id}`} onClick={() => setSelBlog(b)} className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-primary/40 text-left">
                    <Eye className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-xs text-gray-200 truncate flex-1">{b.title}</span>
                    <span className="text-[10px] font-bold text-blue-300">{b.views}</span>
                  </button>
                ))}
                {blogs.topLiked.map((b: any) => (
                  <button key={`l-${b._id}`} onClick={() => setSelBlog(b)} className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-primary/40 text-left">
                    <Heart className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    <span className="text-xs text-gray-200 truncate flex-1">{b.title}</span>
                    <span className="text-[10px] font-bold text-pink-300">{b.likes}</span>
                  </button>
                ))}
                {events.topByRegistrations.map((e: any) => (
                  <button key={`e-${e._id}`} onClick={() => setSelEvent(e)} className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-primary/40 text-left">
                    <TicketCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs text-gray-200 truncate flex-1">{e.title}</span>
                    <span className="text-[10px] font-bold text-amber-300">{e.registrations}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. Team performance ── */}
      <section className="space-y-4">
        <SectionTitle icon={Building2} title="Team Performance" sub={`${teams.length} team${teams.length === 1 ? '' : 's'} in the Team collection`} />
        {teams.length === 0 ? (
          <EmptyNote text="No teams have been created yet." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {teams.map((t: any) => (
              <button key={t._id} onClick={() => setSelTeam(t)}
                className="text-left rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-primary/40 hover:bg-white/[0.04] transition-colors">
                <div className="relative h-24 bg-gradient-to-br from-blue-600/15 to-violet-600/15">
                  {t.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.coverImage} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Users className="w-7 h-7 text-white/25" /></div>
                  )}
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${t.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-black text-white truncate">{t.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      {t.lead ? (
                        <>
                          <Avatar src={t.lead.profileImage} name={t.lead.name} size={18} />
                          <span className="text-[11px] text-gray-400 truncate">{t.lead.name}</span>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-600">No leader assigned</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'Members', value: t.memberCount },
                      { label: 'Blogs', value: t.blogs },
                      { label: 'Events', value: t.events },
                      { label: 'Res.', value: t.resources },
                    ].map((s) => (
                      <div key={s.label} className="flex flex-col items-center py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-sm font-black text-white leading-none">{s.value}</span>
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wide mt-0.5">{s.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {t.lastActivity ? `Active ${timeAgo(t.lastActivity)}` : 'No recent blog activity'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── 4 & 7. Activity feed + quick monitoring ── */}
      <section className="space-y-4">
        <SectionTitle icon={Activity} title="Recent Club Activity & Quick Monitoring" />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Activity feed */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <span className="flex items-center gap-2 text-xs font-bold text-gray-300 mb-3"><Activity className="w-3.5 h-3.5 text-emerald-400" /> Recent Club Activity</span>
            {activity.length === 0 ? (
              <EmptyNote text="No activity recorded yet." />
            ) : (
              <div className="space-y-2.5">
                {activity.map((a: any, i: number) => {
                  const meta = activityIcon[a.type] || activityIcon.member;
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg shrink-0 mt-0.5" style={{ background: `${meta.color}15` }}>
                        <meta.Icon className="w-3 h-3" style={{ color: meta.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-300 leading-snug">{a.text}</p>
                        <p className="text-[10px] text-gray-600">{timeAgo(a.at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming events */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <span className="flex items-center gap-2 text-xs font-bold text-gray-300 mb-3"><Calendar className="w-3.5 h-3.5 text-amber-400" /> Upcoming Events ({events.upcoming})</span>
            {events.upcomingList.length === 0 ? (
              <EmptyNote text="No upcoming events scheduled." />
            ) : (
              <div className="space-y-2">
                {events.upcomingList.map((e: any) => (
                  <button key={e._id} onClick={() => setSelEvent(e)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-primary/40 text-left">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-amber-400 uppercase leading-none">{new Date(e.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-sm font-black text-white leading-none">{new Date(e.date).getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-200 truncate">{e.title}</p>
                      <p className="text-[10px] text-gray-500 truncate">{e.venue}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Latest blogs */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <span className="flex items-center gap-2 text-xs font-bold text-gray-300 mb-3"><FileText className="w-3.5 h-3.5 text-violet-400" /> Latest Blogs ({blogs.totalPublished})</span>
            {blogs.recent.length === 0 ? (
              <EmptyNote text="No blogs published yet." />
            ) : (
              <div className="space-y-2">
                {blogs.recent.slice(0, 5).map((b: any) => (
                  <button key={b._id} onClick={() => setSelBlog(b)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-primary/40 text-left">
                    <Avatar src={b.authorImage} name={b.author} size={28} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-200 truncate">{b.title}</p>
                      <p className="text-[10px] text-gray-500 truncate">{b.author} · {fmtDate(b.createdAt)}</p>
                    </div>
                    <span className="flex items-center gap-0.5 text-[10px] text-gray-500 shrink-0"><Eye className="w-3 h-3" />{b.views}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Latest achievements */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <span className="flex items-center gap-2 text-xs font-bold text-gray-300 mb-3"><Trophy className="w-3.5 h-3.5 text-pink-400" /> Latest Achievements ({achievements.total})</span>
            {achievements.recent.length === 0 ? (
              <EmptyNote text="No club achievements published yet." />
            ) : (
              <div className="space-y-2">
                {achievements.recent.slice(0, 5).map((a: any) => (
                  <button key={a._id} onClick={() => setSelAch(a)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-primary/40 text-left">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                      {a.coverImage
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={a.coverImage} alt="" className="w-full h-full object-cover" />
                        : <Trophy className="w-3.5 h-3.5 text-pink-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-200 truncate">{a.title}</p>
                      <p className="text-[10px] text-gray-500 truncate">{a.category} · {fmtDate(a.achievementDate)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. Events / Blogs / Achievements insight strip ── */}
      <section className="space-y-4">
        <SectionTitle icon={TrendingUp} title="Insights" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Events breakdown */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
            <span className="flex items-center gap-2 text-xs font-bold text-gray-300"><Calendar className="w-3.5 h-3.5 text-amber-400" /> Events</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total', value: events.total },
                { label: 'Upcoming', value: events.upcoming },
                { label: 'Completed', value: events.completed },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-lg font-black text-white leading-none">{s.value}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase mt-1">{s.label}</span>
                </div>
              ))}
            </div>
            {events.recent.length === 0 ? <EmptyNote text="No events yet." /> : (
              <div className="space-y-1.5">
                {events.recent.slice(0, 4).map((e: any) => (
                  <button key={e._id} onClick={() => setSelEvent(e)} className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-white/[0.04] text-left">
                    <span className="text-xs text-gray-300 truncate">{e.title}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${e.status === 'Upcoming' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'}`}>{e.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Blogs breakdown */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
            <span className="flex items-center gap-2 text-xs font-bold text-gray-300"><FileText className="w-3.5 h-3.5 text-violet-400" /> Blogs</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Published', value: blogs.totalPublished },
                { label: 'Views', value: visibility.blogViews },
                { label: 'Likes', value: visibility.blogLikes },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-lg font-black text-white leading-none">{s.value}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase mt-1">{s.label}</span>
                </div>
              ))}
            </div>
            {blogs.recent.length === 0 ? <EmptyNote text="No blogs yet." /> : (
              <div className="space-y-1.5">
                {blogs.recent.slice(0, 4).map((b: any) => (
                  <button key={b._id} onClick={() => setSelBlog(b)} className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-white/[0.04] text-left">
                    <span className="text-xs text-gray-300 truncate">{b.title}</span>
                    <span className="text-[10px] text-gray-500 shrink-0">{fmtDate(b.createdAt)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Achievements breakdown */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
            <span className="flex items-center gap-2 text-xs font-bold text-gray-300"><Trophy className="w-3.5 h-3.5 text-pink-400" /> Achievements</span>
            {achievements.categories.length === 0 ? <EmptyNote text="No achievements yet." /> : (
              <div className="space-y-1.5">
                {achievements.categories.slice(0, 5).map((c: any) => {
                  const max = achievements.categories[0]?.count || 1;
                  return (
                    <div key={c.name} className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400 w-28 truncate shrink-0">{c.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-pink-400/70" style={{ width: `${(c.count / max) * 100}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-white w-5 text-right shrink-0">{c.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {achievements.recent.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-white/[0.05]">
                {achievements.recent.slice(0, 3).map((a: any) => (
                  <button key={a._id} onClick={() => setSelAch(a)} className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-white/[0.04] text-left">
                    <span className="text-xs text-gray-300 truncate">{a.title}</span>
                    <span className="text-[10px] text-gray-500 shrink-0">{fmtDate(a.achievementDate)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
