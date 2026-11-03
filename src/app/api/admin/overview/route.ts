import { NextResponse } from 'next/server';
import connectDB  from '@/lib/db';
import { User } from '@/models/User';
import { Blog } from '@/models/Blog';
import { Event } from '@/models/Event';
import { Visit } from '@/models/Visit';
import { requireRole } from '@/lib/auth';
import type { IBlogPopulated, IEvent, IUser, IVisit } from '@/types/models';

export const dynamic = 'force-dynamic';

function getDateNDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

export async function GET() {
  try {
    // Read-only analytics — every admin-panel role may view them.
    const { response: authError } = await requireRole(['Admin', 'President', 'OfficeBearer']);
    if (authError) return authError;

    await connectDB();

    // ---- Basic counts ----
    const [totalMembers, totalEvents, totalBlogs, pendingBlogs, alumniCount] = await Promise.all([
        User.countDocuments({ status: 'active' }),
        Event.countDocuments({}),
        Blog.countDocuments({}),
        Blog.countDocuments({ status: 'Pending' }),
        User.countDocuments({ status: 'alumni' }),
        ]);

    // ---- Last 30 days vs previous 30 days (for trend %) ----
    const thirtyDaysAgo = getDateNDaysAgo(30);
    const sixtyDaysAgo = getDateNDaysAgo(60);

    const [newMembersLast30, newMembersPrev30] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
    ]);



    const memberGrowthPercent =
      newMembersPrev30 === 0
        ? newMembersLast30 > 0
          ? 100
          : 0
        : Math.round(((newMembersLast30 - newMembersPrev30) / newMembersPrev30) * 100);

    // ---- Site Traffic (last 7 days) ----
    const sevenDaysAgo = getDateNDaysAgo(6); // include today => 7 days total
    const visits = await Visit.find({ createdAt: { $gte: sevenDaysAgo } }).lean();

    const trafficMap: Record<string, { visitors: number; pageViews: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = getDateNDaysAgo(6 - i);
      const key = d.toISOString().split('T')[0];
      trafficMap[key] = { visitors: 0, pageViews: 0 };
    }

    visits.forEach((v) => {
      const key = new Date(v.createdAt ?? 0).toISOString().split('T')[0];
      if (trafficMap[key]) {
        trafficMap[key].pageViews += 1;
      }
    });

    // For "visitors" we approximate as pageViews (no session/IP tracking yet)
    const trafficData = Object.entries(trafficMap).map(([dateKey, val]) => ({
      name: formatDayLabel(new Date(dateKey)),
      visitors: val.pageViews,
      pageViews: val.pageViews,
    }));

    const totalVisitsLast7 = visits.length;

    // ---- Members Growth (last 6 months) ----
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAgg = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
        $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
        },
    },
    ]);

    const membersGrowthData: { name: string; members: number }[] = [];
    for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    const match = monthlyAgg.find(
        (m) => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1
    );
    membersGrowthData.push({
        name: formatMonthLabel(d),
        members: match ? match.count : 0,
    });
    }
    

    // ---- Recent Activity (latest blogs + events + members) ----
    const [recentBlogs, recentEvents, recentMembers] = await Promise.all([
        Blog.find({}).sort({ createdAt: -1 }).limit(3).select('title    status createdAt author').populate('author', 'name').lean<IBlogPopulated[]>(),
        Event.find({}).sort({ createdAt: -1 }).limit(3).select('title createdAt').lean<IEvent[]>(),
        User.find({}).sort({ createdAt: -1 }).limit(3).select('name createdAt').lean<IUser[]>(),
    ]);



    const recentActivities = [
      ...recentBlogs.map((b) => ({
        type: 'blog',
        text: `${b.author?.name || 'Someone'} ${
          b.status === 'Pending' ? 'submitted' : 'created'
        } a blog: "${b.title}"`,
        createdAt: b.createdAt,
      })),
      ...recentEvents.map((e) => ({
        type: 'event',
        text: `New event created: "${e.title}"`,
        createdAt: e.createdAt,
      })),
      ...recentMembers.map((m) => ({
        type: 'member',
        text: `${m.name} joined the club`,
        createdAt: m.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 6);

    // ---- Upcoming Events ----
    const now = new Date();
    const upcomingEventsRaw = await Event.find({ date: { $gte: now } })
      .sort({ date: 1 })
      .limit(4)
      .select('title date venue category')
      .lean<IEvent[]>();

    const upcomingEvents = upcomingEventsRaw.map((e) => {
      const d = new Date(e.date);
      return {
        title: e.title,
        date: d,
        day: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        dateNum: d.getDate(),
        time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        location: e.venue,
        category: e.category,
      };
    });

    // ---- Final response ----
    return NextResponse.json({
      stats: {
        totalMembers,
        totalEvents,
        totalBlogs,
        pendingBlogs,
        alumniCount,
        memberGrowthPercent,
        totalVisitsLast7,
      },
      trafficData,
      membersGrowthData,
      recentActivities,
      upcomingEvents,
    });
  } catch (error){
    console.error('Overview API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}