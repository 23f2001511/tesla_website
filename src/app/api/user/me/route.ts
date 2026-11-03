import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const { user, error, status } = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: error
        },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('User Me Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch user'
      },
      { status: 500 }
    );
  }
}