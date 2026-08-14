import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
import { User } from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'fallback_secret_for_development_only';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    await connectDB();

    const query: any = { status: 'Published' };
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const blogs = await Blog.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, blogs });
  } catch (error: any) {
    console.error('Public Blogs API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
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

    const body = await req.json();
    if (!body.title || !body.content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const slug =
      body.slug ||
      body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const blog = await Blog.create({
      ...body,
      slug,
      author: body.author || user.name || 'Tesla Team',
      authorRole: body.authorRole || user.designation || 'Member',
      authorId: user._id,
      publishedDate:
        body.publishedDate ||
        new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        }),
    });

    return NextResponse.json({ success: true, blog }, { status: 201 });
  } catch (error: any) {
    console.error('Create Blog API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}