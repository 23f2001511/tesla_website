import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Alumni } from '@/models/Alumni';

export async function GET() {
  try {
    await connectDB();
    const alumni = await Alumni.find().sort({ batch: -1, order: 1 });
    return NextResponse.json({ success: true, alumni });
  } catch (error: any) {
    console.error('Alumni GET API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
