import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Event } from '@/models/Event';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    await connectDB();

    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (featured === 'true') {
      query.isFeatured = true;
    }

    const events = await Event.find(query).sort({ order: 1, createdAt: -1 });
    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    console.error('Events GET API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
