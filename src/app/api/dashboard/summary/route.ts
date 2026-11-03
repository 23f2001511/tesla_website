import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { Blog } from '@/models/Blog';
import { Event } from '@/models/Event';
import { Resource } from '@/models/Resource';
import { User } from '@/models/User';
import { TeamProject } from '@/models/TeamProject';
import type { IBlog, IEvent, IResource, ITeamProject, IUser, LeanDoc } from '@/types/models';

type TeamProjectRow = Pick<ITeamProject, 'title' | 'description' | 'status' | 'createdAt'> & LeanDoc;

function resourceCards(resources: IResource[]) {
  return resources.flatMap((resource) =>
    (resource.files || []).map((file) => ({
      id: String(file._id),
      title: file.title,
      subject: resource.subjectName,
      type: file.type,
      downloads: file.downloads || 0,
      fileUrl: file.fileUrl,
    }))
  );
}

export async function GET() {
  try {
    const { user, error, status } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, message: error }, { status });
    }

    const userId = user._id;
    const now = new Date();

    const [
      blogs,
      joinedEvents,
      upcomingEvents,
      resources,
      teamMembers,
      activeProjects,
    ] = await Promise.all([
      Blog.find({ author: userId }).sort({ createdAt: -1 }).lean<IBlog[]>(),
      Event.find({ registeredUsers: userId }).sort({ date: -1 }).limit(8).lean<IEvent[]>(),
      Event.find({ date: { $gte: now } }).sort({ date: 1 }).limit(5).lean<IEvent[]>(),
      Resource.find({}).sort({ updatedAt: -1 }).limit(6).lean<IResource[]>(),
      user.team
        ? User.find({ team: user.team, status: { $ne: 'alumni' } })
            .select('name role team designation profileImage email')
            .sort({ name: 1 })
            .lean<IUser[]>()
        : Promise.resolve([] as IUser[]),
      user.team
        ? TeamProject.find({ team: user.team, status: { $ne: 'Completed' } })
            .sort({ updatedAt: -1 })
            .limit(6)
            .lean<TeamProjectRow[]>()
        : Promise.resolve([] as TeamProjectRow[]),
    ]);

    const latestResources = resourceCards(resources).slice(0, 4);
    const achievements = user.achievements || [];

    const recentActivities = [
      ...blogs.slice(0, 2).map((blog) => ({
        type: 'blog',
        title: blog.status === 'Published' ? 'Blog Published' : 'Blog Updated',
        text: blog.title,
        createdAt: blog.updatedAt || blog.createdAt,
      })),
      ...joinedEvents.slice(0, 2).map((event) => ({
        type: 'event',
        title: 'Event Registered',
        text: event.title,
        createdAt: event.updatedAt || event.createdAt || event.date,
      })),
      ...achievements.slice(0, 2).map((achievement) => ({
        type: 'achievement',
        title: 'Achievement Added',
        text: achievement.title,
        createdAt: user.updatedAt || user.createdAt,
      })),
    ]
      .filter((activity) => activity.createdAt)
      .sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      )
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      user,
      stats: {
        blogsWritten: blogs.length,
        eventsJoined: joinedEvents.length,
        resources: latestResources.length,
        achievements: achievements.length,
        teamMembers: teamMembers.length,
        activeProjects: activeProjects.length,
        upcomingEvents: upcomingEvents.length,
      },
      recentActivities,
      upcomingEvents: upcomingEvents.map((event) => ({
        id: String(event._id),
        title: event.title,
        date: event.date,
        venue: event.venue,
        category: event.category,
      })),
      latestResources,
      teamMembers,
      activeProjects,
    });
  } catch (error) {
    console.error('Dashboard Summary Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load dashboard summary' },
      { status: 500 }
    );
  }
}
