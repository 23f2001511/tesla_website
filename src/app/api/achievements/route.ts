import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Achievement } from '@/models/Achievement';

export async function GET() {
  try {
    await connectDB();
    const achievements = await Achievement.find().sort({ year: -1, order: 1 });
    return NextResponse.json({ success: true, achievements });
  } catch (error: any) {
    console.error('Achievements GET API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
