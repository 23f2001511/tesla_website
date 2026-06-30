import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// ─── GET: the authenticated member's own blogs + real stats ──────────────────
export async function GET() {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();

    const userBlogs = await Blog.find({ author: payload!.userId })
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      totalBlogs:     userBlogs.length,
      publishedCount: userBlogs.filter((b: any) => b.status === 'Published').length,
      pendingCount:   userBlogs.filter((b: any) => b.status === 'Pending').length,
      rejectedCount:  userBlogs.filter((b: any) => b.status === 'Rejected').length,
      draftCount:     userBlogs.filter((b: any) => b.status === 'Draft').length,
      totalViews:     userBlogs.reduce((sum: number, b: any) => sum + (b.views || 0), 0),
      totalLikes:     userBlogs.reduce((sum: number, b: any) => sum + (b.likes?.length || 0), 0),
    };

    const blogs = userBlogs.map((b: any) => ({
      _id:        b._id.toString(),
      title:      b.title,
      category:   b.category || 'General',
      status:     b.status || 'Draft',
      content:    b.content || '',
      coverImage: b.coverImage || '',
      views:      b.views || 0,
      likes:      b.likes?.length || 0,
      tags:       b.tags || [],
      createdAt:  b.createdAt,
    }));

    return NextResponse.json({ success: true, stats, blogs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
