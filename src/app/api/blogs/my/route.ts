import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
import { User } from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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
          success: false
        },
        { status: 401 }
      );
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.userId);

    const blogs = await Blog.find({
      $or: [{ authorId: decoded.userId }, { author: user?.name }]
    }).sort({
      createdAt: -1
    });

    return NextResponse.json({
      success: true,
      blogs
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false
      },
      { status: 500 }
    );
  }
}