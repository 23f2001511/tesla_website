import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Achievement } from '@/models/Achievement';

export const dynamic = 'force-dynamic';

// ─── Public (read-only) club achievements feed ───────────────────────────────
// No auth: powers the marketing `/achievements` page. Only surfaces publicly
// visible records — 'Published' plus legacy documents that predate the `status`
// field (a missing status is treated as visible). 'Pending'/'Draft' stay hidden.
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const filter: Record<string, any> = { status: { $nin: ['Pending', 'Draft'] } };
    if (category && category !== 'All') filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { teamMembers: { $regex: search, $options: 'i' } },
      ];
    }

    // Featured first, then newest.
    const items = await Achievement.find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      achievements: items.map((a: any) => ({ ...a, id: a._id.toString() })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
