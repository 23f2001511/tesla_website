import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

// ─── Public (read-only) team / members directory ─────────────────────────────
// Only PUBLIC member profiles. Excludes alumni (they have /api/alumni).
// Strict field selection — email, phone, resume, rollNo, cgpa are private.
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role'); // filter by club role
    const limit = Math.min(Number(searchParams.get('limit')) || 0, 100);
    const skip = Number(searchParams.get('skip')) || 0;

    const filter: Record<string, unknown> = {
      role: { $ne: 'Alumni' },
      status: { $ne: 'alumni' },
      isPublic: true,
    };
    if (role && role !== 'all') filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { team: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
      ];
    }

    const select =
      'name role designation team branch year batch bio profileImage portfolio skills interests projects socialLinks preferences.openToCollaboration';
    const order: Record<string, number> = {
      Admin: 0, PI: 1, President: 2, OfficeBearer: 3, TeamLeader: 4, TeamMember: 5,
    };
    let query = User.find(filter).select(select).lean();
    if (skip) query = query.skip(skip);
    const members = (limit ? await query.limit(limit) : await query) as Array<
      Record<string, unknown> & { _id: { toString(): string }; name?: string; role?: string }
    >;
    members.sort((a, b) =>
      (order[String(a.role)] ?? 9) - (order[String(b.role)] ?? 9) || String(a.name).localeCompare(String(b.name))
    );

    return NextResponse.json({
      success: true,
      members: members.map((m) => ({ ...m, id: m._id.toString() })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}