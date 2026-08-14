import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyAdminSession } from '@/lib/adminAuth';
import { FlagshipEvent } from '@/models/FlagshipEvent';

export async function GET() {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.reason }, { status: 401 });
    }

    await connectDB();
    let flagship = await FlagshipEvent.findOne();
    if (!flagship) {
      flagship = await FlagshipEvent.create({});
    }
    return NextResponse.json({ success: true, flagship });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.reason }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    let flagship = await FlagshipEvent.findOne();
    if (flagship) {
      flagship = await FlagshipEvent.findByIdAndUpdate(flagship._id, body, { new: true });
    } else {
      flagship = await FlagshipEvent.create(body);
    }

    return NextResponse.json({ success: true, flagship });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
