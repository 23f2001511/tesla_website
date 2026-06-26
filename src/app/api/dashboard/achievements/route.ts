// src/app/api/dashboard/achievements/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/auth';

// ── GET — fetch logged-in user's achievements ─────────────────────────────────
export async function GET() {
  try {
    await connectDB();
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;
    const userId = payload!.userId;

    const user = await User.findById(userId).select('achievements').lean() as any;
    return NextResponse.json({ success: true, achievements: user?.achievements || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ── POST — add a new achievement ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;
    const userId = payload!.userId;

    const body = await request.json();
    const { title, description, year, category, teamMembers, eventLink, coverImage, isFeatured } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const newAchievement = {
      title,
      description:  description  || '',
      year:         year         || new Date().getFullYear().toString(),
      category:     category     || 'Other',
      teamMembers:  Array.isArray(teamMembers) ? teamMembers : [],
      eventLink:    eventLink    || '',
      coverImage:   coverImage   || '',
      isFeatured:   isFeatured   ?? false,
    };

    await User.findByIdAndUpdate(userId, {
      $push: { achievements: newAchievement },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ── PATCH — toggle isFeatured on a single achievement ────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;
    const userId = payload!.userId;

    const { id, isFeatured } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

    await User.findOneAndUpdate(
      { _id: userId, 'achievements._id': id },
      { $set: { 'achievements.$.isFeatured': isFeatured } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ── DELETE — remove achievement by _id ───────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { payload, response: authError } = await requireAuth();
    if (authError) return authError;
    const userId = payload!.userId;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

    await User.findByIdAndUpdate(userId, {
      $pull: { achievements: { _id: id } },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}