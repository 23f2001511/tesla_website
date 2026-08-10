import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET =
  process.env.JWT_SECRET || 'fallback_secret_for_development_only';

export async function PUT(req: Request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
    };

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
      decoded.userId,
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