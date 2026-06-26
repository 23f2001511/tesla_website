import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { Blog } from '@/models/Blog';
import { Event } from '@/models/Event';
import { Resource } from '@/models/Resource';
import { User } from '@/models/User';
import { TeamProject } from '@/models/TeamProject';

function resourceCards(resources: any[]) {
  return resources.flatMap((resource) =>
    (resource.files || []).map((file: any) => ({
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
      Blog.find({ author: userId }).sort({ createdAt: -1 }).lean(),
      Event.find({ registeredUsers: userId }).sort({ date: -1 }).limit(8).lean(),
      Event.find({ date: { $gte: now } }).sort({ date: 1 }).limit(5).lean(),
      Resource.find({}).sort({ updatedAt: -1 }).limit(6).lean(),
      user.team
        ? User.find({ team: user.team, status: { $ne: 'alumni' } })
            .select('name role team designation profileImage email')
            .sort({ name: 1 })
            .lean()
        : Promise.resolve([]),
      user.team
        ? TeamProject.find({ team: user.team, status: { $ne: 'Completed' } })
            .sort({ updatedAt: -1 })
            .limit(6)
            .lean()
        : Promise.resolve([]),
    ]);

    const latestResources = resourceCards(resources).slice(0, 4);
    const achievements = user.achievements || [];

    const recentActivities = [
      ...blogs.slice(0, 2).map((blog: any) => ({
        type: 'blog',
        title: blog.status === 'Published' ? 'Blog Published' : 'Blog Updated',
        text: blog.title,
        createdAt: blog.updatedAt || blog.createdAt,
      })),
      ...joinedEvents.slice(0, 2).map((event: any) => ({
        type: 'event',
        title: 'Event Registered',
        text: event.title,
        createdAt: event.updatedAt || event.createdAt || event.date,
      })),
      ...achievements.slice(0, 2).map((achievement: any) => ({
        type: 'achievement',
        title: 'Achievement Added',
        text: achievement.title,
        createdAt: user.updatedAt || user.createdAt,
      })),
    ]
      .filter((activity) => activity.createdAt)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
      upcomingEvents: upcomingEvents.map((event: any) => ({
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
