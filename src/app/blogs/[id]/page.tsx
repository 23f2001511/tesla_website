'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Eye, Tag, CalendarDays } from 'lucide-react';
import { useApi } from '@/lib/api';
import { Avatar, ErrorState } from '@/components/ui/States';

function fmtDate(d: string | Date | undefined) {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface BlogData {
  _id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  coverImage?: string;
  tags?: string[];
  isFeatured?: boolean;
  views?: number;
  createdAt: string;
  author?: {
    name?: string;
    role?: string;
    profileImage?: string;
  };
}

export default function BlogDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data, error, isLoading, mutate } = useApi<{ blog: BlogData }>(
    id ? `/api/blogs/${id}` : null
  );

  const blog = data?.blog;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center py-24">
        <div className="font-mono text-xs tracking-widest text-acid animate-pulse">
          LOADING ARTICLE…
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center py-24 px-4 space-y-6">
        <ErrorState
          message={(error as Error)?.message || 'Article not found or not published'}
          onRetry={() => mutate()}
        />
        <Link href="/blogs" className="btn-acid inline-flex items-center gap-2 text-xs font-mono">
          <ArrowLeft className="w-3.5 h-3.5" /> Return to all blogs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-ivory">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 font-mono text-xs text-muted hover:text-acid transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to all articles
        </Link>

        {/* Article Header */}
        <article className="card-brut rounded-2xl overflow-hidden mb-12">
          {blog.coverImage && (
            <div className="w-full h-64 sm:h-96 relative border-b border-line overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="chip border border-acid text-acid !py-0.5 !px-2.5 !text-xs font-mono uppercase tracking-[0.14em]">
                {blog.category}
              </span>
              {blog.isFeatured && (
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-acid">
                  ★ featured
                </span>
              )}
              <span className="font-mono text-xs text-muted flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" /> {fmtDate(blog.createdAt)}
              </span>
              <span className="font-mono text-xs text-muted flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {blog.views || 0} reads
              </span>
            </div>

            <h1 className="display text-3xl sm:text-5xl leading-tight mb-8">
              {blog.title}
            </h1>

            {/* Author bar */}
            <div className="flex items-center gap-3 pt-6 border-t border-line">
              <Avatar
                src={blog.author?.profileImage}
                name={blog.author?.name || 'Member'}
                className="w-10 h-10 text-xs"
              />
              <div>
                <p className="font-semibold text-sm text-ivory">{blog.author?.name || 'Tesla Member'}</p>
                <p className="font-mono text-xs text-muted">{blog.author?.role || 'Technical Team'}</p>
              </div>
            </div>
          </div>
        </article>

        {/* Article Body */}
        <div className="card-brut rounded-2xl p-6 sm:p-12 mb-10">
          <div className="text-ivory-2 font-sans text-base sm:text-lg leading-relaxed whitespace-pre-wrap space-y-6">
            {blog.content}
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-8 mt-10 border-t border-line">
              {blog.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="chip border border-line text-muted !py-1 !px-3 !text-xs font-mono flex items-center gap-1"
                >
                  <Tag className="w-3 h-3 text-acid" /> #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
