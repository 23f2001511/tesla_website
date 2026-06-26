import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Event } from '@/models/Event';
import { requireAuth, requireRole } from '@/lib/auth';

const CONTENT_MANAGERS = ['Admin', 'President', 'OfficeBearer'] as const;

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ── GET Single Event ──────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();
    const { id } = await context.params;

    const event = await Event.findById(id).lean();
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ event }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

// ── PATCH Update Event ────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { response: authError } = await requireRole([...CONTENT_MANAGERS]);
    if (authError) return authError;

    await connectDB();
    const { id } = await context.params;
    const body = await request.json();

    if (body.date) body.date = new Date(body.date);

    const event = await Event.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}

// ── DELETE Event ──────────────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { response: authError } = await requireRole([...CONTENT_MANAGERS]);
    if (authError) return authError;

    await connectDB();
    const { id } = await context.params;

    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Deletion failed' }, { status: 500 });
  }
}