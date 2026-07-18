'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Award, Medal, ExternalLink, Loader2 } from 'lucide-react';

// Icon + accent rotation — gives the grid visual variety without needing an
// icon stored per record. Purely presentational, keyed off the card index.
const ACCENTS = [
  { Icon: Trophy, color: 'text-yellow-400', grad: 'from-yellow-500/20 to-amber-600/10' },
  { Icon: Star,   color: 'text-blue-400',   grad: 'from-blue-500/20 to-indigo-600/10' },
  { Icon: Medal,  color: 'text-pink-400',   grad: 'from-pink-500/20 to-rose-600/10' },
  { Icon: Award,  color: 'text-purple-400', grad: 'from-purple-500/20 to-fuchsia-600/10' },
];

interface Achievement {
  id: string;
  title: string;
  description?: string;
  category: string;
  year?: string;
  coverImage?: string;
  eventLink?: string;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/achievements', { cache: 'no-store' });
        const data = await res.json();
        if (data.success) setAchievements(data.achievements);
      } catch {
        // Network fault — fall through to the empty state.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Proud <span className="text-gradient">Moments</span></h1>
        <p className="text-gray-400 text-lg">Celebrating the victories, milestones, and hard work of our club members.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : achievements.length === 0 ? (
        <div className="text-center py-24 glass rounded-2xl border-white/5">
          <Trophy className="w-10 h-10 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No achievements published yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {achievements.map((ach, idx) => {
            const accent = ACCENTS[idx % ACCENTS.length];
            const Icon = accent.Icon;
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (idx % 8) * 0.08 }}
                className="glass rounded-2xl overflow-hidden group hover:-translate-y-2 transition-transform duration-300 border-white/5 flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors z-10" />
                  {ach.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ach.coverImage} alt={ach.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${accent.grad} flex items-center justify-center`}>
                      <Icon className={`w-14 h-14 ${accent.color} opacity-40`} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 z-20">
                    <div className={`p-2 rounded-full bg-background/80 backdrop-blur-md border border-white/10 ${accent.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{ach.category}</span>
                    {ach.year && <span className="text-xs text-gray-500 font-mono">{ach.year}</span>}
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight mb-2">{ach.title}</h3>
                  {ach.description && <p className="text-sm text-gray-400 line-clamp-3 mb-4">{ach.description}</p>}

                  {ach.eventLink ? (
                    <a
                      href={ach.eventLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-auto w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors border border-white/10 flex items-center justify-center gap-2 text-sm"
                    >
                      View Details <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <div className="mt-auto" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
