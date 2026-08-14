'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ArrowUpRight, CheckCircle } from 'lucide-react';

const fallbackAchievements = [
  { id: '1', title: '1st Prize — Smart India Hackathon', category: 'HACKATHON', year: '2024' },
  { id: '2', title: 'Winner — CodeChase 2024', category: 'COMPETITIVE PROG.', year: '2024' },
  { id: '3', title: '2nd Prize — Robotics Championship', category: 'ROBOTICS', year: '2024' },
  { id: '4', title: 'Best Project Award — TechFest', category: 'PROJECT', year: '2023' },
];

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<any[]>(fallbackAchievements);

  useEffect(() => {
    fetch('/api/achievements')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.achievements && data.achievements.length > 0) {
          setAchievements(data.achievements);
        }
      })
      .catch((err) => console.warn('Using fallback achievements:', err));
  }, []);

  return (
    <div className="bg-ink min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24">
        {/* Header */}
        <div className="pb-10 mb-10 border-b border-line">
          <div className="tag-mono-acid mb-3">// TROPHY CABINET</div>
          <h1 className="display text-5xl sm:text-7xl text-ivory">WINS</h1>
          <p className="text-ivory-2 mt-4 max-w-md text-sm leading-relaxed">
            Some hardware we've brought home. Members' names on every single
            one.
          </p>
        </div>

        <div className="border border-line">
          {achievements.map((a, i) => (
            <motion.div
              key={a._id || a.id || i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="grid grid-cols-12 items-center border-b border-line last:border-b-0 hover:bg-ink-2 transition-colors group cursor-pointer"
            >
              <div className="col-span-3 sm:col-span-2 border-r border-line px-4 sm:px-6 py-8">
                <span className="display text-2xl sm:text-3xl text-muted group-hover:text-acid transition-colors font-bold">
                  '{a.year.slice(-2)}
                </span>
              </div>
              <div className="col-span-9 sm:col-span-7 px-4 sm:px-6 py-8">
                <div className="tag-mono-acid mb-2">{a.category}</div>
                <h3 className="display text-xl sm:text-3xl text-ivory leading-tight group-hover:text-acid transition-colors">
                  {a.title}
                </h3>
                {a.description && (
                  <p className="text-xs text-muted mt-2 max-w-xl">{a.description}</p>
                )}
              </div>
              <div className="hidden sm:flex sm:col-span-3 border-l border-line px-6 py-8 items-center justify-between">
                <span className="tag-mono text-acid flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> VERIFIED
                </span>
                <ArrowUpRight className="w-5 h-5 text-muted group-hover:text-acid group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
