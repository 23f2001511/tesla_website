// Read-only analytics aggregate for the PI (Professor In-Charge) dashboard.
// PI is an oversight role — this route only ever reads; there is intentionally
// no POST/PATCH/DELETE here, and no other mutating API accepts the PI role.
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { Event } from '@/models/Event';
import { Blog } from '@/models/Blog';
import { Achievement } from '@/models/Achievement';
import { Resource } from '@/models/Resource';
import { Visit } from '@/models/Visit';

export const dynamic = 'force-dynamic';

type Period = '30d' | '6m' | '1y' | 'all';
type Bucket = { label: string; start: number; end: number };

function nDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Time buckets for the requested period: daily for 30d, monthly for 6m/1y,
// yearly for all-time (anchored at the earliest real record).
function makeBuckets(period: Period, earliest: Date | null): Bucket[] {
  const now = new Date();
  const buckets: Bucket[] = [];
  if (period === '30d') {
    for (let i = 29; i >= 0; i--) {
      const start = nDaysAgo(i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      buckets.push({
        label: start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        start: start.getTime(),
        end: end.getTime(),
      });
    }
  } else if (period === '6m' || period === '1y') {
    const n = period === '6m' ? 6 : 12;
    for (let i = n - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      buckets.push({
        label: start.toLocaleDateString('en-US', period === '1y' ? { month: 'short', year: '2-digit' } : { month: 'short' }),
        start: start.getTime(),
        end: end.getTime(),
      });
    }
  } else {
    const firstYear = (earliest || now).getFullYear();
    for (let y = firstYear; y <= now.getFullYear(); y++) {
      buckets.push({
        label: String(y),
        start: new Date(y, 0, 1).getTime(),
        end: new Date(y + 1, 0, 1).getTime(),
      });
    }
  }
  return buckets;
}

function countSeries(dates: (Date | string | null | undefined)[], buckets: Bucket[]) {
  const counts = buckets.map(() => 0);
  dates.forEach((raw) => {
    if (!raw) return;
    const t = new Date(raw).getTime();
    if (Number.isNaN(t)) return;
    const idx = buckets.findIndex((b) => t >= b.start && t < b.end);
    if (idx !== -1) counts[idx] += 1;
  });
  return buckets.map((b, i) => ({ label: b.label, count: counts[i] }));
}

const stripHtml = (s: string) => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export async function GET(req: NextRequest) {
  // Only the PI may read this aggregate — everyone else keeps their own dashboards.
  const { response } = await requireRole(['PI']);
  if (response) return response;

  try {
    await connectDB();

    const now = new Date();
    const thirtyDaysAgo = nDaysAgo(30);
    const period = (['30d', '6m', '1y', 'all'].includes(req.nextUrl.searchParams.get('period') || '')
      ? req.nextUrl.searchParams.get('period')
      : '6m') as Period;

    const [teamsRaw, usersRaw, eventsRaw, blogsRaw, achievementsRaw, resourcesRaw, visitsTotal, visits30dRaw] =
      await Promise.all([
        Team.find({}).populate('lead', 'name email profileImage').sort({ createdAt: -1 }).lean(),
        User.find({})
          .select('name profileImage role designation team status createdAt')
          .sort({ createdAt: -1 })
          .lean(),
        Event.find({ approvalStatus: 'approved' })
          .select('title description date venue speaker category poster registeredUsers createdAt')
          .sort({ date: -1 })
          .lean(),
        Blog.find({ status: 'Published' })
          .select('title content category coverImage views likes tags author createdAt')
          .populate('author', 'name profileImage team')
          .sort({ createdAt: -1 })
          .lean(),
        Achievement.find({ status: 'Published' })
          .select('title description category coverImage gallery venue achievementDate organizer tags eventLink teamMembers createdAt')
          .sort({ createdAt: -1 })
          .lean(),
        Resource.find({}).select('files.uploadedBy files.views files.downloads').lean(),
        Visit.countDocuments({}),
        Visit.find({ createdAt: { $gte: thirtyDaysAgo } }).select('createdAt').lean(),
      ]);

    // ── KPIs (real counts + real 30-day deltas, no invented growth %) ──
    const alumniCount = usersRaw.filter((u: any) => u.status === 'alumni' || u.role === 'Alumni').length;
    const kpis = {
      totalMembers: usersRaw.length,
      activeMembers: usersRaw.filter((u: any) => u.status === 'active').length,
      totalTeams: teamsRaw.length,
      activeTeams: teamsRaw.filter((t: any) => t.isActive !== false).length,
      totalEvents: eventsRaw.length,
      publishedBlogs: blogsRaw.length,
      totalAchievements: achievementsRaw.length,
      alumniCount,
      newMembers30d: usersRaw.filter((u: any) => new Date(u.createdAt) >= thirtyDaysAgo).length,
      events30d: eventsRaw.filter((e: any) => new Date(e.createdAt) >= thirtyDaysAgo).length,
      blogs30d: blogsRaw.filter((b: any) => new Date(b.createdAt) >= thirtyDaysAgo).length,
      achievements30d: achievementsRaw.filter((a: any) => new Date(a.createdAt) >= thirtyDaysAgo).length,
    };

    // ── Time series for the requested period ──
    const allDates = [
      ...eventsRaw.map((e: any) => e.date),
      ...blogsRaw.map((b: any) => b.createdAt),
      ...achievementsRaw.map((a: any) => a.achievementDate || a.createdAt),
      ...usersRaw.map((u: any) => u.createdAt),
    ]
      .map((d) => new Date(d).getTime())
      .filter((t) => !Number.isNaN(t));
    const earliest = allDates.length ? new Date(Math.min(...allDates)) : null;
    const buckets = makeBuckets(period, earliest);
    const series = {
      events: countSeries(eventsRaw.map((e: any) => e.date), buckets),
      blogs: countSeries(blogsRaw.map((b: any) => b.createdAt), buckets),
      achievements: countSeries(achievementsRaw.map((a: any) => a.achievementDate || a.createdAt), buckets),
      members: countSeries(usersRaw.map((u: any) => u.createdAt), buckets),
    };

    // ── Team performance (real Team documents only) ──
    const userTeamById = new Map<string, string>();
    const usersByTeam = new Map<string, any[]>();
    usersRaw.forEach((u: any) => {
      const t = (u.team || '').trim();
      userTeamById.set(String(u._id), t);
      if (!t) return;
      if (!usersByTeam.has(t)) usersByTeam.set(t, []);
      usersByTeam.get(t)!.push(u);
    });

    const blogsByTeam = new Map<string, { count: number; last: number }>();
    blogsRaw.forEach((b: any) => {
      const t = userTeamById.get(String(b.author?._id || b.author)) || '';
      if (!t) return;
      const cur = blogsByTeam.get(t) || { count: 0, last: 0 };
      cur.count += 1;
      cur.last = Math.max(cur.last, new Date(b.createdAt).getTime());
      blogsByTeam.set(t, cur);
    });

    const eventsByTeam = new Map<string, number>();
    eventsRaw.forEach((e: any) => {
      const seen = new Set<string>();
      (e.registeredUsers || []).forEach((id: any) => {
        const t = userTeamById.get(String(id));
        if (t) seen.add(t);
      });
      seen.forEach((t) => eventsByTeam.set(t, (eventsByTeam.get(t) || 0) + 1));
    });

    const resourcesByTeam = new Map<string, number>();
    resourcesRaw.forEach((r: any) => {
      (r.files || []).forEach((f: any) => {
        const t = f.uploadedBy ? userTeamById.get(String(f.uploadedBy)) : '';
        if (t) resourcesByTeam.set(t, (resourcesByTeam.get(t) || 0) + 1);
      });
    });

    const teams = teamsRaw.map((t: any) => {
      const members = usersByTeam.get(t.name) || [];
      const blogStats = blogsByTeam.get(t.name);
      return {
        _id: String(t._id),
        name: t.name,
        description: t.description || '',
        coverImage: t.coverImage || '',
        isActive: t.isActive !== false,
        createdAt: t.createdAt,
        lead: t.lead
          ? { name: t.lead.name, email: t.lead.email || '', profileImage: t.lead.profileImage || '' }
          : null,
        memberCount: members.length,
        activeMembers: members.filter((m: any) => m.status === 'active').length,
        blogs: blogStats?.count || 0,
        events: eventsByTeam.get(t.name) || 0,
        resources: resourcesByTeam.get(t.name) || 0,
        lastActivity: blogStats?.last ? new Date(blogStats.last) : null,
        members: members.map((m: any) => ({
          _id: String(m._id),
          name: m.name,
          profileImage: m.profileImage || '',
          role: m.role,
          designation: m.designation || '',
        })),
      };
    });

    // ── Recent club activity feed (real timestamps, merged & sorted) ──
    const activity = [
      ...eventsRaw.slice(0, 6).map((e: any) => ({
        type: 'event',
        text: `New event published: "${e.title}"`,
        at: e.createdAt,
      })),
      ...blogsRaw.slice(0, 6).map((b: any) => ({
        type: 'blog',
        text: `${b.author?.name || 'A member'} published a blog: "${b.title}"`,
        at: b.createdAt,
      })),
      ...achievementsRaw.slice(0, 6).map((a: any) => ({
        type: 'achievement',
        text: `Club achievement added: "${a.title}"`,
        at: a.createdAt,
      })),
      ...usersRaw.slice(0, 6).map((m: any) => ({
        type: 'member',
        text: `${m.name} joined the club`,
        at: m.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 12);

    // ── Events / Blogs / Achievements insight blocks ──
    const serializeEvent = (e: any) => ({
      _id: String(e._id),
      title: e.title,
      description: e.description || '',
      date: e.date,
      venue: e.venue || '',
      speaker: e.speaker || '',
      category: e.category || '',
      poster: e.poster || '',
      registrations: (e.registeredUsers || []).length,
      status: new Date(e.date) >= now ? 'Upcoming' : 'Completed',
    });
    const upcomingList = eventsRaw
      .filter((e: any) => new Date(e.date) >= now)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
      .map(serializeEvent);
    const events = {
      total: eventsRaw.length,
      upcoming: eventsRaw.filter((e: any) => new Date(e.date) >= now).length,
      completed: eventsRaw.filter((e: any) => new Date(e.date) < now).length,
      recent: eventsRaw.slice(0, 6).map(serializeEvent),
      upcomingList,
      topByRegistrations: [...eventsRaw]
        .sort((a: any, b: any) => (b.registeredUsers?.length || 0) - (a.registeredUsers?.length || 0))
        .slice(0, 3)
        .filter((e: any) => (e.registeredUsers?.length || 0) > 0)
        .map(serializeEvent),
    };

    const serializeBlog = (b: any) => ({
      _id: String(b._id),
      title: b.title,
      excerpt: stripHtml(b.content).slice(0, 260),
      category: b.category || '',
      coverImage: b.coverImage || '',
      views: b.views || 0,
      likes: (b.likes || []).length,
      tags: b.tags || [],
      author: b.author?.name || 'Unknown',
      authorImage: b.author?.profileImage || '',
      createdAt: b.createdAt,
    });
    const blogs = {
      totalPublished: blogsRaw.length,
      recent: blogsRaw.slice(0, 6).map(serializeBlog),
      topViewed: [...blogsRaw]
        .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
        .slice(0, 3)
        .filter((b: any) => (b.views || 0) > 0)
        .map(serializeBlog),
      topLiked: [...blogsRaw]
        .sort((a: any, b: any) => (b.likes?.length || 0) - (a.likes?.length || 0))
        .slice(0, 3)
        .filter((b: any) => (b.likes?.length || 0) > 0)
        .map(serializeBlog),
    };

    const achCategories = new Map<string, number>();
    achievementsRaw.forEach((a: any) => {
      const k = a.category || 'Other';
      achCategories.set(k, (achCategories.get(k) || 0) + 1);
    });
    const achievements = {
      total: achievementsRaw.length,
      categories: [...achCategories.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      recent: achievementsRaw.slice(0, 6).map((a: any) => ({
        _id: String(a._id),
        title: a.title,
        description: a.description || '',
        category: a.category || '',
        coverImage: a.coverImage || '',
        gallery: a.gallery || [],
        venue: a.venue || '',
        achievementDate: a.achievementDate,
        organizer: a.organizer || '',
        tags: a.tags || [],
        eventLink: a.eventLink || '',
        teamMembers: a.teamMembers || [],
        createdAt: a.createdAt,
      })),
    };

    // ── Visibility / engagement (only metrics the DB actually stores) ──
    const visitTrendMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) visitTrendMap[nDaysAgo(i).toISOString().slice(0, 10)] = 0;
    visits30dRaw.forEach((v: any) => {
      const key = new Date(v.createdAt).toISOString().slice(0, 10);
      if (visitTrendMap[key] !== undefined) visitTrendMap[key] += 1;
    });
    const visibility = {
      blogViews: blogsRaw.reduce((s: number, b: any) => s + (b.views || 0), 0),
      blogLikes: blogsRaw.reduce((s: number, b: any) => s + (b.likes?.length || 0), 0),
      eventRegistrations: eventsRaw.reduce((s: number, e: any) => s + (e.registeredUsers?.length || 0), 0),
      resourceViews: resourcesRaw.reduce(
        (s: number, r: any) => s + (r.files || []).reduce((fs: number, f: any) => fs + (f.views || 0), 0),
        0
      ),
      resourceDownloads: resourcesRaw.reduce(
        (s: number, r: any) => s + (r.files || []).reduce((fs: number, f: any) => fs + (f.downloads || 0), 0),
        0
      ),
      visitsTotal,
      visits30d: visits30dRaw.length,
      visitsTrend: Object.entries(visitTrendMap).map(([k, count]) => ({
        label: new Date(k).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        count,
      })),
    };

    return NextResponse.json({
      success: true,
      period,
      kpis,
      series,
      teams,
      activity,
      events,
      blogs,
      achievements,
      visibility,
    });
  } catch (error) {
    console.error('PI dashboard error:', error);
    return NextResponse.json({ success: false, message: 'Failed to load PI analytics' }, { status: 500 });
  }
}
