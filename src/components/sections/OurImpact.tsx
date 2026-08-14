'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const fallbackStats = [
  { value: '500+', label: 'Active members across 4 batches', tag: 'ROSTER' },
  { value: '40+', label: 'Shipped production & OSS projects', tag: 'BUILDS' },
  { value: '28', label: 'Hackathon & competition podiums', tag: 'TROPHIES' },
  { value: '96%', label: 'Placement rate in tier-1 product orgs', tag: 'CAREERS' },
];

export function OurImpact() {
  const [stats, setStats] = useState(fallbackStats);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings && data.settings.impactStats) {
          const s = data.settings.impactStats;
          setStats([
            { value: s.activeMembers || '500+', label: 'Active members across 4 batches', tag: 'ROSTER' },
            { value: s.projectsShipped || '40+', label: 'Shipped production & OSS projects', tag: 'BUILDS' },
            { value: s.hackathonWins || '28', label: 'Hackathon & competition podiums', tag: 'TROPHIES' },
            { value: s.placementRate || '96%', label: 'Placement rate in tier-1 product orgs', tag: 'CAREERS' },
          ]);
        }
      })
      .catch((err) => console.warn('Using fallback impact stats:', err));
  }, []);

  return (
    <section className="relative bg-ink border-b border-line py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="pb-10 mb-12 border-b border-line">
          <div className="tag-mono-acid mb-3">// RECORD</div>
          <h2 className="display text-4xl sm:text-5xl lg:text-6xl text-ivory">
            MEASURED IMPACT<span className="text-acid">.</span>
          </h2>
          <p className="text-ivory-2 mt-4 max-w-md text-sm leading-relaxed">
            Five years of building things that don't end up in an archive
            folder. The numbers tell the story.
          </p>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
          {stats.map((s, i) => (
            <motion.div
              key={s.tag}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-ink p-8 flex flex-col justify-between min-h-[220px] group hover:bg-ink-2 transition-colors"
            >
              <div className="tag-mono-acid mb-6">[{s.tag}]</div>
              <div>
                <div className="display text-5xl sm:text-6xl text-ivory group-hover:text-acid transition-colors">
                  {s.value}
                </div>
                <p className="text-xs text-muted font-mono mt-3 leading-relaxed">
                  {s.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
