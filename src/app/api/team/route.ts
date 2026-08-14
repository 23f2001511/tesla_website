import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { TeamMember } from '@/models/TeamMember';

export async function GET() {
  try {
    await connectDB();
    const members = await TeamMember.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    return NextResponse.json({ success: true, members });
  } catch (error: any) {
    console.error('Public Team API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
