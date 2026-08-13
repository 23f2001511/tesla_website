'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [filter, setFilter] = useState('all');

  const events = [
    { id: 1, title: 'Web Dev Bootcamp', category: 'workshop', date: '28 MAY 2026', time: '10:00', venue: 'Lab 1, CSE Block', status: 'upcoming' },
    { id: 2, title: 'AI/ML Hackathon', category: 'hackathon', date: '15 JUN 2026', time: '09:00', venue: 'Auditorium', status: 'upcoming' },
    { id: 3, title: 'Cyber Security 101', category: 'talk', date: '10 JAN 2026', time: '14:00', venue: 'Seminar Hall A', status: 'past' },
  ];

  const filtered = events.filter(
    (e) => e.status === activeTab && (filter === 'all' || e.category === filter)
  );

  return (
    <div className="bg-ink min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 mb-10 border-b border-line">
          <div>
            <div className="tag-mono-acid mb-3">// SCHEDULE</div>
            <h1 className="display text-5xl sm:text-7xl text-ivory">EVENTS</h1>
            <p className="text-ivory-2 mt-4 max-w-md text-sm leading-relaxed">
              Workshops, hackathons, guest lectures. Everything is free for
              members.
            </p>
          </div>

          <div className="flex border border-line">
            {(['upcoming', 'past'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-mono text-xs tracking-[0.14em] uppercase transition-colors ${
                  activeTab === tab
                    ? 'bg-acid text-acid-ink font-bold'
                    : 'text-ivory-2 hover:text-ivory'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2 mb-10">
          {['all', 'workshop', 'hackathon', 'talk'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase border transition-colors ${
                filter === cat
                  ? 'border-acid text-acid'
                  : 'border-line text-muted hover:text-ivory hover:border-line-2'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="border border-line">
          {filtered.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-12 items-center border-b border-line last:border-b-0 hover:bg-ink-2 transition-colors group"
            >
              <div className="col-span-4 sm:col-span-2 border-r border-line px-4 sm:px-6 py-6">
                <div className="tag-mono">{event.date}</div>
                <div className="font-mono text-xs text-muted mt-1">{event.time}</div>
              </div>
              <div className="col-span-8 sm:col-span-6 px-4 sm:px-6 py-6">
                <h3 className="display text-xl sm:text-2xl text-ivory group-hover:text-acid transition-colors">
                  {event.title}
                </h3>
                <div className="tag-mono mt-2">{event.venue}</div>
              </div>
              <div className="hidden sm:flex sm:col-span-2 border-l border-line px-4 py-6 items-center">
                <span className="tag-mono-acid">{event.category.toUpperCase()}</span>
              </div>
              <div className="col-span-12 sm:col-span-2 border-t sm:border-t-0 sm:border-l border-line px-4 py-4 sm:py-6">
                {activeTab === 'upcoming' ? (
                  <button className="w-full btn-acid !py-2.5 justify-center">
                    Register
                  </button>
                ) : (
                  <span className="tag-mono block text-center py-2.5">ARCHIVED</span>
                )}
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="py-20 text-center tag-mono">
              NO {filter.toUpperCase()} EVENTS — CHECK BACK SOON
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
