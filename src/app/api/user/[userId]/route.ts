import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Blog } from '@/models/Blog';
import { Event } from '@/models/Event';
import { Resource } from '@/models/Resource';
import { requireAuth } from '@/lib/auth';

// ─── GET: read-only profile dataset for any member by id ───
// Mirrors /api/user/member-profile (self) but resolves an arbitrary userId so
// the dynamic profile route can show another member's profile.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    const { userId } = await params;

    await connectDB();

    const userDoc = await User.findById(userId).select('-password').lean();
    if (!userDoc) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    const user: any = userDoc;

    const blogsWritten = await Blog.countDocuments({ author: user._id });
    const approvedEvents = await Event.countDocuments({ registeredUsers: user._id });

    const sharedResources = await Resource.find({ 'files.uploadedBy': user._id }).lean();
    let resourcesUploaded = 0;
    sharedResources.forEach((r: any) => {
      r.files?.forEach((f: any) => {
        if (f.uploadedBy?.toString() === user._id.toString()) resourcesUploaded++;
      });
    });

    const blogs = await Blog.find({ author: user._id }).sort({ createdAt: -1 }).limit(10).lean();
    const events = await Event.find({ registeredUsers: user._id }).sort({ date: -1 }).limit(10).lean();

    return NextResponse.json({
      success: true,
      isOwn: user._id.toString() === payload!.userId,
      user: { ...user, rollNumber: user.rollNumber || user.rollNo || '' },
      stats: {
        blogsWritten,
        approvedEvents,
        resourcesUploaded,
        achievementsCount: user.achievements?.length || 0,
        skillsCount: user.skills?.length || 0,
        profileViews: 0,
      },
      blogs,
      events,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
