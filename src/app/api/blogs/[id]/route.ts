import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MEMBER_STATUSES = ['Draft', 'Pending'] as const;
// A member may only edit a blog that is still a Draft or was Rejected.
const EDITABLE_STATUSES = ['Draft', 'Rejected'];

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET: read a single blog (own blog, or any Published one) + count a view ──
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();
    const { id } = await context.params;

    const blog = await Blog.findById(id).lean() as any;
    if (!blog) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    const isAuthor = blog.author?.toString() === payload!.userId;
    if (blog.status !== 'Published' && !isAuthor) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Count a read only when someone other than the author views a live blog.
    if (blog.status === 'Published' && !isAuthor) {
      await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } });
    }

    return NextResponse.json({ success: true, blog });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── PUT: author edits / resubmits a Draft or Rejected blog ──────────────────
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();
    const { id } = await context.params;
    const body = await request.json();

    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }
    if (blog.author.toString() !== payload!.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (!EDITABLE_STATUSES.includes(blog.status)) {
      return NextResponse.json(
        { success: false, error: 'Only Draft or Rejected blogs can be edited.' },
        { status: 400 }
      );
    }

    const { title, content, category, coverImage, tags, status } = body;
    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, error: 'Title, content and category are required.' },
        { status: 400 }
      );
    }

    const cleanTags = Array.isArray(tags)
      ? tags
      : tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [];

    blog.title      = title;
    blog.content    = content;
    blog.category   = category;
    blog.coverImage = coverImage || '';
    blog.tags       = cleanTags;
    if (MEMBER_STATUSES.includes(status)) blog.status = status;
    await blog.save();

    return NextResponse.json({ success: true, blog });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── DELETE: author removes their own blog ───────────────────────────────────
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();
    const { id } = await context.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }
    if (blog.author.toString() !== payload!.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await blog.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
