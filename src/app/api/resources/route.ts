import { NextRequest, NextResponse } from 'next/server';
import type { QueryFilter } from 'mongoose';
import connectDB from '@/lib/db';
import { Resource } from '@/models/Resource';
import type { IResource } from '@/types/models';

import { getErrorMessage } from '@/lib/errors';
export const dynamic = 'force-dynamic';

// ─── Public (read-only) resources library ────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const semester = searchParams.get('semester'); // 'All' | '1'..'8'
    const department = searchParams.get('department');

    const filter: QueryFilter<IResource> = {};
    if (semester && semester !== 'All') filter.semester = Number(semester);
    if (department && department !== 'All') filter.department = department;

    const [resources, departments] = await Promise.all([
      Resource.find(filter)
        .select('department semester subjectName subjectCode files')
        .sort({ semester: 1, subjectName: 1 })
        .lean(),
      Resource.distinct('department'),
    ]);

    return NextResponse.json({ success: true, resources, departments: departments.sort() });
  } catch (error){
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}