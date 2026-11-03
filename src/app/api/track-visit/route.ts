import { NextRequest, NextResponse } from 'next/server';
import  connectDB  from '@/lib/db';
import { Visit } from '@/models/Visit';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const path = body?.path || '/';

    await Visit.create({ path });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track visit error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}