import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { User } from '@/models/User';
import { Blog } from '@/models/Blog';
import { Event } from '@/models/Event';
import { Team } from '@/models/Team';
import { Resource } from '@/models/Resource';
import { Achievement } from '@/models/Achievement';

export const dynamic = 'force-dynamic';

// Read-only data feed for the Alumni dashboard. One route, three sections:
//   (default)          → overview stats + upcoming events + activity + latest achievements
//   ?section=blogs     → published blogs (the only content type without a member-readable feed)
//   ?section=network   → alumni directory (Admin-free counterpart of /api/admin/alumni)
// Events reuse /api/dashboard/events; achievements reuse /api/achievements.
export async function GET(request: NextRequest) {
  const { response } = await requireRole(['Alumni', 'Admin']);
  if (response) return response;

  try {
    await connectDB();
    const section = new URL(request.url).searchParams.get('section');

    if (section === 'blogs') {
      const blogs = await Blog.find({ status: 'Published' })
        .sort({ createdAt: -1 })
        .select('title content category coverImage tags views likes createdAt author')
        .populate('author', 'name profileImage')
        .lean();
      return NextResponse.json({
        success: true,
        blogs: blogs.map((b: any) => ({
          id: b._id.toString(),
          title: b.title,
          content: b.content,
          category: b.category,
          coverImage: b.coverImage || '',
          tags: b.tags || [],
          views: b.views || 0,
          likes: b.likes?.length || 0,
          author: b.author?.name || 'Unknown',
          authorImage: b.author?.profileImage || '',
          date: b.createdAt,
        })),
      });
    }

    if (section === 'network') {
      const alumni = await User.find({
        $or: [{ role: 'Alumni' }, { status: 'alumni' }],
      })
        .sort({ batch: -1, name: 1 })
        .select('name profileImage batch branch graduationYear company currentRole location designation team bio socialLinks')
        .lean();
      return NextResponse.json({
        success: true,
        alumni: alumni.map((a: any) => ({
          id: a._id.toString(),
          name: a.name,
          profileImage: a.profileImage || '',
          batch: a.batch || a.graduationYear || null,
          branch: a.branch || '',
          company: a.company || '',
          currentRole: a.currentRole || '',
          location: a.location || '',
          designation: a.designation || '',
          team: a.team || '',
        })),
      });
    }

    // ── Default: overview ────────────────────────────────────────────────────
    const now = new Date();
    // Same visibility convention as the public /api/achievements feed.
    const visibleAchievements = { status: { $nin: ['Pending', 'Rejected'] } };

    const [
      totalMembers, totalAlumni, totalTeams,
      totalEvents, completedEvents, upcomingEventsCount,
      totalBlogs, publishedBlogs,
      totalAchievements, featuredAchievements, totalResources,
      upcomingRaw, latestAchievements, recentBlogs, recentEvents, recentAch,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ $or: [{ role: 'Alumni' }, { status: 'alumni' }] }),
      Team.countDocuments({}),
      Event.countDocuments({ approvalStatus: 'approved' }),
      Event.countDocuments({ approvalStatus: 'approved', date: { $lt: now } }),
      Event.countDocuments({ approvalStatus: 'approved', date: { $gte: now } }),
      Blog.countDocuments({}),
      Blog.countDocuments({ status: 'Published' }),
      Achievement.countDocuments(visibleAchievements),
      Achievement.countDocuments({ ...visibleAchievements, isFeatured: true }),
      Resource.countDocuments({}),
      Event.find({ approvalStatus: 'approved', date: { $gte: now } })
        .sort({ date: 1 }).limit(5).select('title date venue category poster').lean(),
      Achievement.find(visibleAchievements)
        .sort({ createdAt: -1 }).limit(3)
        .select('title category coverImage achievementDate teamMembers').lean(),
      Blog.find({ status: 'Published' }).sort({ createdAt: -1 }).limit(3)
        .select('title createdAt author').populate('author', 'name').lean(),
      Event.find({ approvalStatus: 'approved' }).sort({ createdAt: -1 }).limit(3)
        .select('title createdAt').lean(),
      Achievement.find(visibleAchievements).sort({ createdAt: -1 }).limit(3)
        .select('title createdAt').lean(),
    ]);

    const recentActivity = [
      ...recentBlogs.map((b: any) => ({ type: 'blog', text: `${b.author?.name || 'A member'} published "${b.title}"`, createdAt: b.createdAt })),
      ...recentEvents.map((e: any) => ({ type: 'event', text: `New event: "${e.title}"`, createdAt: e.createdAt })),
      ...recentAch.map((a: any) => ({ type: 'achievement', text: `Club achievement: "${a.title}"`, createdAt: a.createdAt })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);

    return NextResponse.json({
      success: true,
      stats: {
        totalMembers, totalAlumni, totalTeams,
        totalEvents, completedEvents, upcomingEvents: upcomingEventsCount,
        totalBlogs, publishedBlogs,
        totalAchievements, featuredAchievements, totalResources,
      },
      upcomingEvents: upcomingRaw.map((e: any) => ({
        id: e._id.toString(),
        title: e.title,
        date: e.date,
        venue: e.venue,
        category: e.category || 'General',
        poster: e.poster || '',
      })),
      latestAchievements: latestAchievements.map((a: any) => ({
        id: a._id.toString(),
        title: a.title,
        category: a.category,
        coverImage: a.coverImage || '',
        date: a.achievementDate,
        teamMembers: a.teamMembers || [],
      })),
      recentActivity,
    });
  } catch (error: any) {
    console.error('Alumni dashboard error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
