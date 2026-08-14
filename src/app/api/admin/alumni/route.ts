import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyAdminSession } from '@/lib/adminAuth';
import { Alumni } from '@/models/Alumni';

export async function GET() {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.reason }, { status: 401 });
    }

    await connectDB();
    const alumni = await Alumni.find().sort({ batch: -1, order: 1 });
    return NextResponse.json({ success: true, alumni });
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
    if (!body.name || !body.company || !body.batch) {
      return NextResponse.json(
        { success: false, error: 'Name, Company, and Batch are required' },
        { status: 400 }
      );
    }

    await connectDB();
    const alumni = await Alumni.create(body);
    return NextResponse.json({ success: true, alumni }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
