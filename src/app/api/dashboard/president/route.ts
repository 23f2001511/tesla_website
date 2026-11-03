import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { buildLeadershipOverview } from '@/lib/leadershipOverview';

export const dynamic = 'force-dynamic';

export async function GET() {
  // President (and Admin) may view the President overview.
  const { payload, response } = await requireRole(['President', 'Admin']);
  if (response) return response;

  try {
    const data = await buildLeadershipOverview(payload!.userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('President overview error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
