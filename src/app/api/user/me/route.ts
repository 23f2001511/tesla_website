import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET =
  process.env.JWT_SECRET || 'fallback_secret_for_development_only';

export async function GET() {
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

    const user = await User.findById(decoded.userId)
      .select('-password');

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('User Me Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch user'
      },
      { status: 500 }
    );
  }
}