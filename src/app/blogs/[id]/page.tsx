'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, User, Eye, Tag } from 'lucide-react';

export default function BlogDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/blogs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.blog) {
          setBlog(data.blog);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center py-20">
        <div className="tag-mono">LOADING ARTICLE…</div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center py-20 space-y-4">
        <div className="display text-3xl text-ivory">ARTICLE NOT FOUND</div>
        <Link href="/blogs" className="btn-acid">
          ← Return to Logs
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-ink min-h-screen">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 font-mono text-xs text-muted hover:text-acid transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to all logs
        </Link>

        {/* Meta Header */}
        <div className="border border-line corner-marks bg-ink-2 p-6 sm:p-10 mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="tag-mono-acid">[{blog.category}]</span>
            <span className="tag-mono text-muted">•</span>
            <span className="tag-mono">{blog.publishedDate || 'RECENT'}</span>
            <span className="tag-mono text-muted">•</span>
            <span className="tag-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-acid" /> {blog.readTime || '5 MIN'}
            </span>
            {blog.views > 0 && (
              <>
                <span className="tag-mono text-muted">•</span>
                <span className="tag-mono flex items-center gap-1">
                  <Eye className="w-3 h-3 text-acid" /> {blog.views} views
                </span>
              </>
            )}
          </div>

          <h1 className="display text-3xl sm:text-5xl text-ivory leading-tight mb-6">
            {blog.title}
          </h1>

          <div className="flex items-center gap-3 pt-6 border-t border-line">
            <div className="w-10 h-10 border border-line-2 flex items-center justify-center font-display text-sm text-ivory bg-ink">
              {blog.author
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <div className="font-bold text-sm text-ivory">{blog.author}</div>
              <div className="tag-mono text-[10px]">{blog.authorRole || 'Tesla Technical Club'}</div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="border border-line bg-ink-2 p-6 sm:p-10 text-ivory-2 font-mono text-sm leading-relaxed whitespace-pre-line space-y-6">
          {blog.content}
        </div>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8">
            {blog.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-ink-2 border border-line text-xs font-mono text-muted"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
