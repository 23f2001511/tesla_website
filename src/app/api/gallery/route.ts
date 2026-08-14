import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { GalleryItem } from '@/models/GalleryItem';

export async function GET() {
  try {
    await connectDB();
    const images = await GalleryItem.find().sort({ order: 1, createdAt: -1 });
    return NextResponse.json({ success: true, images });
  } catch (error: any) {
    console.error('Gallery GET API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
