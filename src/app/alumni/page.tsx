'use client';

import { useMemo, useState } from 'react';
import { Search, MapPin, Building2 } from 'lucide-react';
import { useApi } from '@/lib/api';
import { Avatar, EmptyState, ErrorState, SkeletonGrid } from '@/components/ui/States';
import { ScrollReveal, StaggerGroup, StaggerItem } from '@/components/ui/ScrollReveal';

interface AlumniItem {
  id?: string;
  _id?: string;
  name: string;
  role?: string;
  designation?: string;
  company?: string;
  currentRole?: string;
  graduationYear?: number;
  batch?: number;
  location?: string;
  bio?: string;
  profileImage?: string;
  portfolio?: string;
  skills?: string[];
  interests?: string[];
  socialLinks?: Record<string, string>;
}

const PAGE_SIZE = 8;

export default function AlumniPage() {
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const { data, error, isLoading, mutate } = useApi<{ alumni: AlumniItem[] }>('/api/alumni');

  const alumni = data?.alumni || [];
  const batches = useMemo(
    () =>
      [...new Set(alumni.map((a) => a.graduationYear || a.batch).filter((n): n is number => typeof n === 'number'))].sort(
        (a, b) => b - a
      ),
    [alumni]
  );
  const [batch, setBatch] = useState<string>('all');

  const filtered = useMemo(
    () =>
      alumni.filter((a) => {
        const year = String(a.graduationYear || a.batch || '');
        if (batch !== 'all' && year !== batch) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          a.name?.toLowerCase().includes(q) ||
          a.company?.toLowerCase().includes(q) ||
          a.currentRole?.toLowerCase().includes(q) ||
          a.location?.toLowerCase().includes(q)
        );
      }),
    [alumni, batch, search]
  );
  const shown = filtered.slice(0, visible);

  return (
    <div className="bg-ink min-h-screen">
      <section className="border-b border-line bg-terminal">
        <ScrollReveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="tag-mono-acid mb-3">{'// ALUMNI NETWORK'}</div>
          <h1 className="display text-4xl sm:text-5xl">Where they went</h1>
          <p className="text-ivory-2 mt-3 max-w-2xl text-sm sm:text-base">
            TESLA alumni across the industry. Live from the club database — only public profiles are shown.
          </p>
        </ScrollReveal>
      </section>

      <section className="pb-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center py-6 border-b border-line mb-8">
            <div className="flex flex-wrap gap-1.5 flex-1">
              <button
                onClick={() => { setBatch('all'); setVisible(PAGE_SIZE); }}
                className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.12em] border transition-colors ${
                  batch === 'all' ? 'bg-acid text-acid-ink border-acid font-bold' : 'border-line text-ivory-2 hover:border-acid hover:text-acid'
                }`}
              >
                All batches
              </button>
              {batches.map((b) => (
                <button
                  key={b}
                  onClick={() => { setBatch(String(b)); setVisible(PAGE_SIZE); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono tracking-[0.12em] border transition-colors ${
                    batch === String(b) ? 'bg-acid text-acid-ink border-acid font-bold' : 'border-line text-ivory-2 hover:border-acid hover:text-acid'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <div className="relative sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
                placeholder="Search name, company, role..."
                className="input-brut rounded-md !pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <SkeletonGrid count={8} />
          ) : error ? (
            <ErrorState message={(error as Error).message} onRetry={() => mutate()} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No alumni found" hint="Try a different batch or search term." />
          ) : (
            <>
              <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shown.map((a) => (
                  <StaggerItem key={a.id} className="card-brut rounded-xl p-6 flex flex-col items-center text-center h-full hover:-translate-y-0.5 transition-transform">
                    <Avatar src={a.profileImage} name={a.name} />
                    <h3 className="display text-lg mt-4">{a.name}</h3>
                    <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-acid mt-1">
                      {a.currentRole || a.designation || 'Alumni'}
                    </p>

                    <div className="mt-3 space-y-1 text-xs text-ivory-2">
                      {a.company && (
                        <p className="flex items-center justify-center gap-1.5">
                          <Building2 className="w-3 h-3 text-muted" /> {a.company}
                        </p>
                      )}
                      {a.location && (
                        <p className="flex items-center justify-center gap-1.5">
                          <MapPin className="w-3 h-3 text-muted" /> {a.location}
                        </p>
                      )}
                      {(a.graduationYear || a.batch) && (
                        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                          Batch of {a.graduationYear || a.batch}
                        </p>
                      )}
                    </div>

                    {(a.skills?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                        {a.skills?.slice(0, 4).map((s: string) => (
                          <span key={s} className="chip border border-line text-muted !py-0.5 !px-2 !text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {(a.socialLinks?.linkedin || a.portfolio) && (
                      <div className="flex gap-2 mt-auto pt-5">
                        {a.socialLinks?.linkedin && (
                          <a href={a.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-8 h-8 rounded-md border border-line flex items-center justify-center hover:border-acid hover:text-acid text-ivory-2 transition-colors text-xs font-mono">in</a>
                        )}
                        {a.portfolio && (
                          <a href={a.portfolio} target="_blank" rel="noopener noreferrer" aria-label="Portfolio" className="w-8 h-8 rounded-md border border-line flex items-center justify-center hover:border-acid hover:text-acid text-ivory-2 transition-colors text-xs font-mono">@</a>
                        )}
                      </div>
                    )}
                  </StaggerItem>
                ))}
              </StaggerGroup>

              {filtered.length > visible && (
                <div className="text-center mt-10">
                  <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn-brut">
                    Load more ({filtered.length - visible} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}