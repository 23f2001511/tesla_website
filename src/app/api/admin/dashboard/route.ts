import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyAdminSession } from '@/lib/adminAuth';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { Event } from '@/models/Event';

export async function GET() {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.reason }, { status: 401 });
    }

    await connectDB();

    const totalMembers = await User.countDocuments();
    const activeMembers = await User.countDocuments({
      status: 'active',
    });

    const totalTeams = await Team.countDocuments();

    const upcomingEvents = await Event.countDocuments({
      status: 'upcoming',
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalMembers,
        activeMembers,
        totalTeams,
        upcomingEvents,
      },
    });
  } catch (error) {
    console.error('Dashboard Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load dashboard',
      },
      {
        status: 500,
      }
    );
  }
}