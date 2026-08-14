import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Resource } from '@/models/Resource';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const semester = searchParams.get('semester');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    await connectDB();

    const query: any = {};
    if (semester && semester !== 'All') {
      query.semester = semester;
    }
    if (type && type !== 'all') {
      query.type = type.toUpperCase();
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const resources = await Resource.find(query).sort({ semester: 1, title: 1 });
    return NextResponse.json({ success: true, resources });
  } catch (error: any) {
    console.error('Resources GET API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Increment downloads on GET /api/resources?downloadId=...
export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Resource ID required' }, { status: 400 });
    }

    await connectDB();
    const updated = await Resource.findByIdAndUpdate(
      id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    return NextResponse.json({ success: true, resource: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
