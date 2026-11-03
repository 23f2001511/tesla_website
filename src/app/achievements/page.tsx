'use client';

import { useEffect, useState } from 'react';
import { Trophy, Star, Award, Medal, ExternalLink, Loader2 } from 'lucide-react';
import { ScrollReveal, StaggerGroup, StaggerItem } from '@/components/ui/ScrollReveal';

const ACCENTS = [
  { Icon: Trophy, color: 'text-acid' },
  { Icon: Star, color: 'text-acid' },
  { Icon: Medal, color: 'text-acid' },
  { Icon: Award, color: 'text-acid' },
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
    <div className="bg-ink overflow-x-hidden">
      <section className="bg-ink pt-20 sm:pt-28 pb-12">
        <ScrollReveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl mx-auto">
          <div className="tag-mono-acid mb-3">{'// Wins'}</div>
          <h1 className="display text-5xl sm:text-7xl lg:text-8xl">
            Proud <span className="text-acid">moments</span>
          </h1>
          <p className="mt-4 text-ivory-2 text-base sm:text-lg">
            Celebrating the victories, milestones, and hard work of our club members.
          </p>
        </ScrollReveal>
      </section>

      <section className="bg-ink pb-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-6 h-6 text-acid animate-spin" />
            </div>
          ) : achievements.length === 0 ? (
            <div className="text-center py-20 card-brut rounded-xl">
              <Trophy className="w-10 h-10 text-muted mx-auto mb-4" />
              <p className="font-mono text-[12px] tracking-[0.14em] uppercase text-muted">
                No achievements published yet. Check back soon!
              </p>
            </div>
          ) : (
            <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {achievements.map((ach, idx) => {
                const accent = ACCENTS[idx % ACCENTS.length];
                const Icon = accent.Icon;
                return (
                  <StaggerItem key={ach.id} className="h-full">
                  <div className="card-brut rounded-xl overflow-hidden flex flex-col h-full">
                    <div className="relative h-44 overflow-hidden bg-ink-3">
                      {ach.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ach.coverImage}
                          alt={ach.title}
                          className="w-full h-full object-cover grayscale-[30] hover:grayscale-0 hover:scale-105 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-terminal">
                          <Icon className={`w-14 h-14 ${accent.color} opacity-50`} />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 chip bg-ink border border-line">
                        <Icon className={`w-3.5 h-3.5 ${accent.color}`} />
                        <span>{ach.category}</span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-acid">{ach.category}</span>
                        {ach.year && <span className="font-mono text-[10px] tracking-[0.14em] text-muted">{ach.year}</span>}
                      </div>
                      <h3 className="display text-lg leading-tight mb-3">{ach.title}</h3>
                      {ach.description && (
                        <p className="text-sm text-muted leading-relaxed line-clamp-3 mb-4">{ach.description}</p>
                      )}

                      {ach.eventLink ? (
                        <a
                          href={ach.eventLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-auto w-full py-2 border border-line hover:border-acid hover:text-acid text-ivory-2 rounded-md font-mono text-[11px] tracking-[0.14em] uppercase transition-colors flex items-center justify-center gap-2"
                        >
                          View Details <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <div className="mt-auto" />
                      )}
                    </div>
                  </div>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          )}
        </div>
      </section>
    </div>
  );
}
