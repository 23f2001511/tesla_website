import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();

    // Fetch user specific records
    const userBlogs = await Blog.find({ author: payload!.userId }).sort({ createdAt: -1 }).lean();

    // ─── AGGREGATED METRICS SUMMARY GENERATION ───
    const totalBlogs = userBlogs.length;
    const publishedCount = userBlogs.filter((b: any) => b.status === 'Published').length;
    const pendingCount = userBlogs.filter((b: any) => b.status === 'Pending').length;
    const rejectedCount = userBlogs.filter((b: any) => b.status === 'Rejected').length;
    
    let totalViews = 0;
    let totalLikes = 0;
    userBlogs.forEach((b: any) => {
      totalViews += (b.views || 0);
      totalLikes += (b.likes?.length || 0);
    });

    // Formatting objects arrays for seamless client hydration matching schema structures
    const formattedBlogs = userBlogs.map((b: any) => ({
      _id: b._id.toString(),
      title: b.title,
      category: b.category || 'Tech',
      status: b.status || 'Draft',
      content: b.content || '',
      coverImage: b.coverImage || '',
      views: b.views || 0,
      likes: b.likes?.length || 0,
      tags: b.tags || [],
      createdAt: b.createdAt
    }));

    // Dynamic historical timeline updates stream simulation based on user db data mutations
    const blogTimeline = [];
    if (userBlogs.length > 0) {
      blogTimeline.push({ action: `Committed latest blog artifact pipeline entry`, time: 'Recently', type: 'Repository', color: '#3b82f6' });
    }
    if (publishedCount > 0) {
      blogTimeline.push({ action: `Blog tracking approval validation success nodes published`, time: 'Completed', type: 'Verification', color: '#10b981' });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalBlogs,
        publishedCount,
        pendingCount,
        rejectedCount,
        totalViews,
        totalLikes
      },
      blogs: formattedBlogs,
      timeline: blogTimeline
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}