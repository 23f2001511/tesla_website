import Link from 'next/link';
import {
  CalendarDays,
  FileText,
  BookOpen,
  GraduationCap,
  Trophy,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { ScrollReveal, StaggerGroup, StaggerItem } from '@/components/ui/ScrollReveal';

const tiles = [
  { title: 'Events', desc: 'Workshops, hackathons, and tech talks all year round.', href: '/events', icon: CalendarDays },
  { title: 'Blogs', desc: 'Write-ups, tutorials, and experiences from our members.', href: '/blogs', icon: FileText },
  { title: 'Resources', desc: 'Notes, PYQs, lab manuals, and slides — free for everyone.', href: '/resources', icon: BookOpen },
  { title: 'Alumni', desc: 'A network of graduates at top companies worldwide.', href: '/alumni', icon: GraduationCap },
  { title: 'Achievements', desc: 'Hackathon wins, research, and competition podiums.', href: '/achievements', icon: Trophy },
  { title: 'Community', desc: 'Meet the people who make TESLA what it is.', href: '/contact', icon: Users },
];

export function Features() {
  return (
    <section className="relative bg-ink py-20 sm:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-12">
          <div className="tag-mono-acid mb-3">{'// Everything you need'}</div>
          <h2 className="display text-3xl sm:text-5xl">
            Everything you need to <span className="text-acid">grow and excel</span>
          </h2>
          <p className="mt-4 text-ivory-2 text-sm sm:text-base">
            One club, every tool — learn, build, and level up with the whole community behind you.
          </p>
        </ScrollReveal>

        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map((t) => (
            <StaggerItem key={t.title} className="h-full">
              <Link
                href={t.href}
                className="card-brut group flex flex-col p-6 sm:p-7 h-full rounded-xl"
              >
                <div className="flex items-start justify-between">
                  <span className="chip bg-acid/10 text-acid">
                    <t.icon className="w-5 h-5" />
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-acid group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h3 className="display text-xl mt-5 group-hover:text-acid transition-colors">
                  {t.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed mt-2">{t.desc}</p>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
