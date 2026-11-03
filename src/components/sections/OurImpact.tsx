'use client';

import { Users, Trophy, Calendar, BookOpen, GraduationCap } from 'lucide-react';
import { useApi } from '@/lib/api';
import { ScrollReveal, StaggerGroup, StaggerItem } from '@/components/ui/ScrollReveal';

export function OurImpact() {
  const { data, error } = useApi<{ stats: Record<string, number> }>('/api/stats');

  const s = data?.stats;
  const stats = [
    { Icon: Users, value: s ? `${s.members}` : '—', label: 'Active Members' },
    { Icon: Calendar, value: s ? `${s.events}` : '—', label: 'Events Hosted' },
    { Icon: Trophy, value: s ? `${s.achievements}` : '—', label: 'Wins & Pubs' },
    { Icon: BookOpen, value: s ? `${s.resources}` : '—', label: 'Resources' },
    { Icon: GraduationCap, value: s ? `${s.alumni}` : '—', label: 'Alumni Network' },
  ];

  return (
    <section className="relative bg-ink-2 border-y border-line py-20 sm:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-12">
          <div className="tag-mono-acid mb-3">{'// Impact'}</div>
          <h2 className="display text-3xl sm:text-5xl">
            Numbers that <span className="text-acid">speak</span>
          </h2>
          {error && (
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted mt-3">
              Live stats unavailable
            </p>
          )}
        </ScrollReveal>

        <StaggerGroup className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-line rounded-2xl overflow-hidden border border-line">
          {stats.map(({ Icon, value, label }) => (
            <StaggerItem key={label} className="bg-ink-2 p-8 text-center">
              <Icon className="w-5 h-5 text-acid mx-auto mb-4" />
              <div className="display text-3xl sm:text-4xl text-ivory">{value}</div>
              <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted mt-2">
                {label}
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}