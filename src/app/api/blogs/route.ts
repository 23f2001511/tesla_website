import { NextRequest, NextResponse } from 'next/server';
import type { QueryFilter } from 'mongoose';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
import type { IBlog, IBlogPopulated } from '@/types/models';
import { requireAuth } from '@/lib/auth';

import { getErrorMessage } from '@/lib/errors';
export const dynamic = 'force-dynamic';

// ─── GET: public feed of Published blogs (+ author name) ─────────────────────
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const limit = Math.min(Number(searchParams.get('limit')) || 0, 100);

    const filter: QueryFilter<IBlog> = { status: 'Published' };
    if (category && category !== 'all') filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const query = Blog.find(filter)
      .populate('author', 'name role profileImage')
      .select('title content category coverImage tags isFeatured views likes createdAt')
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean<IBlogPopulated[]>();
    const blogs = limit ? await query.limit(limit) : await query;

    return NextResponse.json({
      success: true,
      blogs: blogs.map((b) => ({
        ...b,
        id: String(b._id),
        excerpt: (b.content || '').replace(/[#*_>`]/g, '').slice(0, 160),
      })),
    });
  } catch (error){
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

// Members may only create blogs in these states.
const MEMBER_STATUSES = ['Draft', 'Pending'] as const;

// ─── POST: member creates a blog (Draft) or submits for review (Pending) ─────
export async function POST(request: NextRequest) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();
    const body = await request.json();
    const { title, content, category, coverImage, tags, status } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, error: 'Title, content and category are required.' },
        { status: 400 }
      );
    }

    const finalStatus = MEMBER_STATUSES.includes(status) ? status : 'Draft';

    const cleanTags = Array.isArray(tags)
      ? tags
      : tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [];

    const blog = await Blog.create({
      title,
      content,
      category,
      coverImage: coverImage || '',
      tags:       cleanTags,
      status:     finalStatus,
      author:     payload!.userId,
      views:      0,
      likes:      [],
    });

    return NextResponse.json({ success: true, blog }, { status: 201 });
  } catch (error){
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
