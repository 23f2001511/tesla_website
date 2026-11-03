import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Resource } from '@/models/Resource';
import { Gallery } from '@/models/Gallery';
import { User } from '@/models/User';
import { getAuthPayload } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

// ─── POST: Member Resource Upload with Auto Ownership Binding ───
export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthPayload();
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { action, department, semester, subjectName, subjectCode, fileTitle, fileUrl, fileType } = body;

    if (action === 'resource') {
      if (!subjectName || typeof subjectName !== 'string' || !subjectName.trim()) {
        return NextResponse.json({ success: false, error: 'subjectName is required' }, { status: 400 });
      }

      const escaped = subjectName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let resource = await Resource.findOne({
        department,
        semester: Number(semester),
        subjectName: { $regex: new RegExp(`^${escaped}$`, 'i') }
      });

      const newFilePayload = {
        title: fileTitle,
        fileUrl,
        type: fileType,
        views: 0,
        downloads: 0,
        uploadedBy: payload.userId
      };

      if (resource) {
        resource.files.push(newFilePayload);
        await resource.save();
      } else {
        resource = await Resource.create({
          department,
          semester: Number(semester),
          subjectName: subjectName.trim(),
          subjectCode: subjectCode || '',
          files: [newFilePayload]
        });
      }
      return NextResponse.json({ success: true, resource }, { status: 201 });
    }
    return NextResponse.json({ success: false, error: 'Invalid Action Node' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

// ─── DELETE: Strict Asset/File Ownership Deletion Lock Core ───
export async function DELETE(request: NextRequest) {
  try {
    const payload = await getAuthPayload();
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target'); // 'resource' | 'gallery'
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Target id is required' }, { status: 400 });
    }

    if (target === 'resource') {
      // Pull document context only if the file element was uploaded by the current user session ID
      const result = await Resource.findOneAndUpdate(
        { 'files._id': id, 'files.uploadedBy': payload.userId },
        { $pull: { files: { _id: id } } },
        { new: true }
      );
      if (!result) {
        return NextResponse.json({ success: false, error: 'Access Denied: Object ownership mismatch.' }, { status: 403 });
      }
      return NextResponse.json({ success: true });
    }

    if (target === 'gallery') {
      // Gallery assets are club-wide; only managers may delete them
      const actor = await User.findById(payload.userId).select('role status').lean<{ role?: string; status?: string }>();
      const isManager = actor?.status !== 'inactive' && actor?.role && ['Admin', 'President', 'OfficeBearer'].includes(actor.role);

      if (!isManager) {
        return NextResponse.json({ success: false, error: 'Access Denied: Gallery management requires an elevated role.' }, { status: 403 });
      }

      const galleryItem = await Gallery.findById(id);
      if (!galleryItem) {
        return NextResponse.json({ success: false, error: 'Asset node missing' }, { status: 404 });
      }

      await Gallery.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid Target Definition' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
