import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Gallery } from '@/models/Gallery';
import { requireAuth, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CONTENT_MANAGERS = ['Admin', 'President', 'OfficeBearer'] as const;

type MediaType = 'Photo' | 'Video';
type UploadSource = 'Direct' | 'GoogleDrive';

interface GalleryRecord {
  _id: { toString(): string };
  title: string;
  imageUrl: string;
  mediaUrl?: string;
  album: string;
  caption?: string;
  mediaType?: MediaType;
  uploadSource?: UploadSource;
  views?: number;
  createdAt?: Date;
}

interface GalleryInput {
  title: string;
  imageUrl: string;
  mediaUrl?: string;
  album: string;
  caption?: string;
  mediaType?: MediaType;
  uploadSource?: UploadSource;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected server error';
}

export async function GET(request: NextRequest) {
  try {
    const { response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const album = searchParams.get('album');
    const mediaType = searchParams.get('mediaType');

    // FIX: Only apply filters if they are provided and NOT equal to 'All'
    const filter: Record<string, any> = {};
    if (album && album !== 'All' && album !== 'null') filter.album = album;
    if (mediaType && mediaType !== 'All' && mediaType !== 'null') filter.mediaType = mediaType;

    const items = await Gallery.find(filter).sort({ createdAt: -1 }).lean() as GalleryRecord[];
    const allItems = await Gallery.find({}).lean() as GalleryRecord[];

    // ─── ANALYTICS CHARTS AGGREGATION ───
    const albumMap: Record<string, { photos: number; videos: number }> = {};
    let totalViews = 0;

    allItems.forEach((m) => {
      totalViews += (m.views || 0);
      const alb = m.album;
      if (!albumMap[alb]) albumMap[alb] = { photos: 0, videos: 0 };
      if (m.mediaType === 'Video') albumMap[alb].videos++;
      else albumMap[alb].photos++;
    });

    const chartData = Object.entries(albumMap).map(([name, s]) => ({
      name,
      Photos: s.photos,
      Videos: s.videos
    }));

    return NextResponse.json({
      success: true,
      media: items.map((g) => ({
        id: g._id.toString(),
        title: g.title,
        imageUrl: g.imageUrl,
        mediaUrl: g.mediaUrl || '',
        album: g.album,
        caption: g.caption || '',
        mediaType: g.mediaType || 'Photo',
        uploadSource: g.uploadSource || 'Direct',
        views: g.views || 0,
        createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : new Date().toISOString()
      })),
      chartData,
      stats: {
        total: allItems.length,
        photos: allItems.filter((i) => i.mediaType !== 'Video').length,
        videos: allItems.filter((i) => i.mediaType === 'Video').length,
        views: totalViews
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { response: authError } = await requireRole([...CONTENT_MANAGERS]);
    if (authError) return authError;

    await connectDB();
    const body = await request.json() as Partial<GalleryInput>;
    const { title, imageUrl, mediaUrl, album, caption, mediaType, uploadSource } = body;

    if (!title || !imageUrl || !album) {
      return NextResponse.json({ success: false, error: 'Missing required configuration payloads' }, { status: 400 });
    }

    const item = await Gallery.create({
      title,
      imageUrl,
      album,
      mediaUrl: mediaUrl || '',
      caption: caption || '',
      mediaType: mediaType || 'Photo',
      uploadSource: uploadSource || 'Direct',
      views: 0
    });

    return NextResponse.json({ success: true, media: item }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { response: authError } = await requireRole([...CONTENT_MANAGERS]);
    if (authError) return authError;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    }
    await Gallery.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}