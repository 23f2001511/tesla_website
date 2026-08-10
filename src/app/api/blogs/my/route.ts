import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
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

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
    };

    const blogs = await Blog.find({
      author: decoded.userId
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