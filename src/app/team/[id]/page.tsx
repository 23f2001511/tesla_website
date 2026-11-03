'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Award, Briefcase, Calendar, ExternalLink, Globe,
  Sparkles,
} from 'lucide-react';
import { FaGithub, FaLinkedin, FaTwitter, FaInstagram } from '@/components/ui/SocialIcons';
import { useApi } from '@/lib/api';
import { Avatar, ErrorState } from '@/components/ui/States';
import { ScrollReveal, StaggerGroup, StaggerItem } from '@/components/ui/ScrollReveal';

type Achievement = {
  _id?: string;
  title: string;
  description?: string;
  year?: string;
  category?: string;
  teamMembers?: string[];
  eventLink?: string;
  coverImage?: string;
  isFeatured?: boolean;
};

type Project = { title: string; description?: string; github?: string; demo?: string };

type Member = {
  id: string;
  name: string;
  role?: string;
  designation?: string;
  team?: string;
  branch?: string;
  year?: string;
  batch?: number;
  bio?: string;
  profileImage?: string;
  portfolio?: string;
  availability?: string;
  skills?: string[];
  interests?: string[];
  languages?: string[];
  preferredDomains?: string[];
  achievements?: Achievement[];
  projects?: Project[];
  socialLinks?: { linkedin?: string; github?: string; instagram?: string; twitter?: string };
  preferences?: { coverBanner?: string; openToCollaboration?: boolean };
  createdAt?: string;
};

// ── Loading skeleton — mirrors the real layout so nothing jumps on hydrate ──
function ProfileSkeleton() {
  return (
    <div className="bg-ink min-h-screen animate-pulse">
      <div className="border-b border-line bg-terminal">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="h-8 w-36 bg-ink-3 rounded mb-6" />
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center">
            <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-xl bg-ink-3 shrink-0" />
            <div className="w-full">
              <div className="h-4 w-32 bg-ink-3 rounded mb-3" />
              <div className="h-10 w-3/4 bg-ink-3 rounded mb-4" />
              <div className="h-5 w-1/2 bg-ink-3 rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-4 lg:grid-cols-3">

        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="card-brut rounded-xl p-8 h-48" />
          <div className="card-brut rounded-xl p-8 h-40" />
        </div>
        <div className="card-brut rounded-xl p-8 h-56" />
      </div>
    </div>
  );
}

// Shared section shell — icon + acid label + content, revealed on scroll.
function Section({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ScrollReveal>
      <section className="card-brut rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-line">
          <span className="text-acid">{icon}</span>
          <h2 className="tag-mono-acid !mb-0">{`// ${label}`}</h2>
        </div>
        {children}
      </section>
    </ScrollReveal>
  );
}


function metaLine(m: Member): string {
  return [m.team, m.branch, m.year, m.batch ? `Batch ${m.batch}` : ''].filter(Boolean).join(' · ');
}

