import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyAdminSession } from '@/lib/adminAuth';
import { GalleryItem } from '@/models/GalleryItem';

export async function GET() {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.reason }, { status: 401 });
    }

    await connectDB();
    const images = await GalleryItem.find().sort({ order: 1, createdAt: -1 });
    return NextResponse.json({ success: true, images });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.reason }, { status: 401 });
    }

    const body = await req.json();
    if (!body.caption || !body.imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Caption and Image URL are required' },
        { status: 400 }
      );
    }

    await connectDB();
    const item = await GalleryItem.create(body);
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
