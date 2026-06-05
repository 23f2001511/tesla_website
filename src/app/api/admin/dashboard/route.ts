import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { Event } from '@/models/Event';

export async function GET() {
  try {
    await connectDB();

    const totalMembers = await User.countDocuments();
    const activeMembers = await User.countDocuments({
      status: 'active',
    });

    const totalTeams = await Team.countDocuments();

    const upcomingEvents = await Event.countDocuments({
      date: { $gte: new Date() },
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