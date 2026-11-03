import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export function CTA() {
  return (
    <section className="relative bg-ink py-20 sm:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
        <div className="relative rounded-2xl border border-acid/30 bg-ink-2 overflow-hidden">
          <div className="absolute -top-px -left-px w-3 h-3 border-t border-l border-acid" />
          <div className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-acid" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 sm:p-12 lg:p-14">
            <div>
              <div className="tag-mono-acid mb-4">{'// Open Call'}</div>
              <h2 className="display text-3xl sm:text-5xl leading-[1.05]">
                Ready to start your journey with{' '}
                <span className="text-acid">TESLA?</span>
              </h2>
              <p className="mt-5 text-sm sm:text-base text-ivory-2 leading-relaxed max-w-lg">
                Membership is free and open to every year and branch. Reach out to
                the core team, show up to one session, and start building.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/contact" className="btn-acid">
                  Apply Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/about" className="btn-brut">
                  <Info className="w-4 h-4" /> Know More
                </Link>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-line min-h-[220px] lg:min-h-[300px] bg-gradient-to-br from-ink-3 via-ink-2 to-ink">
              <div className="absolute inset-0 bg-terminal opacity-50 pointer-events-none" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="display text-6xl sm:text-7xl text-outline-acid leading-none">v4.0</div>
                <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-acid">
                  NOVA · 2026 cohort
                </div>
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
