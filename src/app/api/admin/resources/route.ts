import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Resource } from '@/models/Resource';
import { requireAuth, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CONTENT_MANAGERS = ['Admin', 'President', 'OfficeBearer'] as const;

// ─── GET: Fetch Resources + Live Aggregated Analytics ────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const semester = searchParams.get('semester');

    const filter: Record<string, any> = {};
    if (department && department !== 'All') filter.department = department;
    if (semester && semester !== 'All') filter.semester = Number(semester);

    const resources = await Resource.find(filter).sort({ subjectName: 1 }).lean();
    
    // Global Accumulators live metrics pull karne ke liye
    const allResources = await Resource.find({}).lean();
    
    const deptMap: Record<string, { notes: number; pyqs: number; total: number }> = {};
    let aggregatedViews = 0;
    let aggregatedDownloads = 0;

    allResources.forEach((res: any) => {
      const dName = res.department;
      if (!deptMap[dName]) {
        deptMap[dName] = { notes: 0, pyqs: 0, total: 0 };
      }
      res.files?.forEach((f: any) => {
        deptMap[dName].total++;
        if (f.type === 'Note') deptMap[dName].notes++;
        if (f.type === 'PYQ') deptMap[dName].pyqs++;
        
        // Accumulate analytics hits metrics
        aggregatedViews += (f.views || 0);
        aggregatedDownloads += (f.downloads || 0);
      });
    });

    const chartData = Object.entries(deptMap).map(([name, stats]) => ({
      name,
      Notes: stats.notes,
      PYQs: stats.pyqs,
      Total: stats.total
    }));

    // Dynamic timeline chart mock framework parameters (Aap database logs timeline bhi parse kar sakte hain)
    const trafficTimeline = [
      { name: 'Wk 1', Views: Math.round(aggregatedViews * 0.4), Downloads: Math.round(aggregatedDownloads * 0.4) },
      { name: 'Wk 2', Views: Math.round(aggregatedViews * 0.6), Downloads: Math.round(aggregatedDownloads * 0.6) },
      { name: 'Wk 3', Views: Math.round(aggregatedViews * 0.8), Downloads: Math.round(aggregatedDownloads * 0.8) },
      { name: 'Live Now', Views: aggregatedViews, Downloads: aggregatedDownloads },
    ];

    return NextResponse.json({ 
      success: true, 
      resources, 
      chartData,
      traffic: {
        views: aggregatedViews,
        downloads: aggregatedDownloads,
        timeline: trafficTimeline
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── POST: Document Upload Entry Ingestion Pipeline ──────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Team Leaders & Team Members may upload too; ownership is stamped so they can manage only their own files.
    const { payload, response: authError } = await requireRole([...CONTENT_MANAGERS, 'TeamLeader', 'TeamMember']);
    if (authError) return authError;

    await connectDB();
    const body = await request.json();
    const { department, semester, subjectName, subjectCode, fileTitle, fileUrl, fileType } = body;

    if (!department || !semester || !subjectName || !fileTitle || !fileUrl || !fileType) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    let resource = await Resource.findOne({
      department,
      semester: Number(semester),
      subjectName: { $regex: new RegExp(`^${subjectName.trim()}$`, 'i') }
    });

    const newFilePayload = { title: fileTitle, fileUrl, type: fileType, views: 0, downloads: 0, uploadedBy: payload!.userId };

    if (resource) {
      resource.files.push(newFilePayload);
      await resource.save();
    } else {
      resource = await Resource.create({
        department,
        semester: Number(semester),
        subjectName: subjectName.trim(),
        subjectCode: subjectCode || '',
        files: [newFilePayload]
      });
    }

    return NextResponse.json({ success: true, resource }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── PATCH: Atomic Multi-Action Traffic Analytics Aggregator ─────────────────
export async function PATCH(request: NextRequest) {
  try {
    // View/download counters are incremented by any signed-in viewer, not just managers.
    const { response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();
    const { fileId, actionType } = await request.json(); // actionType: 'views' | 'downloads'

    if (!fileId || !['views', 'downloads'].includes(actionType)) {
      return NextResponse.json({ success: false, error: 'Invalid operation parameters' }, { status: 400 });
    }

    // Atomic Mongoose operational sub-document mapping syntax increment array targets safely
    const fieldToIncrement = actionType === 'views' ? 'files.$.views' : 'files.$.downloads';
    
    const result = await Resource.findOneAndUpdate(
      { "files._id": fileId },
      { $inc: { [fieldToIncrement]: 1 } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json({ success: false, error: 'Target file structure node missing' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}