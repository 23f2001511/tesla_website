import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { FlagshipEvent } from '@/models/FlagshipEvent';

export async function GET() {
  try {
    await connectDB();
    let flagship = await FlagshipEvent.findOne({ isActive: true });
    if (!flagship) {
      flagship = await FlagshipEvent.findOne();
    }
    return NextResponse.json({ success: true, flagship });
  } catch (error: any) {
    console.error('Flagship GET API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
