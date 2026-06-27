import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Blog } from '@/models/Blog';
import { Event } from '@/models/Event';
import { Resource } from '@/models/Resource';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();

    const user = await User.findById(payload!.userId).select('-password').lean();

    if (!user) {
      return NextResponse.json({ success: false, message: 'User missing' }, { status: 404 });
    }

    // ─── DYNAMIC STATISTICS MATRIX PULL ───
    const personalBlogsCount = await Blog.countDocuments({ author: user._id });
    const approvedEventsCount = await Event.countDocuments({ registeredUsers: user._id });
    
    // Counting specific resource files uploaded by this user context
    const sharedResources = await Resource.find({ 'files.uploadedBy': user._id }).lean();
    let personalResourcesCount = 0;
    sharedResources.forEach((r: any) => {
      r.files?.forEach((f: any) => {
        if (f.uploadedBy?.toString() === user._id.toString()) personalResourcesCount++;
      });
    });

    // ─── RECENT DATA (scoped to THIS member) ───
    const latestBlogs = await Blog.find({ author: user._id }).sort({ createdAt: -1 }).limit(4).lean();
    const registeredEvents = await Event.find({ registeredUsers: user._id }).sort({ date: -1 }).limit(6).lean();
    const upcomingEvents = await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(4).lean();

    // ─── Real activity timeline, built from the member's own records ───
    const fmt = (d: any) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const activeTimeline = [
      ...latestBlogs.map((b: any) => ({
        action: `Published blog "${b.title}"`, time: fmt(b.createdAt), type: 'Blog', color: '#3b82f6',
        ts: new Date(b.createdAt).getTime(),
      })),
      ...registeredEvents.map((e: any) => ({
        action: `Registered for "${e.title}"`, time: fmt(e.date), type: 'Event', color: '#8b5cf6',
        ts: new Date(e.date).getTime(),
      })),
      ...(user.achievements || []).map((a: any) => ({
        action: `Earned achievement "${a.title}"`, time: a.year || '', type: 'Achievement', color: '#f59e0b',
        ts: 0,
      })),
    ].sort((x, y) => y.ts - x.ts).slice(0, 6);

    return NextResponse.json({
      success: true,
      user: { ...user, rollNumber: (user as any).rollNumber || (user as any).rollNo || '' },
      stats: {
        blogsWritten: personalBlogsCount,
        approvedEvents: approvedEventsCount,
        resourcesUploaded: personalResourcesCount,
        achievementsCount: user.achievements?.length || 0,
        skillsCount: user.skills?.length || 0,
        profileViews: 0
      },
      timeline: activeTimeline,
      blogs: latestBlogs,
      events: upcomingEvents
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}