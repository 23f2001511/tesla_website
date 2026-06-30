import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
