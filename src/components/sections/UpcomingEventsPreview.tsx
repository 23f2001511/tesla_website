'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const events = [
  {
    id: 1,
    title: 'Full-Stack Web Dev Bootcamp',
    category: 'BOOTCAMP',
    day: '28',
    month: 'OCT',
    time: '10:00 — 16:00',
    venue: 'Lab 1, CSE Block',
  },
  {
    id: 2,
    title: 'Data Structures & Algos in Python',
    category: 'WORKSHOP',
    day: '05',
    month: 'NOV',
    time: '11:00 — 13:00',
    venue: 'Seminar Hall A',
  },
  {
    id: 3,
    title: 'Autonomous Robotics Workshop',
    category: 'HANDS-ON LAB',
    day: '12',
    month: 'NOV',
    time: '14:00 — 17:00',
    venue: 'Robotics Lab 3',
  },
  {
    id: 4,
    title: 'Industry Talk: Zero Trust Security',
    category: 'TECH TALK',
    day: '18',
    month: 'NOV',
    time: '15:00 — 17:00',
    venue: 'Main Auditorium',
  },
];

export function UpcomingEventsPreview() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [rsvpMap, setRsvpMap] = useState<Record<number, boolean>>({});

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
  };

  return (
    <section className="relative bg-ink border-b border-line py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 mb-10 border-b border-line">
          <div>
            <div className="tag-mono-acid mb-3">// CALENDAR</div>
            <h2 className="display text-4xl sm:text-5xl lg:text-6xl text-ivory">
              WHAT'S NEXT
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll('left')}
              className="w-11 h-11 border border-line text-ivory-2 hover:text-acid hover:border-acid transition-colors flex items-center justify-center"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-11 h-11 border border-line text-ivory-2 hover:text-acid hover:border-acid transition-colors flex items-center justify-center"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Link href="/events" className="btn-brut ml-2">
              All events <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Cards */}
        <div
          ref={scrollRef}
          className="flex gap-px bg-line border border-line overflow-x-auto hide-scrollbar snap-x"
        >
          {events.map((e, i) => {
            const rsvp = rsvpMap[e.id];
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group bg-ink hover:bg-ink-2 transition-colors min-w-[300px] sm:min-w-[340px] snap-start flex flex-col"
              >
                <div className="flex items-stretch justify-between border-b border-line">
                  <div className="p-5">
                    <div className="display text-4xl text-ivory">{e.day}</div>
                    <div className="tag-mono mt-1">{e.month}</div>
                  </div>
                  <div className="tag-mono-acid border-l border-line px-4 flex items-center">
                    {e.category}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="display text-xl text-ivory leading-tight mb-6 group-hover:text-acid transition-colors">
                    {e.title}
                  </h3>
                  <div className="space-y-2 mb-8 font-mono text-xs text-muted">
                    <div>TIME — {e.time}</div>
                    <div>WHERE — {e.venue}</div>
                  </div>
                  <button
                    onClick={() => setRsvpMap((p) => ({ ...p, [e.id]: !p[e.id] }))}
                    className={`mt-auto w-full py-3 font-mono text-[11px] tracking-[0.14em] uppercase font-bold border transition-colors flex items-center justify-center gap-2 ${
                      rsvp
                        ? 'bg-acid text-acid-ink border-acid'
                        : 'border-line text-ivory hover:border-acid hover:text-acid'
                    }`}
                  >
                    {rsvp ? (
                      <>
                        <Check className="w-4 h-4" /> RSVP'd
                      </>
                    ) : (
                      'Register'
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
