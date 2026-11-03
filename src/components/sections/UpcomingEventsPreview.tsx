'use client';

import Link from 'next/link';
import { Calendar, ArrowUpRight } from 'lucide-react';
import { useApi } from '@/lib/api';
import type { PublicEventDTO } from '@/types/api';
import { ScrollReveal, StaggerGroup, StaggerItem } from '@/components/ui/ScrollReveal';

function fmtDate(d: string | Date) {
  if (!d) return 'TBA';
  const date = new Date(d);
  return isNaN(date.getTime())
    ? 'TBA'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function UpcomingEventsPreview() {
  const { data, error } = useApi<{ events: PublicEventDTO[] }>('/api/events?when=upcoming&limit=3');
  const events = data?.events || [];

  return (
    <section className="relative bg-ink py-20 sm:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="flex items-end justify-between mb-12 gap-6">
          <div>
            <div className="tag-mono-acid mb-3">{'// Upcoming'}</div>
            <h2 className="display text-3xl sm:text-5xl">
              What&apos;s <span className="text-acid">on the calendar</span>
            </h2>
          </div>
          <Link
            href="/events"
            className="hidden sm:inline-flex items-center gap-1 text-sm text-ivory-2 hover:text-acid transition-colors"
          >
            All events <ArrowUpRight className="w-4 h-4" />
          </Link>
        </ScrollReveal>

        {error ? (
          <p className="card-brut rounded-xl p-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Could not load events — check back soon.
          </p>
        ) : events.length === 0 ? (
          <p className="card-brut rounded-xl p-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {data ? 'No upcoming events yet — stay tuned.' : 'Loading calendar…'}
          </p>
        ) : (
          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e) => (
              <StaggerItem key={e.id} className="h-full">
                <Link
                  href="/events"
                  className="card-brut group flex flex-col p-6 rounded-xl h-full"
                >
                  <div className="flex items-start justify-between mb-5">
                    <span className="chip bg-acid/10 text-acid">{e.category}</span>
                    <Calendar className="w-4 h-4 text-muted group-hover:text-acid transition-colors" />
                  </div>
                  <h3 className="display text-xl group-hover:text-acid transition-colors">{e.title}</h3>
                  <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted mt-4 space-y-1">
                    <div>{fmtDate(e.date)}{e.venue ? ` · ${e.venue}` : ''}</div>
                  </div>
                  <div className="mt-auto pt-6">
                    <span className="text-xs text-acid inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Details <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </section>
  );
}