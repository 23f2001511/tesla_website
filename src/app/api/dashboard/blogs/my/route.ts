import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
import { requireAuth } from '@/lib/auth';
import type { IBlog } from '@/types/models';

import { getErrorMessage } from '@/lib/errors';
export const dynamic = 'force-dynamic';

// ─── GET: the authenticated member's own blogs + real stats ──────────────────
export async function GET() {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();

    const userBlogs = await Blog.find({ author: payload!.userId })
      .sort({ createdAt: -1 })
      .lean<IBlog[]>();

    const stats = {
      totalBlogs:     userBlogs.length,
      publishedCount: userBlogs.filter((b) => b.status === 'Published').length,
      pendingCount:   userBlogs.filter((b) => b.status === 'Pending').length,
      rejectedCount:  userBlogs.filter((b) => b.status === 'Rejected').length,
      draftCount:     userBlogs.filter((b) => b.status === 'Draft').length,
      totalViews:     userBlogs.reduce((sum, b) => sum + (b.views || 0), 0),
      totalLikes:     userBlogs.reduce((sum, b) => sum + (b.likes?.length || 0), 0),
    };

    const blogs = userBlogs.map((b) => ({
      _id:        String(b._id),
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
  } catch (error){
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
