import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CONTENT_MANAGERS = ['Admin', 'President', 'OfficeBearer'] as const;

type RouteContext = { params: Promise<{ id: string }> };

// ─── PUT: Update status OR full content ──────────────────────────────────────
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { response: authError } = await requireRole([...CONTENT_MANAGERS]);
    if (authError) return authError;

    await connectDB();
    const { id } = await context.params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Blog ID is required' }, { status: 400 });
    }

    // ── Status-only update (Publish / Reject) ─────────────────────────────
    // Matches when frontend sends exactly { status: 'Published' } or { status: 'Rejected' }
    if (body.status && Object.keys(body).length === 1) {
      const updated = await Blog.findByIdAndUpdate(
        id,
        { $set: { status: body.status } },
        { new: true }
      );

      if (!updated) {
        return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, blog: updated });
    }

    // ── Featured-only toggle ──────────────────────────────────────────────
    // Matches when frontend sends exactly { isFeatured: true | false }
    if (typeof body.isFeatured === 'boolean' && Object.keys(body).length === 1) {
      const updated = await Blog.findByIdAndUpdate(
        id,
        { $set: { isFeatured: body.isFeatured } },
        { new: true }
      );

      if (!updated) {
        return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, blog: updated });
    }

    // ── Full content edit ─────────────────────────────────────────────────
    const { title, content, category, tags, coverImage } = body;

    const cleanTags = Array.isArray(tags)
      ? tags
      : tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [];

    const updated = await Blog.findByIdAndUpdate(
      id,
      { $set: { title, content, category, tags: cleanTags, coverImage } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, blog: updated });
  } catch (error: any) {
    console.error('ADMIN BLOG UPDATE ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── DELETE: Remove a blog ────────────────────────────────────────────────────
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { response: authError } = await requireRole([...CONTENT_MANAGERS]);
    if (authError) return authError;

    await connectDB();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Blog ID is required' }, { status: 400 });
    }

    const deleted = await Blog.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('ADMIN BLOG DELETE ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}