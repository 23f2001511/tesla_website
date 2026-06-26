import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Event } from '@/models/Event';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/auth';

// ─── GET: Fetch Live Events Categorized Data Streams ───
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;
    const userId = payload!.userId;

    const allEvents = await Event.find({}).sort({ date: 1 }).lean();
    const userDoc = await User.findById(userId).lean();

    const now = new Date();
    
    // Separating categories dynamically matching existing interfaces
    const upcoming = allEvents.filter((e: any) => new Date(e.date) >= now);
    const completed = allEvents.filter((e: any) => new Date(e.date) < now);

    // Building structural stats metrics dynamically
    const registeredCount = allEvents.filter((e: any) => 
      e.registeredUsers?.some((id: any) => id.toString() === userId)
    ).length;

    const formattedUpcoming = upcoming.map((e: any) => {
      const isRegistered = e.registeredUsers?.some((id: any) => id.toString() === userId) || false;
      const eventDate = new Date(e.date);
      return {
        id: e._id.toString(),
        title: e.title,
        date: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: e.speaker || 'TBD', // Using speaker field fallback or format context
        venue: e.venue,
        category: e.category || 'Web Dev',
        registered: isRegistered,
        seats: e.seatLimit ? Math.max(0, e.seatLimit - (e.registeredUsers?.length || 0)) : 15,
        gradient: e.isFeatured ? 'from-violet-600 via-purple-600 to-fuchsia-700' : 'from-blue-600 via-indigo-600 to-violet-700',
        icon: e.category === 'AI/ML' ? '🧠' : e.category === 'Robotics' ? '🤖' : '💻'
      };
    });

    const formattedCompleted = completed.map((e: any) => {
      const attended = e.registeredUsers?.some((id: any) => id.toString() === userId) || false;
      return {
        id: e._id.toString(),
        title: e.title,
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        venue: e.venue,
        attended,
        hasCert: attended // Auto true if user attended the club event session
      };
    });

    // Dynamic generation matching user achievements array certificates targets
    const certificatesList = (userDoc?.achievements || [])
      .filter((a: any) => a.title.toLowerCase().includes('bootcamp') || a.title.toLowerCase().includes('winner') || a.title.toLowerCase().includes('masterclass'))
      .map((a: any, idx: number) => ({
        event: a.title,
        date: a.year || '2026',
        id: `TESLA-CERT-2026-${100 + idx}`,
        gradient: idx % 2 === 0 ? 'from-violet-600 to-purple-700' : 'from-emerald-500 to-teal-600',
        icon: a.title.toLowerCase().includes('ml') ? '🧠' : '💻'
      }));

    return NextResponse.json({
      success: true,
      stats: {
        totalRegistered: registeredCount,
        upcomingCount: upcoming.length,
        completedCount: completed.length,
        certificatesCount: certificatesList.length
      },
      upcoming: formattedUpcoming,
      completed: formattedCompleted,
      certificates: certificatesList
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── POST: Dynamic Event Registration Toggle Pipeline ───
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;
    const userId = payload!.userId;

    const { eventId } = await request.json();
    const event = await Event.findById(eventId);
    if (!event) return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });

    const userIndex = event.registeredUsers.indexOf(userId);
    let registered = false;

    if (userIndex > -1) {
      event.registeredUsers.splice(userIndex, 1);
    } else {
      if (event.seatLimit && event.registeredUsers.length >= event.seatLimit) {
        return NextResponse.json({ success: false, error: 'Seats allocation full for this session.' }, { status: 400 });
      }
      event.registeredUsers.push(userId);
      registered = true;
    }

    await event.save();
    return NextResponse.json({ success: true, registered });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}