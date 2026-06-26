import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
import '@/models/User'; // register the User model so Blog.populate('author') resolves
import { requireAuth, requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CONTENT_MANAGERS = ['Admin', 'President', 'OfficeBearer'] as const;

// ================= GET ALL BLOGS =================
export async function GET() {
  try {
    const { response: authError } = await requireAuth();
    if (authError) return authError;

    await connectDB();

    const blogs = await Blog.find()
      .populate('author', 'name profileImage designation email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      blogs
    });

  } catch (error: any) {
    console.error('ADMIN BLOG FETCH ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

// ================= CREATE BLOG / BULK ACTION =================
export async function POST(request: NextRequest) {
  try {
    const { payload, response: authError } = await requireRole([...CONTENT_MANAGERS]);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();

    // ===== BULK ACTION =====
    if (body.bulkAction) {

      const { ids, action } = body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'No blog IDs provided'
          },
          { status: 400 }
        );
      }

      if (action === 'Delete') {

        await Blog.deleteMany({
          _id: { $in: ids }
        });

      } else {

        const status =
          action === 'Publish'
            ? 'Published'
            : 'Rejected';

        await Blog.updateMany(
          {
            _id: { $in: ids }
          },
          {
            $set: {
              status
            }
          }
        );
      }

      return NextResponse.json({
        success: true
      });
    }

    // ===== CREATE BLOG =====

    const {
      title,
      content,
      category,
      tags,
      coverImage,
      authorId
    } = body;

    if (!title || !content || !category) {

      return NextResponse.json(
        {
          success: false,
          error: 'Title, content and category are required'
        },
        {
          status: 400
        }
      );
    }

    const cleanTags = Array.isArray(tags)
      ? tags
      : tags
          ?.split(',')
          .map((tag: string) => tag.trim())
          .filter(Boolean) || [];

    // Default the author to the authenticated content manager when not supplied.
    const resolvedAuthor = authorId || payload?.userId;

    if (!resolvedAuthor) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to resolve blog author'
        },
        {
          status: 400
        }
      );
    }

    const newBlog = await Blog.create({
      title,
      content,
      category,
      tags: cleanTags,
      coverImage: coverImage || '',
      status: 'Published',
      author: resolvedAuthor,
      views: 0,
      likes: []
    });

    return NextResponse.json(
      {
        success: true,
        blog: newBlog
      },
      {
        status: 201
      }
    );

  } catch (error: any) {

    console.error('ADMIN BLOG CREATE ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      {
        status: 500
      }
    );
  }
}