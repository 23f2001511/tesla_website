import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Event } from '@/models/Event';
import { requireAuth, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CONTENT_MANAGERS = ['Admin', 'President', 'OfficeBearer'] as const;

// ─── GET: Fetch All Events with Admin Analytics ──────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const filter: Record<string, any> = {};
    if (category && category !== 'All') filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { speaker: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Event.find(filter).sort({ date: 1 }).lean();
    const now = new Date();

    // Mapping states clean execution arrays
    const approved = events.filter((e: any) => e.approvalStatus === 'approved' || !e.approvalStatus);
    const pending  = events.filter((e: any) => e.approvalStatus === 'pending');
    const rejected = events.filter((e: any) => e.approvalStatus === 'rejected');

    const total     = approved.length;
    const upcoming  = approved.filter(e => new Date(e.date) > now).length;
    const completed = approved.filter(e => new Date(e.date) <= now).length;
    const featured  = approved.filter((e: any) => e.isFeatured).length;

    // Last 6 Months metrics accumulation structure
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyMap: Record<string, number> = {};
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      monthlyMap[months[d.getMonth()]] = 0;
    }

    approved.forEach(e => {
      const d = new Date(e.date);
      const mName = months[d.getMonth()];
      if (mName in monthlyMap) {
        monthlyMap[mName]++;
      }
    });

    const monthlyData = Object.entries(monthlyMap).map(([name, eventsCount]) => ({
      name,
      events: eventsCount,
    }));

    // Category calculation grouping maps
    const categoryMap: Record<string, number> = {};
    approved.forEach((e: any) => {
      const cat = e.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const categoryData = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

    const mapEvent = (e: any) => ({
      id:              e._id.toString(),
      title:           e.title,
      description:     e.description,
      date:            e.date,
      venue:           e.venue,
      category:        e.category || 'Workshop',
      speaker:         e.speaker || '',
      poster:          e.poster  || '',
      seatLimit:       e.seatLimit || 0,
      isFeatured:      e.isFeatured || false,
      registeredCount: e.registeredUsers?.length || 0,
      approvalStatus:  e.approvalStatus || 'approved',
      requestedBy:     e.requestedBy || null,
      requestNote:     e.requestNote || '',
      isUpcoming:      new Date(e.date) > now,
    });

    return NextResponse.json({
      events:          approved.map(mapEvent),
      pendingRequests: pending.map(mapEvent),
      rejectedEvents:  rejected.map(mapEvent),
      stats: { total, upcoming, completed, featured, pendingCount: pending.length },
      monthlyData,
      categoryData,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/events]', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// ─── POST: Admin Creates Auto-Approved Event ─────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { response: authError } = await requireRole([...CONTENT_MANAGERS]);
    if (authError) return authError;

    await connectDB();
    const body = await request.json();

    const { title, description, date, venue, category, speaker, seatLimit, isFeatured } = body;

    if (!title || !description || !date || !venue || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const event = await Event.create({
      title,
      description,
      date: new Date(date),
      venue,
      category,
      speaker:        speaker    || '',
      seatLimit:      Number(seatLimit) || 0,
      isFeatured:     isFeatured || false,
      approvalStatus: 'approved',
      registeredUsers: [],
      waitlist:        [],
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/admin/events]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PATCH: Action Route to Approve/Reject Requests ──────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const { response: authError } = await requireRole([...CONTENT_MANAGERS]);
    if (authError) return authError;

    await connectDB();
    const body = await request.json();
    const { id, action } = body; // action: 'approve' | 'reject'

    // ── Featured-only toggle ──────────────────────────────────────────────
    if (id && typeof body.isFeatured === 'boolean' && action === undefined) {
      const updated = await Event.findByIdAndUpdate(
        id,
        { $set: { isFeatured: body.isFeatured } },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ error: 'Event allocation layout missed' }, { status: 404 });
      }
      return NextResponse.json({ success: true, event: updated }, { status: 200 });
    }

    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid id or action parameter payload' }, { status: 400 });
    }

    const event = await Event.findByIdAndUpdate(
      id,
      { $set: { approvalStatus: action === 'approve' ? 'approved' : 'rejected' } },
      { new: true }
    );

    if (!event) {
      return NextResponse.json({ error: 'Event allocation layout missed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error: any) {
    console.error('[PATCH /api/admin/events]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE: Safe Drop Collection Entry ──────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { response: authError } = await requireRole([...CONTENT_MANAGERS]);
    if (authError) return authError;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID parameter required' }, { status: 400 });

    const target = await Event.findByIdAndDelete(id);
    if (!target) return NextResponse.json({ error: 'Event already dropped or missing' }, { status: 404 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}