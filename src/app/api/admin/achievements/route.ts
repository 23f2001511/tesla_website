import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Achievement } from '@/models/Achievement';
import { requireAuth, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Roles allowed to manage club-wide content (achievements, events, blogs, gallery, resources).
const CONTENT_MANAGERS = ['Admin', 'President', 'OfficeBearer'] as const;

// GET: Fetch achievements + dynamic metrics maps
export async function GET(request: NextRequest) {
  try {
    const { response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const filter: Record<string, any> = {};
    if (category && category !== 'All') filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { teamMembers: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await Achievement.find(filter).sort({ createdAt: -1 }).lean();
    const allItems = await Achievement.find({}).lean();

    // ─── AGGREGATIONS FOR ANALYTICS ───
    let hackathonsCount = 0;
    let openSourceCount = 0;
    let projectsCount = 0;
    let researchCount = 0;

    allItems.forEach((ac: any) => {
      if (ac.category === 'Hackathon') hackathonsCount++;
      if (ac.category === 'Open Source') openSourceCount++;
      if (ac.category === 'Project Milestone') projectsCount++;
      if (ac.category === 'Research Paper') researchCount++;
    });

    const chartData = [
      { name: 'Hackathons', Count: hackathonsCount },
      { name: 'Open Source', Count: openSourceCount },
      { name: 'Projects', Count: projectsCount },
      { name: 'Research', Count: researchCount },
    ];

    return NextResponse.json({
      success: true,
      achievements: items.map((a: any) => ({ ...a, id: a._id.toString() })),
      stats: {
        total: allItems.length,
        hackathons: hackathonsCount,
        openSource: openSourceCount,
        projects: projectsCount,
      },
      chartData
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add new global achievement log
export async function POST(request: NextRequest) {
  try {
    const { response: authError } = await requireRole([...CONTENT_MANAGERS]);
    if (authError) return authError;

    await connectDB();
    const body = await request.json();
    const { title, description, category, teamMembers, eventLink, year, isFeatured } = body;

    if (!title || !description || !category || !teamMembers || teamMembers.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing compulsory fields' }, { status: 400 });
    }

    const item = await Achievement.create({
      title,
      description,
      category,
      teamMembers: Array.isArray(teamMembers) ? teamMembers : teamMembers.split(',').map((m: string) => m.trim()),
      eventLink: eventLink || '',
      year: year || new Date().getFullYear().toString(),
      isFeatured: isFeatured || false
    });

    return NextResponse.json({ success: true, achievement: item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove record entries
export async function DELETE(request: NextRequest) {
  try {
    const { response: authError } = await requireRole([...CONTENT_MANAGERS]);
    if (authError) return authError;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

    await Achievement.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}