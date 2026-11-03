import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

// ─── Public single-member profile ────────────────────────────────────────────
// Same visibility gate as /api/team (isPublic + non-alumni), but returns the
// FULL public profile so /team/[id] can render everything. Strict field
// selection — email, phone, resume, rollNo, cgpa, permissions and password are
// private and are never selected here, regardless of who asks.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    await connectDB();

    const member = await User.findOne({
      _id: id,
      role: { $ne: 'Alumni' },
      status: { $ne: 'alumni' },
      isPublic: true,
    })
      .select(
        'name role designation team branch year batch bio profileImage portfolio skills interests ' +
          'languages preferredDomains achievements projects socialLinks availability createdAt ' +
          'preferences.coverBanner preferences.openToCollaboration'
      )
      .lean();

    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    const m = member as Record<string, unknown> & { _id: { toString(): string } };
    return NextResponse.json({ success: true, member: { ...m, id: m._id.toString() } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}