import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Event } from '@/models/Event';
import { requireAuth } from '@/lib/auth';

// ─── GET: approved events + my proposals ─────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;
    const userId = payload!.userId;

    const now = new Date();

    // Only approved events visible to all members
    const approvedEvents = await Event.find({ approvalStatus: 'approved' })
      .sort({ date: 1 })
      .lean();

    // My proposals (pending / approved / rejected) submitted by this user
    const myProposals = await Event.find({ requestedBy: userId })
      .sort({ submittedAt: -1 })
      .lean();

    const upcoming  = approvedEvents.filter((e: any) => new Date(e.date) >= now);
    const completed = approvedEvents.filter((e: any) => new Date(e.date) < now);

    const registeredCount = approvedEvents.filter((e: any) =>
      e.registeredUsers?.some((id: any) => id.toString() === userId)
    ).length;

    const formatEvent = (e: any) => ({
      id:          e._id.toString(),
      title:       e.title,
      description: e.description || '',
      date:        new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      rawDate:     e.date,
      venue:       e.venue,
      category:    e.category || 'General',
      speaker:     e.speaker  || '',
      poster:      e.poster   || '',
      isFeatured:  e.isFeatured || false,
      seats:       e.seatLimit
        ? Math.max(0, e.seatLimit - (e.registeredUsers?.length || 0))
        : null,
      gradient:    e.isFeatured
        ? 'from-violet-600 via-purple-600 to-fuchsia-700'
        : 'from-blue-600 via-indigo-600 to-violet-700',
      icon: e.category === 'AI/ML' ? '🧠'
          : e.category === 'Robotics' ? '🤖'
          : e.category === 'Hackathon' ? '⚡'
          : e.category === 'Design' ? '🎨'
          : '💻',
    });

    const formatProposal = (e: any) => ({
      id: e._id.toString(),
      title: e.title,
      description: e.description,
      date: new Date(e.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      venue: e.venue,
      category: e.category,

      // ADD THESE
      poster: e.poster || '',
      speaker: e.speaker || '',
      isFeatured: e.isFeatured || false,

      status: e.approvalStatus,

      submittedAt: e.submittedAt
        ? new Date(e.submittedAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : new Date(e.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),

      requestNote: e.requestNote || '',
      adminRemarks: e.adminRemarks || '',
    });

    // Next upcoming event
    const nextEvent = upcoming[0] ? formatEvent(upcoming[0]) : null;

    return NextResponse.json({
      success: true,
      stats: {
        totalRegistered: registeredCount,
        upcomingCount:   upcoming.length,
        completedCount:  completed.length,
      },
      nextEvent,
      upcoming:    upcoming.map(formatEvent),
      completed:   completed.map((e: any) => ({
        ...formatEvent(e),
        attended: e.registeredUsers?.some((id: any) => id.toString() === userId) || false,
      })),
      myProposals: myProposals.map(formatProposal),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── POST: Submit event proposal (pending, not published) ─────────────────────
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;
    const userId = payload!.userId;

    const body = await request.json();
    const { title, description, date, venue, category, speaker, poster, seatLimit, requestNote } = body;

    if (!title || !description || !date || !venue || !category) {
      return NextResponse.json(
        { success: false, error: 'Title, description, date, venue and category are required.' },
        { status: 400 }
      );
    }

    // Create as PENDING — will appear in Admin Pending Requests automatically
    const proposal = await Event.create({
      title,
      description,
      date:           new Date(date),
      venue,
      category,
      speaker:        speaker   || '',
      poster:         poster    || '',
      seatLimit:      seatLimit ? Number(seatLimit) : undefined,
      isFeatured:     false,
      approvalStatus: 'pending',
      requestedBy:    userId,
      requestNote:    requestNote || '',
      submittedAt:    new Date(),
      registeredUsers: [],
      waitlist:        [],
    });

    return NextResponse.json({ success: true, proposalId: proposal._id.toString() }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}