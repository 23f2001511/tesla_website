import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

    const {
      currentPassword,
      newPassword
    } = await req.json();

    const user = await User.findById(decoded.userId);

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