'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const tracks = [
  {
    id: 'T1',
    name: 'AI & GenAI Agents',
    prize: '₹2.5L',
    desc: 'LLM agents, multimodal vision, autonomous systems solving real problems.',
  },
  {
    id: 'T2',
    name: 'Web3 & Cloud',
    prize: '₹2.0L',
    desc: 'Distributed systems, smart contracts, high-performance microservices.',
  },
  {
    id: 'T3',
    name: 'Hardware & Robotics',
    prize: '₹1.8L',
    desc: 'Microcontroller prototypes, sensory IoT, autonomous robotics.',
  },
  {
    id: 'T4',
    name: 'Open Innovation',
    prize: '₹1.5L',
    desc: 'No domain limits. Build for climate, health, or education.',
  },
];

const meta: Array<[string, string]> = [
  ['DATE', 'OCT 24–26, 2026'],
  ['FORMAT', '36-HOUR SPRINT'],
  ['VENUE', 'AUDITORIUM + ONLINE'],
  ['TEAM', '2–4 MEMBERS'],
];

export function FeaturedEvent() {
  const [active, setActive] = useState(0);
  const current = tracks[active];

  return (
    <section className="relative bg-ink border-b border-line py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 mb-12 border-b border-line">
          <div>
            <div className="tag-mono-acid mb-3">// FLAGSHIP — 2026</div>
            <h2 className="display text-4xl sm:text-5xl lg:text-7xl text-ivory">
              HACK-TESLA<span className="text-acid">'26</span>
            </h2>
          </div>
          <div className="tag-mono sm:text-right">
            36 HOURS. NATIONAL LEVEL.<br />₹7.8L+ PRIZE POOL.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Track list — terminal-style */}
          <div className="lg:col-span-5">
            <div className="border border-line">
              <div className="border-b border-line bg-ink-2 px-4 py-2.5 flex items-center justify-between">
                <span className="tag-mono">SELECT_TRACK.SH</span>
                <span className="flex gap-1.5">
                  <span className="w-2 h-2 border border-line-2" />
                  <span className="w-2 h-2 border border-line-2" />
                  <span className="w-2 h-2 bg-acid" />
                </span>
              </div>
              {tracks.map((t, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActive(i)}
                    className={`w-full text-left px-4 sm:px-5 py-5 border-b border-line last:border-b-0 transition-colors flex items-center justify-between gap-4 ${
                      isActive
                        ? 'bg-acid text-acid-ink'
                        : 'bg-ink hover:bg-ink-2 text-ivory'
                    }`}
                  >
                    <div>
                      <div
                        className={`font-mono text-[10px] tracking-[0.14em] uppercase mb-1 ${
                          isActive ? 'text-acid-ink/70' : 'text-muted'
                        }`}
                      >
                        [{t.id}] — PRIZE {t.prize}
                      </div>
                      <div className="display text-lg sm:text-xl leading-tight">
                        {t.name}
                      </div>
                    </div>
                    <ArrowUpRight
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-acid-ink' : 'text-muted'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-7">
            <div className="border border-line corner-marks bg-ink-2 p-6 sm:p-10 h-full flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col h-full"
                >
                  <div className="tag-mono-acid mb-4">// {current.name.toUpperCase()}</div>
                  <h3 className="display text-3xl sm:text-5xl text-ivory leading-[0.95] mb-6">
                    BUILD. BREAK. SHIP.
                  </h3>
                  <p className="text-ivory-2 text-sm sm:text-base leading-relaxed max-w-xl mb-8">
                    {current.desc} Bring a laptop, a team, and 36 hours of
                    stubbornness. Mentors from Google, Microsoft and top
                    startups will be on the floor.
                  </p>

                  <div className="grid grid-cols-2 gap-px bg-line border border-line mb-8">
                    {meta.map(([k, v]) => (
                      <div key={k} className="bg-ink p-4">
                        <div className="tag-mono mb-1">{k}</div>
                        <div className="font-mono text-xs sm:text-sm text-ivory font-bold">
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-auto pt-4">
                    <Link href="/events" className="btn-acid">
                      Register <ArrowUpRight className="w-4 h-4" />
                    </Link>
                    <Link href="/about" className="btn-brut">
                      Rules & FAQ
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