export default function TeamMemberProfile() {
  const params = useParams<{ id: string }>();
  const { data, error, isLoading, mutate } = useApi<{ member: Member }>(
    params?.id ? `/api/team/${params.id}` : null
  );

  if (isLoading) return <ProfileSkeleton />;

  if (error || !data?.member) {
    const msg = (error as Error)?.message || 'Member not found';
    const notFound = /not found/i.test(msg);
    return (
      <div className="bg-ink min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <ErrorState
            title={notFound ? 'Member not found' : 'Unable to load profile'}
            message={notFound ? 'This profile may have been made private or removed.' : msg}
            onRetry={notFound ? undefined : () => mutate()}
          />
          <Link href="/team" className="btn-brut inline-flex items-center gap-2 mt-4 !py-2 !px-5 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Team
          </Link>
        </div>
      </div>
    );
  }

  const m = data.member;
  const skills = m.skills || [];
  const achievements = m.achievements || [];
  const projects = m.projects || [];
  const interests = m.interests || [];
  const languages = m.languages || [];
  const domains = m.preferredDomains || [];
  const links = m.socialLinks || {};
  type SocialItem = {
    key: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href: string;
  };

  const socials: SocialItem[] = [];
  if (links.linkedin) socials.push({ key: 'linkedin', icon: FaLinkedin, label: 'LinkedIn', href: links.linkedin });
  if (links.github) socials.push({ key: 'github', icon: FaGithub, label: 'GitHub', href: links.github });
  if (links.instagram) socials.push({ key: 'instagram', icon: FaInstagram, label: 'Instagram', href: links.instagram });
  if (links.twitter) socials.push({ key: 'twitter', icon: FaTwitter, label: 'X / Twitter', href: links.twitter });
  if (m.portfolio) socials.push({ key: 'portfolio', icon: Globe, label: 'Portfolio', href: m.portfolio });

  // Every public field not surfaced in a section above, so nothing the
  // backend exposes is silently dropped from the profile.
  const extras: { label: string; value: string }[] = [
    m.availability ? { label: 'Availability', value: m.availability } : null,
    m.preferences?.openToCollaboration ? { label: 'Open to collaboration', value: 'Yes' } : null,
    m.createdAt
      ? {
          label: 'Member since',
          value: new Date(m.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        }
      : null,
  ].filter((x): x is { label: string; value: string } => x !== null);

  return (
    <div className="bg-ink min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="border-b border-line bg-terminal">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Link
            href="/team"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-acid transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Team
          </Link>

          <ScrollReveal>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center">
              <Avatar src={m.profileImage} name={m.name} className="w-28 h-28 sm:w-40 sm:h-40 text-4xl rounded-xl" />
              <div className="min-w-0">
                <div className="tag-mono-acid mb-3">{'// PROFILE'}</div>
                <h1 className="display text-3xl sm:text-5xl break-words">{m.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {(m.designation || m.role) && (
                    <span className="font-mono text-[11px] tracking-[0.14em] uppercase font-bold bg-acid text-acid-ink px-3 py-1 rounded-md">
                      {m.designation || m.role}
                    </span>
                  )}
                  {metaLine(m) && (
                    <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-ivory-2 border border-line px-3 py-1 rounded-md">
                      {metaLine(m)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 grid gap-4 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {m.bio && (
            <Section label="About" icon={<Sparkles className="w-4 h-4" />}>
              <p className="text-ivory-2 leading-relaxed whitespace-pre-line">{m.bio}</p>
            </Section>
          )}

          {skills.length > 0 && (
            <Section label="Skills" icon={<Briefcase className="w-4 h-4" />}>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="chip border border-line text-ivory-2 hover:border-acid hover:text-acid transition-colors">
                    {s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {projects.length > 0 && (
            <Section label="Projects" icon={<FaGithub className="w-4 h-4" />}>
              <StaggerGroup className="grid sm:grid-cols-2 gap-4">
                {projects.map((p, i) => (
                  <StaggerItem key={`${p.title}-${i}`}>
                    <div className="border border-line rounded-lg p-4 h-full flex flex-col bg-ink-3/40">
                      <h3 className="display text-base mb-1">{p.title}</h3>
                      {p.description && <p className="text-sm text-ivory-2 mb-3">{p.description}</p>}
                      {(p.github || p.demo) && (
                        <div className="flex gap-2 mt-auto pt-2">
                          {p.github && (
                            <a href={p.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 btn-brut !py-1.5 !px-3 text-xs">
                              <FaGithub className="w-3.5 h-3.5" /> Code
                            </a>
                          )}
                          {p.demo && (
                            <a href={p.demo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 btn-acid !py-1.5 !px-3 text-xs">
                              <ExternalLink className="w-3.5 h-3.5" /> Live
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </Section>
          )}

          {achievements.length > 0 && (
            <Section label="Achievements" icon={<Award className="w-4 h-4" />}>
              <div className="flex flex-col gap-3">
                {achievements.map((a, i) => (
                  <div key={a._id || `${a.title}-${i}`} className="border border-line rounded-lg p-4 bg-ink-3/40">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="display text-base">{a.title}</h3>
                      {a.category && (
                        <span className="chip border border-acid/50 text-acid !py-0.5 !px-2 !text-[10px]">{a.category}</span>
                      )}
                      {a.year && <span className="font-mono text-[10px] text-muted">{a.year}</span>}
                    </div>
                    {a.description && <p className="text-sm text-ivory-2">{a.description}</p>}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {a.teamMembers && a.teamMembers.length > 0 && (
                        <span className="font-mono text-[10px] text-muted">with {a.teamMembers.join(', ')}</span>
                      )}
                      {a.eventLink && (
                        <a href={a.eventLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[10px] text-acid hover:underline">
                          <ExternalLink className="w-3 h-3" /> Certificate / event
                        </a>
                      )}
                    </div>
                    {a.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.coverImage} alt={a.title} className="mt-3 w-full max-h-52 object-cover rounded-md border border-line" />
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────── */}
        <aside className="flex flex-col gap-4">
          {socials.length > 0 && (
            <Section label="Social / Contact" icon={<Globe className="w-4 h-4" />}>
              <div className="flex flex-col gap-2">
                {socials.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.key}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between gap-2 btn-brut !py-2 !px-4 text-xs"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon className="w-4 h-4" /> {s.label}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </a>
                  );
                })}
              </div>
            </Section>
          )}

          {(interests.length > 0 || languages.length > 0 || domains.length > 0 || extras.length > 0) && (
            <Section label="Additional Info" icon={<Calendar className="w-4 h-4" />}>
              <div className="flex flex-col gap-4">
                {interests.length > 0 && (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-acid mb-2">Interests</div>
                    <div className="flex flex-wrap gap-1.5">
                      {interests.map((x) => (
                        <span key={x} className="chip border border-line text-ivory-2 !py-0.5 !px-2 !text-[10px]">{x}</span>
                      ))}
                    </div>
                  </div>
                )}
                {languages.length > 0 && (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-acid mb-2">Languages</div>
                    <div className="flex flex-wrap gap-1.5">
                      {languages.map((x) => (
                        <span key={x} className="chip border border-line text-ivory-2 !py-0.5 !px-2 !text-[10px]">{x}</span>
                      ))}
                    </div>
                  </div>
                )}
                {domains.length > 0 && (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-acid mb-2">Preferred domains</div>
                    <div className="flex flex-wrap gap-1.5">
                      {domains.map((x) => (
                        <span key={x} className="chip border border-line text-ivory-2 !py-0.5 !px-2 !text-[10px]">{x}</span>
                      ))}
                    </div>
                  </div>
                )}
                {extras.length > 0 && (
                  <div className="flex flex-col gap-2 pt-1 border-t border-line">
                    {extras.map((e) => (
                      <div key={e.label} className="flex justify-between gap-3 text-sm pt-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{e.label}</span>
                        <span className="text-ivory-2 text-right">{e.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}
        </aside>
      </div>
    </div>
  );
}
