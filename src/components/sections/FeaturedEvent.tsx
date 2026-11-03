'use client';

import Link from 'next/link';
import { useApi } from '@/lib/api';
import type { PublicEventDTO } from '@/types/api';

import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

function fmtDate(d: string | Date) {
  if (!d) return 'TBA';
  const date = new Date(d);
  return isNaN(date.getTime())
    ? 'TBA'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function FeaturedEvent() {
  // Live: the next upcoming approved event from the backend. Falls back to the
  // CodeStorm banner while loading / when the calendar is empty.
  const { data, isLoading } = useApi<{ events: PublicEventDTO[] }>('/api/events?when=upcoming&limit=1');
  const event = data?.events?.[0];

  return (
    <section className="relative bg-ink py-16 sm:py-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
        <div className="relative rounded-2xl border border-acid/30 bg-ink-2 overflow-hidden">
          <div className="absolute -top-px -left-px w-3 h-3 border-t border-l border-acid" />
          <div className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-acid" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 lg:p-14">
            <div className="lg:col-span-7">
              <div className="tag-mono-acid mb-4">{'// Featured Event'}</div>
              {event ? (
                <>
                  <h2 className="display text-3xl sm:text-5xl leading-[1.05]">
                    {event.title}
                  </h2>
                  <p className="mt-5 text-sm sm:text-base text-ivory-2 leading-relaxed max-w-xl line-clamp-3">
                    {event.description}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="display text-3xl sm:text-5xl leading-[1.05]">
                    <span className="text-acid">CodeStorm</span> Hackathon
                  </h2>
                  <p className="mt-5 text-sm sm:text-base text-ivory-2 leading-relaxed max-w-xl">
                    48 hours. Build something real. Ship it in front of mentors and recruiters.
                    Open to all years and branches — teams of 1–4.
                  </p>
                </>
              )}

              <div className="mt-6 flex flex-wrap gap-4 font-mono text-[12px] uppercase tracking-[0.12em] text-muted">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-acid" />
                  {event ? fmtDate(event.date) : 'TBA — Spring Semester'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-acid" />
                  {event ? event.venue : 'EE Lab · NIT Patna'}
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/events" className="btn-acid">
                  Register <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/about" className="btn-brut">
                  Event Brief
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-xl overflow-hidden border border-line min-h-[240px] lg:min-h-[320px] bg-gradient-to-br from-acid/20 via-ink-2 to-ink-3">
                <div className="absolute inset-0 bg-terminal opacity-40 pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="display text-6xl sm:text-7xl text-acid leading-none">
                      48
                    </div>
                    <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted mt-2">
                      Hours · Build · Ship
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
