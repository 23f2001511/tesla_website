import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyAdminSession } from '@/lib/adminAuth';
import { TeamMember } from '@/models/TeamMember';
import { Event } from '@/models/Event';
import { Blog } from '@/models/Blog';
import { GalleryItem } from '@/models/GalleryItem';
import { Resource } from '@/models/Resource';
import { Achievement } from '@/models/Achievement';
import { Alumni } from '@/models/Alumni';

export async function GET() {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason || 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const [
      totalTeam,
      totalEvents,
      upcomingEvents,
      totalBlogs,
      totalGallery,
      totalResources,
      totalAchievements,
      totalAlumni,
    ] = await Promise.all([
      TeamMember.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ status: 'upcoming' }),
      Blog.countDocuments(),
      GalleryItem.countDocuments(),
      Resource.countDocuments(),
      Achievement.countDocuments(),
      Alumni.countDocuments(),
    ]);

    const recentEvents = await Event.find().sort({ createdAt: -1 }).limit(3);
    const recentBlogs = await Blog.find().sort({ createdAt: -1 }).limit(3);

    return NextResponse.json({
      success: true,
      user: {
        email: auth.email,
        name: auth.name,
      },
      counts: {
        team: totalTeam,
        events: totalEvents,
        upcomingEvents,
        blogs: totalBlogs,
        gallery: totalGallery,
        resources: totalResources,
        achievements: totalAchievements,
        alumni: totalAlumni,
      },
      recentEvents,
      recentBlogs,
    });
  } catch (error: any) {
    console.error('Stats Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
