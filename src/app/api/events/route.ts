import { NextRequest, NextResponse } from 'next/server';
import type { QueryFilter } from 'mongoose';
import connectDB from '@/lib/db';
import { Event } from '@/models/Event';
import type { IEvent } from '@/types/models';

import { getErrorMessage } from '@/lib/errors';
export const dynamic = 'force-dynamic';

// ─── Public (read-only) events feed ──────────────────────────────────────────
// Only approved events. Public fields only — registration internals
// (registeredUsers / waitlist user ids) are never exposed, just counts.
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const when = searchParams.get('when'); // 'upcoming' | 'past' | undefined
    const limit = Math.min(Number(searchParams.get('limit')) || 0, 100);

    const filter: QueryFilter<IEvent> = { approvalStatus: 'approved' };
    if (category && category !== 'all') filter.category = category;
    const now = new Date();
    if (when === 'upcoming') filter.date = { $gte: now };
    if (when === 'past') filter.date = { $lt: now };

    const query = Event.find(filter)
      .select('title description date venue speaker poster category seatLimit isFeatured approvalStatus')
      .sort(when === 'past' ? { date: -1 } : { date: 1 })
      .lean<IEvent[]>();
    const events = limit ? await query.limit(limit) : await query;

    return NextResponse.json({
      success: true,
      events: events.map((e) => ({ ...e, id: String(e._id) })),
    });
  } catch (error){
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}