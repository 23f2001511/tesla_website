import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Blog } from '@/models/Blog';
import { Event } from '@/models/Event';

// ─── Team workspace dataset for the logged-in Team Leader ───
// Colocated with the team page; reuses the existing User / Blog / Event models.
export async function GET(_request: NextRequest) {
  try {
    // @ts-ignore: auth.ts may not be recognized as a module in this environment.
    const authModule = (await import('@/lib/auth')) as any;
    const requireAuth = authModule.requireAuth ?? authModule.default?.requireAuth;
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();

    const leaderDoc: any = await User.findById(payload!.userId).select('-password').lean();
    if (!leaderDoc) {
      return NextResponse.json({ success: false, message: 'User missing' }, { status: 404 });
    }

    const team = leaderDoc.team || '';

    // Only members belonging to this leader's team.
    const members: any[] = team
      ? await User.find({ team }).select('-password').sort({ createdAt: 1 }).lean()
      : [];

    const memberIds = members.map((m) => m._id);

    // Recent Activity — real, from team members' blogs.
    const recentBlogs = memberIds.length
      ? await Blog.find({ author: { $in: memberIds } })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('author', 'name')
          .lean()
      : [];
    const recentActivity = recentBlogs.map((b: any) => ({
      action: `${b.author?.name || 'A member'} ${b.status === 'Published' ? 'published' : 'worked on'} "${b.title}"`,
      time: new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      type: b.status === 'Published' ? 'Published' : 'Submission',
    }));

    // Upcoming Schedule — real club events.
    const now = new Date();
    const eventsRaw = await Event.find({ date: { $gte: now } }).sort({ date: 1 }).limit(6).lean();
    const upcomingEvents = eventsRaw.map((e: any) => {
      const d = new Date(e.date);
      return {
        title: e.title,
        date: d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' }),
        time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        location: e.venue || 'TBA',
        tag: e.category || 'Event',
      };
    });

    return NextResponse.json({
      success: true,
      team,
      leader: {
        _id: leaderDoc._id,
        name: leaderDoc.name,
        role: leaderDoc.role,
        designation: leaderDoc.designation,
        permissions: leaderDoc.permissions || [],
      },
      members,
      count: members.length,
      recentActivity,
      upcomingEvents,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
