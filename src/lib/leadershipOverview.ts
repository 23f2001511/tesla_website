// Shared data aggregator for the Leadership (President / OfficeBearer) dashboard.
// Both /api/dashboard/president and /api/dashboard/office-bearer reuse this so we
// never duplicate the overview logic. Returns an object matching the OfficerData
// shape consumed by src/app/dashboard/leadership/page.tsx.
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Blog } from '@/models/Blog';
import { Event } from '@/models/Event';
import { Resource } from '@/models/Resource';
import { Team } from '@/models/Team';
import { Visit } from '@/models/Visit';

function dayLabel(d: Date) { return d.toLocaleDateString('en-US', { weekday: 'short' }); }
function monthLabel(d: Date) { return d.toLocaleDateString('en-US', { month: 'short' }); }
function nDaysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d; }

export async function buildLeadershipOverview(userId: string) {
  await connectDB();

  const now = new Date();
  const sevenDaysAgo = nDaysAgo(6);
  const thirtyDaysAgo = nDaysAgo(30);
  const sixtyDaysAgo = nDaysAgo(60);

  const [
    me,
    totalMembers, activeMembers, alumniCount, totalTeams,
    totalEvents, upcomingEventsCount, completedEvents,
    totalBlogs, pendingBlogs, publishedBlogs, totalResources,
    newMembersLast30, newMembersPrev30,
  ] = await Promise.all([
    User.findById(userId).select('name email role team designation batch profileImage socialLinks').lean(),
    User.countDocuments({}),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'alumni' }),
    Team.countDocuments({}),
    Event.countDocuments({}),
    Event.countDocuments({ date: { $gte: now } }),
    Event.countDocuments({ date: { $lt: now } }),
    Blog.countDocuments({}),
    Blog.countDocuments({ status: 'Pending' }),
    Blog.countDocuments({ status: 'Published' }),
    Resource.countDocuments({}),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
  ]);

  const user: any = me || {};

  const memberGrowthPercent =
    newMembersPrev30 === 0
      ? (newMembersLast30 > 0 ? 100 : 0)
      : Math.round(((newMembersLast30 - newMembersPrev30) / newMembersPrev30) * 100);

  // ---- Site traffic (last 7 days) ----
  const visits: any[] = await Visit.find({ createdAt: { $gte: sevenDaysAgo } }).lean();
  const trafficMap: Record<string, number> = {};
  for (let i = 0; i < 7; i++) trafficMap[nDaysAgo(6 - i).toISOString().split('T')[0]] = 0;
  visits.forEach((v) => {
    const key = new Date(v.createdAt).toISOString().split('T')[0];
    if (trafficMap[key] !== undefined) trafficMap[key] += 1;
  });
  const trafficData = Object.entries(trafficMap).map(([k, v]) => ({
    name: dayLabel(new Date(k)), visitors: v, pageViews: v,
  }));
  const totalVisitsLast7 = visits.length;

  // ---- Members growth (last 6 months) ----
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  sixMonthsAgo.setHours(0, 0, 0, 0);
  const monthlyAgg: any[] = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
  ]);
  const membersGrowthData: { name: string; members: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i, 1);
    const match = monthlyAgg.find((m) => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1);
    membersGrowthData.push({ name: monthLabel(d), members: match ? match.count : 0 });
  }

  // ---- Recent activity ----
  const [recentBlogs, recentEvents, recentMembers] = await Promise.all([
    Blog.find({}).sort({ createdAt: -1 }).limit(3).select('title status createdAt author').populate('author', 'name').lean(),
    Event.find({}).sort({ createdAt: -1 }).limit(3).select('title createdAt').lean(),
    User.find({}).sort({ createdAt: -1 }).limit(3).select('name createdAt').lean(),
  ]);
  const recentActivities = [
    ...recentBlogs.map((b: any) => ({ type: 'blog', text: `${b.author?.name || 'Someone'} ${b.status === 'Pending' ? 'submitted' : 'created'} a blog: "${b.title}"`, createdAt: b.createdAt })),
    ...recentEvents.map((e: any) => ({ type: 'event', text: `New event created: "${e.title}"`, createdAt: e.createdAt })),
    ...recentMembers.map((m: any) => ({ type: 'member', text: `${m.name} joined the club`, createdAt: m.createdAt })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  // ---- Upcoming events ----
  const upcomingRaw: any[] = await Event.find({ date: { $gte: now } }).sort({ date: 1 }).limit(4).select('title date venue category').lean();
  const upcomingEvents = upcomingRaw.map((e: any) => {
    const d = new Date(e.date);
    return {
      title: e.title,
      day: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      dateNum: d.getDate(),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      location: e.venue,
      category: e.category,
    };
  });

  // ---- Pending approvals (blogs awaiting review) ----
  const pendingRaw: any[] = await Blog.find({ status: 'Pending' }).sort({ createdAt: -1 }).limit(6).select('title createdAt author').populate('author', 'name').lean();
  const pendingApprovals = pendingRaw.map((b: any) => ({
    id: String(b._id),
    title: b.title,
    type: 'blog',
    author: b.author?.name || 'Unknown',
    submittedAt: b.createdAt,
  }));

  // ---- President-only breakdowns ----
  const teamsRaw: any[] = await Team.find({}).select('name members').lean();
  const teamBreakdown = teamsRaw.map((t: any) => ({ name: t.name, count: Array.isArray(t.members) ? t.members.length : 0 }));

  const blogCatAgg: any[] = await Blog.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  const blogCategoryData = blogCatAgg.map((c: any) => ({ name: c._id || 'Uncategorized', count: c.count }));

  // ---- OfficeBearer-only ----
  const myTeamMemberCount = user.team ? await User.countDocuments({ team: user.team, status: 'active' }) : 0;

  return {
    user: {
      name: user.name || '',
      role: user.role,
      team: user.team || '',
      designation: user.designation || '',
      profileImage: user.profileImage || '',
      email: user.email || '',
      batch: user.batch,
      socialLinks: user.socialLinks || {},
    },
    stats: {
      totalMembers, activeMembers, totalTeams,
      totalEvents, upcomingEvents: upcomingEventsCount, completedEvents,
      totalBlogs, pendingBlogs, publishedBlogs, totalResources,
      totalVisitsLast7, memberGrowthPercent, alumniCount,
      myTeam: user.team || '',
      myTeamMemberCount,
    },
    trafficData,
    membersGrowthData,
    recentActivities,
    upcomingEvents,
    teamBreakdown,
    blogCategoryData,
    pendingApprovals,
  };
}
