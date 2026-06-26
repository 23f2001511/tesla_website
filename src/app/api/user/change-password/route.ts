import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/auth';

export async function PUT(req: Request) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();

    const {
      currentPassword,
      newPassword
    } = await req.json();

    const user = await User.findById(payload!.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password is incorrect'
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    user.password = hashedPassword;

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Change Password Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to change password'
      },
      { status: 500 }
    );
  }
}