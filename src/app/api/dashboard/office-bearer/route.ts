import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { buildLeadershipOverview } from '@/lib/leadershipOverview';

export const dynamic = 'force-dynamic';

export async function GET() {
  // OfficeBearer (and Admin) may view the Office Bearer overview.
  const { payload, response } = await requireRole(['OfficeBearer', 'Admin']);
  if (response) return response;

  try {
    const data = await buildLeadershipOverview(payload!.userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('OfficeBearer overview error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
