import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyAdminSession } from '@/lib/adminAuth';
import { Resource } from '@/models/Resource';

export async function GET() {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.reason }, { status: 401 });
    }

    await connectDB();
    const resources = await Resource.find().sort({ semester: 1, title: 1 });
    return NextResponse.json({ success: true, resources });
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
    if (!body.title || !body.subject || !body.semester) {
      return NextResponse.json(
        { success: false, error: 'Title, Subject, and Semester are required' },
        { status: 400 }
      );
    }

    await connectDB();
    const resource = await Resource.create(body);
    return NextResponse.json({ success: true, resource }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
