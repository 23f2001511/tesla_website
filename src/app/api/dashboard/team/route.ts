import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Blog } from '@/models/Blog';
import { Event } from '@/models/Event';
import { requireAuth } from '@/lib/auth';
import type { IBlogPopulated, IEvent, IUser } from '@/types/models';

import { getErrorMessage } from '@/lib/errors';
// ─── Team workspace dataset for the logged-in Team Leader ───
// Colocated with the team page; reuses the existing User / Blog / Event models.
export async function GET(_request: NextRequest) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();

    const leaderDoc = await User.findById(payload!.userId).select('-password').lean<IUser | null>();
    if (!leaderDoc) {
      return NextResponse.json({ success: false, message: 'User missing' }, { status: 404 });
    }

    const team = leaderDoc.team || '';

    // Only members belonging to this leader's team.
    const members: IUser[] = team
      ? await User.find({ team }).select('-password').sort({ createdAt: 1 }).lean<IUser[]>()
      : [];

    const memberIds = members.map((m) => m._id);

    // Recent Activity — real, from team members' blogs.
    const recentBlogs: IBlogPopulated[] = memberIds.length
      ? await Blog.find({ author: { $in: memberIds } })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('author', 'name')
          .lean<IBlogPopulated[]>()
      : [];
    const recentActivity = recentBlogs.map((b) => ({
      action: `${b.author?.name || 'A member'} ${b.status === 'Published' ? 'published' : 'worked on'} "${b.title}"`,
      time: new Date(b.createdAt ?? 0).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      type: b.status === 'Published' ? 'Published' : 'Submission',
    }));

    // Upcoming Schedule — real club events.
    const now = new Date();
    const eventsRaw = await Event.find({ date: { $gte: now } }).sort({ date: 1 }).limit(6).lean<IEvent[]>();
    const upcomingEvents = eventsRaw.map((e) => {
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
  } catch (error){
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
