import { NextRequest, NextResponse } from 'next/server';
import type { QueryFilter } from 'mongoose';
import connectDB from '@/lib/db';
import { Achievement } from '@/models/Achievement';
import type { IAchievement } from '@/types/models';

import { getErrorMessage } from '@/lib/errors';
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

    const filter: QueryFilter<IAchievement> = { status: { $nin: ['Pending', 'Rejected'] } };
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
      .lean<IAchievement[]>();

    return NextResponse.json({
      success: true,
      achievements: items.map((a) => ({ ...a, id: String(a._id) })),
    });
  } catch (error){
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
