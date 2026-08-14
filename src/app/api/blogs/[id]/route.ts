import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'fallback_secret_for_development_only';

async function getAuthUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    let blog = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      blog = await Blog.findById(id);
    } else {
      blog = await Blog.findOne({ slug: id });
    }

    if (!blog || blog.status !== 'Published') {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    // Increment views
    await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });

    return NextResponse.json({ success: true, blog });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    await connectDB();
    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    if (!blog.authorId || blog.authorId.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only edit your own blogs' },
        { status: 403 }
      );
    }

    const updated = await Blog.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json({ success: true, blog: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    await connectDB();
    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    if (!blog.authorId || blog.authorId.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own blogs' },
        { status: 403 }
      );
    }

    await Blog.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Blog deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
