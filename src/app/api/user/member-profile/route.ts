import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();

    const body = await request.json();

    // Filtering editable fields from body safely
    const updateData: Record<string, any> = {
      name: body.name,
      bio: body.bio,
      location: body.location,
      profileImage: body.profileImage,
      portfolio: body.portfolio,
      skills: body.skills,
      'socialLinks.github': body.github,
      'socialLinks.linkedin': body.linkedin,
      'socialLinks.twitter': body.twitter,
      'socialLinks.instagram': body.instagram,
      'preferences.theme': body.theme,
      'preferences.emailNotifications': body.emailNotifications,
      'preferences.openToCollaboration': body.openToCollaboration,
      'preferences.coverBanner': body.coverBanner,
    };

    // Remove undefined values cleanly
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const updatedUser = await User.findByIdAndUpdate(
      payload!.userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}