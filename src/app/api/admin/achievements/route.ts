import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Achievement } from '@/models/Achievement';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/auth';
import { isAchievementManager } from '@/lib/permissions';

export const dynamic = 'force-dynamic';
const CONTENT_MANAGERS = ['Admin', 'President', 'OfficeBearer'] as const;

async function requireManage() {
  await connectDB();
  const { payload, response } = await requireAuth();
  if (response) return { user: null, response };

  const user: any = await User.findById(payload!.userId).select('name role permissions').lean();
  const isSuper = user && CONTENT_MANAGERS.includes(user.role);
  const isManager = isAchievementManager(user?.permissions);

  if (!isSuper && !isManager) {
    return { user: null, isSuper: false, response: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return { user: { ...user, _id: payload!.userId }, isSuper, response: null };
}

export async function GET(request: NextRequest) {
  try {
    const { response: authError } = await requireAuth();
    if (authError) return authError;
    await connectDB();
    
    // Admins see all, normal members see only published (if accessing from member side)
    const items = await Achievement.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, achievements: items.map((a: any) => ({ ...a, id: a._id.toString() })) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, isSuper, response: authError } = await requireManage();
    if (authError) return authError;

    const body = await request.json();
    const { title, description, category, teamMembers, coverImage, gallery, venue, achievementDate, organizer, tags, eventLink, isFeatured } = body;

    const item = await Achievement.create({
      title, description, category, venue, organizer, eventLink,
      coverImage,
      achievementDate: new Date(achievementDate),
      teamMembers: Array.isArray(teamMembers) ? teamMembers : teamMembers.split(',').map((m: string) => m.trim()),
      gallery: Array.isArray(gallery) ? gallery : gallery.split(',').map((g: string) => g.trim()).filter(Boolean),
      tags: Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      isFeatured: isSuper ? (isFeatured || false) : false, // Only super admins can feature
      status: isSuper ? 'Published' : 'Pending', // Managers bypass directly to Pending
      uploadedBy: user!._id,
      uploaderName: user!.name || 'Unknown',
    });

    return NextResponse.json({ success: true, achievement: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, isSuper, response: authError } = await requireManage();
    if (authError) return authError;

    const body = await request.json();
    const { id, title, description, category, teamMembers, coverImage, gallery, venue, achievementDate, organizer, tags, eventLink, isFeatured } = body;

    const existing = await Achievement.findById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    // Permission Check: Managers can only edit their own pending items
    if (!isSuper && (existing.uploadedBy.toString() !== user!._id.toString() || existing.status !== 'Pending')) {
      return NextResponse.json({ success: false, error: 'Cannot edit published or others achievements' }, { status: 403 });
    }

    const updated = await Achievement.findByIdAndUpdate(id, {
      title, description, category, venue, organizer, eventLink, coverImage,
      achievementDate: new Date(achievementDate),
      teamMembers: Array.isArray(teamMembers) ? teamMembers : teamMembers.split(',').map((m: string) => m.trim()),
      gallery: Array.isArray(gallery) ? gallery : gallery.split(',').map((g: string) => g.trim()).filter(Boolean),
      tags: Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      isFeatured: isSuper ? isFeatured : existing.isFeatured,
      status: isSuper ? existing.status : 'Pending' // Reverts to pending if manager edits
    }, { new: true });

    return NextResponse.json({ success: true, achievement: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { isSuper, response: authError } = await requireManage();
    if (authError) return authError;
    if (!isSuper) return NextResponse.json({ success: false, error: 'Only admins can change status' }, { status: 403 });

    const { id, status } = await request.json();
    await Achievement.findByIdAndUpdate(id, { status });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, isSuper, response: authError } = await requireManage();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const existing = await Achievement.findById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    if (!isSuper && (existing.uploadedBy.toString() !== user!._id.toString() || existing.status !== 'Pending')) {
      return NextResponse.json({ success: false, error: 'Cannot delete published or others achievements' }, { status: 403 });
    }

    await Achievement.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}