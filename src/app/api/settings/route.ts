import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { SiteSettings } from '@/models/SiteSettings';

export async function GET() {
  try {
    await connectDB();
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Settings GET API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
