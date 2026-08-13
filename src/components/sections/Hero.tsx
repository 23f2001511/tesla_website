'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const ease = [0.16, 1, 0.3, 1] as const;

const domains = [
  'AI & Machine Learning',
  'Fullstack Engineering',
  'Competitive Programming',
  'Robotics & Embedded IoT',
  'Cyber Security & Cloud',
  'Design & Product UX',
];

const stats = [
  { k: '500+', v: 'Active members' },
  { k: '45+', v: 'Workshops / year' },
  { k: '80+', v: 'Projects shipped' },
  { k: '25+', v: 'Hackathons won' },
];

export function Hero() {
  return (
    <section className="relative bg-ink border-b border-line overflow-hidden">
      <div className="absolute inset-0 bg-terminal pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 sm:pt-28 sm:pb-14">
        {/* Top row: tagline + meta */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="flex flex-wrap items-center justify-between gap-3 pb-8 border-b border-line"
        >
          <div className="tag-mono">
            <span className="text-acid">●</span>&nbsp;&nbsp;OFFICIAL TECHNICAL CLUB — CAMPUS
          </div>
          <div className="tag-mono hidden sm:block">
            EST. 2020 <span className="mx-2 text-line-2">/</span> STUDENT-RUN
            <span className="mx-2 text-line-2">/</span> OPEN TO ALL YEARS
          </div>
        </motion.div>

        {/* Headline */}
        <div className="pt-10 pb-12 sm:pt-14 sm:pb-16">
          <h1 className="display text-[13vw] sm:text-[9.5vw] lg:text-[8.2vw] leading-[0.9] text-ivory">
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.05, ease }}
            >
              WE BUILD
            </motion.span>
            <motion.span
              className="block text-acid"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease }}
            >
              REAL THINGS.
            </motion.span>
            <motion.span
              className="block text-outline"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease }}
            >
              NOT PORTFOLIOS.
            </motion.span>
          </h1>
        </div>

        {/* Sub + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12"
        >
          <p className="max-w-md text-sm sm:text-base text-ivory-2 leading-relaxed">
            TESLA is a student-run technical club for engineers, designers and
            researchers who learn by shipping. Six tracks. Real deadlines. Code
            that runs, bots that move, papers that publish.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/contact" className="btn-acid">
              Join the club <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link href="/events" className="btn-brut">
              See events
            </Link>
          </div>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 border-t border-line"
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className={`py-6 px-4 sm:px-6 ${
                i !== 0 ? 'border-l border-line' : ''
              } border-t md:border-t-0 first:border-l-0`}
            >
              <div className="display text-3xl sm:text-4xl text-ivory">
                {s.k}
              </div>
              <div className="tag-mono mt-2">{s.v}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Marquee */}
      <div className="relative border-t border-line bg-ink-2 py-3 overflow-hidden">
        <div className="marquee-track">
          {[0, 1].map((n) => (
            <div key={n} className="flex items-center">
              {domains.map((d, i) => (
                <span
                  key={`${n}-${i}`}
                  className="font-mono text-xs tracking-[0.18em] uppercase text-ivory-2"
                >
                  <span className="mx-5">{d}</span>
                  <span className="text-acid mx-1">/</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
