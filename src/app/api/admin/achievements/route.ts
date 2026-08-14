import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyAdminSession } from '@/lib/adminAuth';
import { Achievement } from '@/models/Achievement';

export async function GET() {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.reason }, { status: 401 });
    }

    await connectDB();
    const achievements = await Achievement.find().sort({ year: -1, order: 1 });
    return NextResponse.json({ success: true, achievements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.reason }, { status: 401 });
    }

    const body = await req.json();
    if (!body.title || !body.year) {
      return NextResponse.json(
        { success: false, error: 'Title and Year are required' },
        { status: 400 }
      );
    }

    await connectDB();
    const achievement = await Achievement.create(body);
    return NextResponse.json({ success: true, achievement }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
