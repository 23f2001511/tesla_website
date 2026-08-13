'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

const team = [
  { id: 1, name: 'Aarav Mehta', role: 'President', category: 'Core', tag: 'PRS' },
  { id: 2, name: 'Diya Sharma', role: 'Vice President', category: 'Core', tag: 'VPR' },
  { id: 3, name: 'Rohan Verma', role: 'Technical Lead', category: 'Core', tag: 'TEC' },
  { id: 4, name: 'Ishaan Kapoor', role: 'Operations Lead', category: 'Core', tag: 'OPS' },
  { id: 5, name: 'Dr. S. Rao', role: 'Faculty Advisor', category: 'Faculty', tag: 'FAC' },
  { id: 6, name: 'Ananya Singh', role: 'Design Lead', category: 'Executive', tag: 'DES' },
  { id: 7, name: 'Kabir Anand', role: 'Events Lead', category: 'Executive', tag: 'EVT' },
  { id: 8, name: 'Meera Iyer', role: 'Outreach Lead', category: 'Executive', tag: 'OUT' },
];

const roles = ['Core', 'Executive', 'Faculty'];

export default function TeamPage() {
  const [filter, setFilter] = useState('Core');
  const filtered = team.filter((m) => m.category === filter);

  return (
    <div className="bg-ink min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24">
        {/* Header */}
        <div className="pb-10 mb-10 border-b border-line">
          <div className="tag-mono-acid mb-3">// ROSTER</div>
          <h1 className="display text-5xl sm:text-7xl text-ivory">
            THE PEOPLE<span className="text-acid">.</span>
          </h1>
          <p className="mt-6 max-w-md text-ivory-2 text-sm leading-relaxed">
            Volunteers, not managers. Everyone below ships code, designs, or
            hardware alongside running the club.
          </p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-5 py-2 font-mono text-[11px] tracking-[0.14em] uppercase border transition-colors ${
                filter === r
                  ? 'border-acid text-acid'
                  : 'border-line text-muted hover:text-ivory hover:border-line-2'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
          {filtered.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group bg-ink hover:bg-ink-2 transition-colors p-6 flex flex-col min-h-[280px]"
            >
              <div className="flex items-start justify-between mb-8">
                <span className="font-mono text-[10px] text-muted">
                  [{m.tag}]
                </span>
                <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-acid transition-colors" />
              </div>

              {/* Monogram */}
              <div className="w-20 h-20 border border-line-2 flex items-center justify-center mb-6 group-hover:border-acid group-hover:bg-acid transition-colors">
                <span className="display text-3xl text-ivory group-hover:text-acid-ink transition-colors">
                  {m.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>

              <h3 className="display text-xl text-ivory leading-tight">
                {m.name}
              </h3>
              <div className="tag-mono-acid mt-2">{m.role.toUpperCase()}</div>

              <div className="tag-mono mt-auto pt-4 group-hover:text-ivory-2 transition-colors">
                VIEW PROFILE →
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
