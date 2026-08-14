import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyAdminSession } from '@/lib/adminAuth';
import { Alumni } from '@/models/Alumni';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.reason }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    await connectDB();
    const updated = await Alumni.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Alumni not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, alumni: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.reason }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const deleted = await Alumni.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Alumni not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Alumni deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
