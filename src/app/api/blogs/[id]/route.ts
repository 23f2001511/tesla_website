import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    await Blog.findByIdAndDelete(id);

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const body = await req.json();

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      body,
      { new: true }
    );

    return NextResponse.json({
      success: true,
      blog: updatedBlog
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false
      },
      { status: 500 }
    );
  }
}