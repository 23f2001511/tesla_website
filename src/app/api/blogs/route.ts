import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'fallback_secret_for_development_only';

export async function POST(req: Request) {
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
      role: string;
    };

    const {
      title,
      content,
      category,
      tags,
      coverImage
    } = await req.json();

    const blog = await Blog.create({
      title,
      content,
      category,
      tags,
      coverImage,
      author: decoded.userId,

      status:
        decoded.role === 'Admin'
          ? 'Published'
          : 'Pending'
    });

    return NextResponse.json({
      success: true,
      blog
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create blog'
      },
      { status: 500 }
    );
  }
}