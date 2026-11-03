'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, MapPin, User as UserIcon } from 'lucide-react';
import { useApi } from '@/lib/api';
import type { PublicEventDTO } from '@/types/api';
import { EmptyState, ErrorState, SkeletonGrid } from '@/components/ui/States';
import { ScrollReveal, StaggerGroup, StaggerItem } from '@/components/ui/ScrollReveal';

function fmtDate(d: string | Date) {
  if (!d) return 'TBA';
  const date = new Date(d);
  if (isNaN(date.getTime())) return 'TBA';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EventsPage() {
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const [category, setCategory] = useState('all');

  const { data, error, isLoading, mutate } = useApi<{ events: PublicEventDTO[] }>(
    `/api/events?when=${when}`
  );

  const events = data?.events || [];
  const categories = useMemo(() => [...new Set(events.map((e) => e.category).filter((c): c is string => Boolean(c)))], [events]);
  const filtered = category === 'all' ? events : events.filter((e) => e.category === category);

  return (
    <div className="bg-ink min-h-screen">
      <section className="border-b border-line bg-terminal">
        <ScrollReveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="tag-mono-acid mb-3">{'// EVENTS'}</div>
          <h1 className="display text-4xl sm:text-5xl">What&apos;s happening</h1>
          <p className="text-ivory-2 mt-3 max-w-2xl text-sm sm:text-base">
            Workshops, hackathons and meetups — live from the club calendar.
          </p>
        </ScrollReveal>
      </section>

      <section className="pb-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center py-6 border-b border-line mb-8">
            <div className="flex gap-1.5">
              {(['upcoming', 'past'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => { setWhen(w); setCategory('all'); }}
                  className={`px-4 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.12em] border transition-colors ${
                    when === w ? 'bg-acid text-acid-ink border-acid font-bold' : 'border-line text-ivory-2 hover:border-acid hover:text-acid'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 flex-1 sm:justify-end">
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
          </div>

          {isLoading ? (
            <SkeletonGrid count={6} />
          ) : error ? (
            <ErrorState message={(error as Error).message} onRetry={() => mutate()} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={`No ${when} events`}
              hint={when === 'upcoming' ? 'Check back soon — new events drop regularly.' : 'Past events will appear here after they happen.'}
            />
          ) : (
            <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((ev) => (
                <StaggerItem key={ev.id} className="h-full">
                <article className="card-brut rounded-xl p-6 flex flex-col h-full hover:-translate-y-0.5 transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <span className="chip border border-acid text-acid !py-0.5 !px-2 !text-[10px] font-mono uppercase tracking-[0.14em]">
                      {ev.category}
                    </span>
                    {ev.isFeatured && (
                      <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">★ featured</span>
                    )}
                  </div>

                  {ev.poster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ev.poster} alt={ev.title} className="rounded-md border border-line mb-4 w-full h-40 object-cover" />
                  )}

                  <h3 className="display text-xl leading-snug">{ev.title}</h3>
                  {ev.description && (
                    <p className="text-xs text-ivory-2 mt-2 line-clamp-3">{ev.description}</p>
                  )}

                  <div className="mt-4 space-y-1.5 text-xs text-ivory-2">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-acid" /> {fmtDate(ev.date)}
                    </p>
                    {ev.venue && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-acid" /> {ev.venue}
                      </p>
                    )}
                    {ev.speaker && (
                      <p className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5 text-acid" /> {ev.speaker}
                      </p>
                    )}
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