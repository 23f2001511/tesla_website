import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Event } from '@/models/Event';
import { Resource } from '@/models/Resource';
import { Achievement } from '@/models/Achievement';
import { Blog } from '@/models/Blog';

import { getErrorMessage } from '@/lib/errors';
export const dynamic = 'force-dynamic';

// ─── Public (read-only) club stats for the homepage ──────────────────────────
export async function GET() {
  try {
    await connectDB();
    const now = new Date();
    const [members, events, upcomingEvents, alumni, resourceFiles, achievements, blogs] =
      await Promise.all([
        User.countDocuments({ role: { $ne: 'Alumni' }, status: { $ne: 'alumni' }, isPublic: true }),
        Event.countDocuments({ approvalStatus: 'approved' }),
        Event.countDocuments({ approvalStatus: 'approved', date: { $gte: now } }),
        User.countDocuments({ $or: [{ role: 'Alumni' }, { status: 'alumni' }], isPublic: true }),
        Resource.aggregate([{ $project: { count: { $size: { $ifNull: ['$files', []] } } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
        Achievement.countDocuments({ status: { $nin: ['Pending', 'Draft'] } }),
        Blog.countDocuments({ status: 'Published' }),
      ]);

    return NextResponse.json({
      success: true,
      stats: {
        members,
        events,
        upcomingEvents,
        alumni,
        resources: resourceFiles[0]?.total || 0,
        achievements,
        blogs,
      },
    });
  } catch (error){
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}