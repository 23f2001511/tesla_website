import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/auth';

export async function PUT(req: Request) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();

    const body = await req.json();

    const {
      name,
      rollNo,
      branch,
      year,
      bio,
      portfolio,
      skills,
      linkedin,
      github,
      instagram
    } = body;

    const updatedUser = await User.findByIdAndUpdate(
      payload!.userId,
      {
        name,
        rollNo,
        branch,
        year,
        bio,
        portfolio,
        skills,
        socialLinks: {
          linkedin,
          github,
          instagram
        }
      },
      {
        new: true
      }
    ).select('-password');

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update Profile Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update profile'
      },
      { status: 500 }
    );
  }
}