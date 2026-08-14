import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyAdminSession } from '@/lib/adminAuth';
import { User } from '@/models/User';

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
    const updated = await User.findByIdAndUpdate(id, body, { new: true }).select(
      '-password'
    );
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, member: updated });
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
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Member deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
