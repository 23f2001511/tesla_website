import { NextRequest, NextResponse } from 'next/server';
import type { QueryFilter } from 'mongoose';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import type { IUser } from '@/types/models';

import { getErrorMessage } from '@/lib/errors';
export const dynamic = 'force-dynamic';

// ─── Public (read-only) alumni directory ─────────────────────────────────────
// Only PUBLIC alumni profiles (isPublic=true, role/status Alumni).
// Strict field selection — email, phone, resume, rollNo etc. never leave the DB.
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const batch = searchParams.get('batch');
    const limit = Math.min(Number(searchParams.get('limit')) || 0, 100);
    const skip = Number(searchParams.get('skip')) || 0;

    const filter: QueryFilter<IUser> = {
      $or: [{ role: 'Alumni' }, { status: 'alumni' }],
      isPublic: true,
    };
    if (batch && batch !== 'all') {
      filter.$and = [{ $or: [{ graduationYear: Number(batch) }, { batch: Number(batch) }] }];
    }
    if (search) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
            { currentRole: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
            { skills: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    const select =
      'name role designation company currentRole graduationYear batch location bio profileImage portfolio skills interests socialLinks preferences.openToCollaboration';
    let query = User.find(filter).select(select).sort({ graduationYear: -1, name: 1 }).lean<IUser[]>();
    if (skip) query = query.skip(skip);
    const alumni = limit ? await query.limit(limit) : await query;

    return NextResponse.json({
      success: true,
      alumni: alumni.map((a) => ({ ...a, id: String(a._id) })),
    });
  } catch (error){
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}