import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Resource } from '@/models/Resource';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Admin/President/OfficeBearer bypass ownership; everyone else (TeamLeader/TeamMember) manages only their own files.
const FULL_ACCESS = ['Admin', 'President', 'OfficeBearer'];

function ownsOrFullAccess(file: any, userId: string, role: string) {
  if (FULL_ACCESS.includes(role)) return true;
  return !!file.uploadedBy && String(file.uploadedBy) === String(userId);
}

// ─── PUT: Edit a single file (title / url / type) the caller owns ─────────────
export async function PUT(request: NextRequest) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();
    const { fileId, title, fileUrl, type } = await request.json();

    if (!fileId) {
      return NextResponse.json({ success: false, error: 'fileId is required' }, { status: 400 });
    }
    if (title !== undefined && !title) {
      return NextResponse.json({ success: false, error: 'File title is required' }, { status: 400 });
    }
    if (fileUrl !== undefined && !fileUrl) {
      return NextResponse.json({ success: false, error: 'File URL is required' }, { status: 400 });
    }

    const resource = await Resource.findOne({ 'files._id': fileId });
    if (!resource) {
      return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });
    }

    const file = resource.files.id(fileId);
    if (!file) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    if (!ownsOrFullAccess(file, payload!.userId, payload!.role)) {
      return NextResponse.json(
        { success: false, error: 'You can only edit your own resources.' },
        { status: 403 }
      );
    }

    if (title !== undefined) file.title = title;
    if (fileUrl !== undefined) file.fileUrl = fileUrl;
    if (type !== undefined) file.type = type;

    await resource.save();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── DELETE: Remove a single file the caller owns ─────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ success: false, error: 'fileId is required' }, { status: 400 });
    }

    const resource = await Resource.findOne({ 'files._id': fileId });
    if (!resource) {
      return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });
    }

    const file = resource.files.id(fileId);
    if (!file) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    if (!ownsOrFullAccess(file, payload!.userId, payload!.role)) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own resources.' },
        { status: 403 }
      );
    }

    resource.files.pull(fileId);

    // Drop the subject entirely once its last file is removed to avoid empty cards.
    if (resource.files.length === 0) {
      await Resource.findByIdAndDelete(resource._id);
    } else {
      await resource.save();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
