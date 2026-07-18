'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Calendar, FileText, Trophy, X, MapPin, Mic, Tag,
  ExternalLink, Users, Building2, Eye, Heart, RefreshCw, Search,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ─── Types (shapes returned by the reused APIs) ──────────────────────────────
interface EventItem {
  id: string; title: string; description: string; date: string; rawDate: string;
  venue: string; category: string; speaker: string; poster: string; isFeatured: boolean;
  status: 'Upcoming' | 'Completed';
}
interface BlogItem {
  id: string; title: string; content: string; category: string; coverImage: string;
  tags: string[]; views: number; likes: number; author: string; authorImage: string; date: string;
}
interface AchievementItem {
  id: string; title: string; description: string; category: string; teamMembers: string[];
  coverImage: string; gallery: string[]; venue: string; achievementDate: string;
  organizer: string; tags: string[]; eventLink: string;
}

type TabKey = 'overview' | 'events' | 'blogs' | 'achievements';
const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'overview',     label: 'Overview',     icon: BarChart3 },
  { key: 'events',       label: 'Events',       icon: Calendar },
  { key: 'blogs',        label: 'Blogs',        icon: FileText },
  { key: 'achievements', label: 'Achievements', icon: Trophy },
];

const PIE_COLORS = ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#38bdf8', '#fb923c', '#2dd4bf'];
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
const countBy = (items: { category?: string }[]) => {
  const map: Record<string, number> = {};
  items.forEach((i) => { const k = i.category || 'Other'; map[k] = (map[k] || 0) + 1; });
  return Object.entries(map).map(([name, count]) => ({ name, count }));
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
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

function Cover({ src, alt, icon: Icon }: { src?: string; alt: string; icon: any }) {
  return src ? (
    <img src={src} alt={alt} className="w-full h-56 object-cover rounded-xl" />
  ) : (
    <div className="w-full h-56 rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 flex items-center justify-center">
      <Icon className="w-12 h-12 text-white/30" />
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

function CardShell({ onClick, cover, icon: Icon, badge, badgeColor, children }: {
  onClick: () => void; cover?: string; icon: any; badge?: string; badgeColor?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-primary/40 hover:bg-white/[0.04] transition-colors"
    >
      <div className="relative h-36 bg-gradient-to-br from-blue-600/15 to-violet-600/15">
        {cover
          ? <img src={cover} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Icon className="w-8 h-8 text-white/25" /></div>}
        {badge && (
          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>{badge}</span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClubInsightsPage() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selEvent, setSelEvent] = useState<EventItem | null>(null);
  const [selBlog, setSelBlog] = useState<BlogItem | null>(null);
  const [selAch, setSelAch] = useState<AchievementItem | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/events').then((r) => r.json()),
      fetch('/api/dashboard/alumni?section=blogs').then((r) => r.json()),
      fetch('/api/achievements').then((r) => r.json()),
    ])
      .then(([ev, bl, ac]) => {
        if (ev.success) {
          setEvents([
            ...(ev.upcoming || []).map((e: any) => ({ ...e, status: 'Upcoming' as const })),
            ...(ev.completed || []).map((e: any) => ({ ...e, status: 'Completed' as const })),
          ]);
        }
        if (bl.success) setBlogs(bl.blogs || []);
        if (ac.success) {
          setAchievements((ac.achievements || []).map((a: any) => ({
            id: a.id, title: a.title, description: a.description || '', category: a.category || 'Other',
            teamMembers: a.teamMembers || [], coverImage: a.coverImage || '', gallery: a.gallery || [],
            venue: a.venue || '', achievementDate: a.achievementDate, organizer: a.organizer || '',
            tags: a.tags || [], eventLink: a.eventLink || '',
          })));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const eventCats = useMemo(() => countBy(events), [events]);
  const blogCats = useMemo(() => countBy(blogs), [blogs]);
  const achCats = useMemo(() => countBy(achievements), [achievements]);

  const q = search.toLowerCase();
  const filteredEvents = events.filter((e) => e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
  const filteredBlogs = blogs.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.category.toLowerCase().includes(q));
  const filteredAch = achievements.filter((a) => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" /> Loading club insights...
      </div>
    );
  }

  const chartAxis = { stroke: '#64748b', fontSize: 11 };
  // CSS variables so charts follow the dashboard's light/dark theme.
  const tooltipStyle = { background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-card-foreground)' };
  const gridStroke = 'rgba(148,163,184,0.16)';
  const cursorFill = 'rgba(148,163,184,0.08)';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Club Insights</h1>
        <p className="text-gray-400 mt-1">A read-only window into everything the club is doing.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 bg-white/[0.03] border border-white/[0.06] hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab !== 'overview' && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tab}...`}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
          />
        </div>
      )}

      {/* ── Overview tab ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Events', value: events.length, sub: `${events.filter((e) => e.status === 'Upcoming').length} upcoming`, color: 'text-amber-400' },
              { label: 'Published Blogs', value: blogs.length, sub: `${blogs.reduce((s, b) => s + b.views, 0)} total views`, color: 'text-sky-400' },
              { label: 'Achievements', value: achievements.length, sub: `${achCats.length} categories`, color: 'text-orange-400' },
              { label: 'Blog Likes', value: blogs.reduce((s, b) => s + b.likes, 0), sub: 'across all blogs', color: 'text-pink-400' },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</p>
                <p className="text-xs text-white font-semibold mt-1">{s.label}</p>
                <p className="text-[10px] text-gray-500">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Events by Category</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={eventCats}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="name" {...chartAxis} />
                  <YAxis allowDecimals={false} {...chartAxis} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: cursorFill }} />
                  <Bar dataKey="count" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Achievements by Category</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={achCats} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {achCats.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {achCats.map((c, i) => (
                  <span key={c.name} className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} /> {c.name} ({c.count})
                  </span>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl border border-white/[0.06] p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-white mb-4">Blogs by Category</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={blogCats}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="name" {...chartAxis} />
                  <YAxis allowDecimals={false} {...chartAxis} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: cursorFill }} />
                  <Bar dataKey="count" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Events tab ── */}
      {tab === 'events' && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEvents.length === 0 && <p className="text-gray-500 text-sm col-span-full">No events found.</p>}
          {filteredEvents.map((e) => (
            <CardShell
              key={e.id}
              onClick={() => setSelEvent(e)}
              cover={e.poster}
              icon={Calendar}
              badge={e.status}
              badgeColor={e.status === 'Upcoming' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}
            >
              <p className="text-sm font-semibold text-white truncate">{e.title}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {e.date}</p>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" /> {e.venue} · {e.category}</p>
            </CardShell>
          ))}
        </div>
      )}

      {/* ── Blogs tab ── */}
      {tab === 'blogs' && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBlogs.length === 0 && <p className="text-gray-500 text-sm col-span-full">No published blogs found.</p>}
          {filteredBlogs.map((b) => (
            <CardShell key={b.id} onClick={() => setSelBlog(b)} cover={b.coverImage} icon={FileText}>
              <p className="text-sm font-semibold text-white truncate">{b.title}</p>
              <p className="text-xs text-gray-500 mt-1 truncate">By {b.author} · {b.category}</p>
              <p className="text-xs text-gray-600 mt-0.5">{fmtDate(b.date)}</p>
            </CardShell>
          ))}
        </div>
      )}

      {/* ── Achievements tab ── */}
      {tab === 'achievements' && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAch.length === 0 && <p className="text-gray-500 text-sm col-span-full">No achievements found.</p>}
          {filteredAch.map((a) => (
            <CardShell key={a.id} onClick={() => setSelAch(a)} cover={a.coverImage} icon={Trophy}>
              <p className="text-sm font-semibold text-white truncate">{a.title}</p>
              <p className="text-xs text-gray-500 mt-1 truncate">{a.category}{a.teamMembers.length ? ` · ${a.teamMembers.join(', ')}` : ''}</p>
              <p className="text-xs text-gray-600 mt-0.5">{fmtDate(a.achievementDate)}</p>
            </CardShell>
          ))}
        </div>
      )}

      {/* ── Event modal ── */}
      {selEvent && (
        <Modal onClose={() => setSelEvent(null)}>
          <Cover src={selEvent.poster} alt={selEvent.title} icon={Calendar} />
          <div className="mt-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-white">{selEvent.title}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${selEvent.status === 'Upcoming' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{selEvent.status}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <DetailRow icon={Calendar} label="Date" value={selEvent.date} />
              <DetailRow icon={MapPin} label="Venue" value={selEvent.venue} />
              <DetailRow icon={Tag} label="Category" value={selEvent.category} />
              <DetailRow icon={Mic} label="Speaker" value={selEvent.speaker} />
            </div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{selEvent.description}</p>
          </div>
        </Modal>
      )}

      {/* ── Blog modal ── */}
      {selBlog && (
        <Modal onClose={() => setSelBlog(null)}>
          <Cover src={selBlog.coverImage} alt={selBlog.title} icon={FileText} />
          <div className="mt-4 space-y-3">
            <h2 className="text-xl font-bold text-white">{selBlog.title}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full overflow-hidden bg-primary/20 inline-flex items-center justify-center">
                  {selBlog.authorImage ? <img src={selBlog.authorImage} alt="" className="w-full h-full object-cover" /> : <Users className="w-3 h-3 text-primary" />}
                </span>
                {selBlog.author}
              </span>
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {selBlog.category}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(selBlog.date)}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {selBlog.views}</span>
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {selBlog.likes}</span>
            </div>
            {selBlog.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selBlog.tags.map((t) => <span key={t} className="px-2 py-0.5 rounded-full bg-white/[0.05] text-[10px] text-gray-400">#{t}</span>)}
              </div>
            )}
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{selBlog.content}</p>
          </div>
        </Modal>
      )}

      {/* ── Achievement modal ── */}
      {selAch && (
        <Modal onClose={() => setSelAch(null)}>
          <Cover src={selAch.coverImage} alt={selAch.title} icon={Trophy} />
          <div className="mt-4 space-y-3">
            <h2 className="text-xl font-bold text-white">{selAch.title}</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              <DetailRow icon={Tag} label="Category" value={selAch.category} />
              <DetailRow icon={Calendar} label="Date" value={fmtDate(selAch.achievementDate)} />
              <DetailRow icon={MapPin} label="Venue" value={selAch.venue} />
              <DetailRow icon={Building2} label="Organizer" value={selAch.organizer} />
              <DetailRow icon={Users} label="Team" value={selAch.teamMembers.join(', ')} />
            </div>
            {selAch.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selAch.tags.map((t) => <span key={t} className="px-2 py-0.5 rounded-full bg-white/[0.05] text-[10px] text-gray-400">#{t}</span>)}
              </div>
            )}
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{selAch.description}</p>
            {selAch.gallery.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Gallery</p>
                <div className="grid grid-cols-3 gap-2">
                  {selAch.gallery.map((g, i) => (
                    <img key={i} src={g} alt={`Gallery ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            )}
            {selAch.eventLink && (
              <a href={selAch.eventLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <ExternalLink className="w-4 h-4" /> View certificate / event link
              </a>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
