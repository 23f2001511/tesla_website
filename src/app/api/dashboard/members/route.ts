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

    // ─── RECENT REPOSITORY DATA STREAMS (LIMIT 4 FOR CLEAN UI) ───
    const latestBlogs = await Blog.find({ status: 'Published' }).sort({ createdAt: -1 }).limit(3).lean();
    const upcomingEvents = await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(3).lean();
    
    // Parsing Activity timeline array dynamically from real updates
    const activeTimeline = [
      { action: `Logged into TESLA Workspace Portal`, time: 'Just now', type: 'System', color: '#10b981' },
    ];
    if (personalBlogsCount > 0) {
      activeTimeline.push({ action: 'Contributed an active technical blog log', time: 'Recently', type: 'Blog', color: '#3b82f6' });
    }
    if (personalResourcesCount > 0) {
      activeTimeline.push({ action: 'Uploaded academic node study package', time: 'Recently', type: 'Resource', color: '#6366f1' });
    }

    return NextResponse.json({
      success: true,
      user,
      stats: {
        blogsWritten: personalBlogsCount,
        approvedEvents: approvedEventsCount,
        resourcesUploaded: personalResourcesCount,
        achievementsCount: user.achievements?.length || 0,
        skillsCount: user.skills?.length || 0,
        profileViews: 142 // Static telemetry counter mockup placeholder
      },
      timeline: activeTimeline,
      blogs: latestBlogs,
      events: upcomingEvents
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}