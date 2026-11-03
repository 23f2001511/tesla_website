'use client';

import { useMemo, useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { useApi } from '@/lib/api';
import { Avatar, EmptyState, ErrorState, SkeletonGrid } from '@/components/ui/States';
import { ScrollReveal, StaggerGroup, StaggerItem } from '@/components/ui/ScrollReveal';

function fmtDate(d: string | Date) {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface BlogItem {
  id?: string;
  _id?: string;
  title: string;
  content?: string;
  excerpt?: string;
  category?: string;
  coverImage?: string;
  tags?: string[];
  isFeatured?: boolean;
  views?: number;
  likes?: number;
  createdAt: string;
  author?: {
    name?: string;
    role?: string;
    profileImage?: string;
  };
}

export default function BlogsPage() {
  const [search, setSearch] = useState('');

  const { data, error, isLoading, mutate } = useApi<{ blogs: BlogItem[] }>('/api/blogs');

  const blogs = data?.blogs || [];
  const categories = useMemo(() => [...new Set(blogs.map((b) => b.category).filter((c): c is string => Boolean(c)))], [blogs]);
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    return blogs.filter((b) => {
      if (category !== 'all' && b.category !== category) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        b.title?.toLowerCase().includes(q) ||
        b.excerpt?.toLowerCase().includes(q) ||
        b.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    });
  }, [blogs, category, search]);

  return (
    <div className="bg-ink min-h-screen">
      <section className="border-b border-line bg-terminal">
        <ScrollReveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="tag-mono-acid mb-3">{'// THE BLOG'}</div>
          <h1 className="display text-4xl sm:text-5xl">Words from the club</h1>
          <p className="text-ivory-2 mt-3 max-w-2xl text-sm sm:text-base">
            Published articles by members — live from the database.
          </p>
        </ScrollReveal>
      </section>

      <section className="pb-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center py-6 border-b border-line mb-8">
            <div className="flex flex-wrap gap-1.5 flex-1">
              <button
                onClick={() => setCategory('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.12em] border transition-colors ${
                  category === 'all' ? 'bg-acid text-acid-ink border-acid font-bold' : 'border-line text-ivory-2 hover:border-acid hover:text-acid'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.12em] border transition-colors ${
                    category === c ? 'bg-acid text-acid-ink border-acid font-bold' : 'border-line text-ivory-2 hover:border-acid hover:text-acid'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="relative sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles, tags..."
                className="input-brut rounded-md !pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <SkeletonGrid count={6} />
          ) : error ? (
            <ErrorState message={(error as Error).message} onRetry={() => mutate()} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No articles found" hint="Published blogs will appear here." />
          ) : (
            <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((b) => (
                <StaggerItem key={b.id} className="h-full">
                <article className="card-brut rounded-xl overflow-hidden flex flex-col h-full hover:-translate-y-0.5 transition-transform">
                  {b.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.coverImage} alt={b.title} className="w-full h-44 object-cover grayscale hover:grayscale-0 transition-all" />
                  ) : (
                    <div className="w-full h-44 bg-terminal border-b border-line flex items-center justify-center">
                      <span className="display text-3xl text-outline">{b.category || 'BLOG'}</span>
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="chip border border-acid text-acid !py-0.5 !px-2 !text-[10px] font-mono uppercase tracking-[0.14em]">
                        {b.category}
                      </span>
                      {b.isFeatured && <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">★ featured</span>}
                    </div>
                    <h3 className="display text-xl leading-snug">{b.title}</h3>
                    <p className="text-xs text-ivory-2 mt-2 line-clamp-3 flex-1">{b.excerpt}…</p>

                    {(b.tags?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {b.tags?.slice(0, 4).map((t: string) => (
                          <span key={t} className="chip border border-line text-muted !py-0.5 !px-2 !text-[10px]">#{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={b.author?.profileImage} name={b.author?.name || 'Member'} className="w-8 h-8 text-[10px]" />
                        <div>
                          <p className="text-xs text-ivory">{b.author?.name || 'Member'}</p>
                          <p className="font-mono text-[10px] text-muted">{fmtDate(b.createdAt)}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-muted">
                        <Eye className="w-3 h-3" /> {b.views || 0}
                      </span>
                    </div>
                  </div>
                </article>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </div>
      </section>
    </div>
  );
}