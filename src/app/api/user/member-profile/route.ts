import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Blog } from '@/models/Blog';
import { Event } from '@/models/Event';
import { Resource } from '@/models/Resource';
import { requireAuth } from '@/lib/auth';

// ─── GET: full profile dataset for the logged-in member ───
export async function GET(request: NextRequest) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();

    const userDoc = await User.findById(payload!.userId).select('-password').lean();
    if (!userDoc) {
      return NextResponse.json({ success: false, message: 'User missing' }, { status: 404 });
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

// ─── PUT: update member-editable fields (admin-managed fields excluded) ───
export async function PUT(request: NextRequest) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();

    const body = await request.json();

    // Only member-editable fields. Role / team / designation / email / branch /
    // rollNo are admin-managed and intentionally NOT accepted here.
    const updateData: Record<string, any> = {
      name: body.name,
      bio: body.bio,
      phone: body.phone,
      location: body.location,
      profileImage: body.profileImage,
      portfolio: body.portfolio,
      resume: body.resume,
      availability: body.availability,
      cgpa: body.cgpa,
      skills: body.skills,
      interests: body.interests,
      languages: body.languages,
      preferredDomains: body.preferredDomains,
      'socialLinks.github': body.github,
      'socialLinks.linkedin': body.linkedin,
      'socialLinks.twitter': body.twitter,
      'socialLinks.instagram': body.instagram,
      'preferences.theme': body.theme,
      'preferences.emailNotifications': body.emailNotifications,
      'preferences.openToCollaboration': body.openToCollaboration,
      'preferences.coverBanner': body.coverBanner,
    };

    if (body.currentSemester !== undefined) {
      const sem = parseInt(body.currentSemester, 10);
      updateData.currentSemester = Number.isFinite(sem) ? sem : undefined;
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    if (!updateData.name || !String(updateData.name).trim()) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      payload!.userId,
      { $set: updateData },
      { new: true }
    ).select('-password').lean();

    const u: any = updatedUser;
    return NextResponse.json({
      success: true,
      user: u ? { ...u, rollNumber: u.rollNumber || u.rollNo || '' } : u,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
