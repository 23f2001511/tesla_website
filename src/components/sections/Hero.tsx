'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { HeroEnergyLogo } from '@/components/hero/HeroEnergyLogo';
import { FadeIn } from '@/components/ui/ScrollReveal';
import { useApi } from '@/lib/api';

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

// FIX 3: vertical lift for the hero logo — negative = up. Chosen by visual
// A/B testing (-20 / -30 / -40 px headless screenshots) against the left
// hero text column for the best vertical balance.
const LOGO_LIFT_PX = -30;

export function Hero() {
  // Live data: public member avatars + club stats from the backend.
  const team = useApi<{ members: { id: string; name: string; profileImage?: string }[] }>(
    '/api/team?limit=8'
  );
  const stats = useApi<{ stats: Record<string, number> }>('/api/stats');

  const avatars = team.data?.members || [];
  const s = stats.data?.stats;
  const statCells = [
    { value: s?.members, label: 'Members' },
    { value: s?.events, label: 'Events' },
    { value: s?.alumni, label: 'Alumni' },
    { value: s?.resources, label: 'Resources' },
    { value: s?.achievements, label: 'Achievements' },
  ];

  return (
    <section className="relative bg-ink overflow-hidden">
      {/* Terminal grid background */}
      <div className="absolute inset-0 bg-terminal opacity-50 pointer-events-none" />

      {/* Top padding note: `main` already carries `pt-16` (64px) as the
          fixed-navbar offset. The hero's own top padding ADDS to that, so the
          old `pt-20 sm:pt-28` stacked to 144/176px from the document top — a
          64/96px gap below the 80px-tall navbar. Now `pt-14 sm:pt-16` keeps
          that gap at a balanced 40/48px without touching the global `pt-16`. */}
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-14 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
        <FadeIn>
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-acid/40 bg-acid/10 px-4 py-1.5 text-xs text-acid">
              <Sparkles className="w-3.5 h-3.5" />
              Official Technical Club — Dept. of Electrical Engineering, NIT Patna
            </span>
            <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted hidden sm:block">
              Est. 2021 · Student-run · Open to all years
            </span>
          </div>

          <h1 className="display text-5xl sm:text-7xl lg:text-8xl leading-[0.95] max-w-4xl">
            <span className="block">Innovate. Build.</span>
            <span className="block text-acid">Inspire.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-ivory-2 max-w-2xl">
            TESLA is NIT Patna&apos;s premier Electrical Engineering club, founded in
            2021, dedicated to fostering technical excellence, innovation, and
            collaboration in Electrical Engineering and Blockchain Technology.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/events" className="btn-acid">
              Explore Events <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="btn-brut">
              Contact US
            </Link>
          </div>

          {/* Avatar stack + active members */}
          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              {team.isLoading ? (
                [0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-ink bg-ink-2 animate-pulse"
                  />
                ))
              ) : avatars.length > 0 ? (
                avatars.map((m, i) => (
                  <div
                    key={m.id || i}
                    className="w-10 h-10 rounded-full border-2 border-ink overflow-hidden bg-ink-2"
                  >
                    {m.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.profileImage}
                        alt={m.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-xs font-bold text-acid bg-acid/20">
                        {initials(m.name)}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                [0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-ink bg-ink-3"
                  />
                ))
              )}
            </div>
            <div className="text-sm text-ivory-2">
              <span className="font-bold text-ivory">Active Members</span>
            </div>
          </div>
        </FadeIn>

        {/* Animated 3D energy logo — same artwork as the Navbar logo.
            FIX 3: lifted by LOGO_LIFT_PX for vertical balance with the left
            text; applied on an inner div so it never fights the FadeIn
            entrance transform. */}
        <FadeIn delay={0.15} className="hidden lg:flex justify-center items-start origin-top scale-90 xl:scale-100">
          <div style={{ transform: `translateY(${LOGO_LIFT_PX}px)` }}>
            <HeroEnergyLogo size={320} />
          </div>
        </FadeIn>
      </div>

      {/* Stats strip */}
      <div className="relative border-t border-line bg-ink-2/60 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {statCells.map((s, i) => (
            <div
              key={s.label}
              className={`py-6 px-2 sm:px-6 ${i !== 0 ? 'lg:border-l lg:border-line' : ''}`}
            >
              <div className="display text-3xl sm:text-4xl">
                {s.value === undefined ? (
                  <span className="inline-block h-8 w-16 rounded bg-ink-2 animate-pulse" />
                ) : (
                  `${s.value}+`
                )}
              </div>
              <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted mt-1.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
