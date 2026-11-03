import { NextRequest, NextResponse } from 'next/server';
import type { QueryFilter } from 'mongoose';
import connectDB from '@/lib/db';
import { Gallery } from '@/models/Gallery';
import type { IGallery } from '@/types/models';

import { getErrorMessage } from '@/lib/errors';
export const dynamic = 'force-dynamic';

// ─── Public (read-only) gallery feed ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const album = searchParams.get('album');
    const mediaType = searchParams.get('mediaType');

    const filter: QueryFilter<IGallery> = {};
    if (album && album !== 'all') filter.album = album;
    if (mediaType === 'Photo' || mediaType === 'Video') filter.mediaType = mediaType;

    const items = await Gallery.find(filter)
      .select('title imageUrl mediaUrl album caption mediaType views')
      .sort({ createdAt: -1 })
      .lean<IGallery[]>();

    return NextResponse.json({
      success: true,
      items: items.map((g) => ({ ...g, id: String(g._id) })),
      albums: [...new Set(items.map((g) => g.album))],
    });
  } catch (error){
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}