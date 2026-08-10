import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const { status } = await req.json();

    const blog = await Blog.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      blog
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false
      },
      { status: 500 }
    );
  }
}