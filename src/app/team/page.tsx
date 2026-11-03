'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { KeyboardEvent, MouseEvent } from 'react';
import { Search } from 'lucide-react';
import { useApi } from '@/lib/api';
import { Avatar, EmptyState, ErrorState, SkeletonGrid } from '@/components/ui/States';
import { ScrollReveal, StaggerGroup, StaggerItem } from '@/components/ui/ScrollReveal';

const ROLE_TABS = ['all', 'Admin', 'PI', 'President', 'OfficeBearer', 'TeamLeader', 'TeamMember'] as const;
const PAGE_SIZE = 8;

type Member = {
  id: string;
  name: string;
  role?: string;
  designation?: string;
  team?: string;
  batch?: number;
  year?: string;
  bio?: string;
  profileImage?: string;
  portfolio?: string;
  skills?: string[];
  socialLinks?: { linkedin?: string; github?: string; instagram?: string; twitter?: string };
};

export default function TeamPage() {
  const [role, setRole] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const router = useRouter();

  // Whole card navigates to the detail page. Nested <a> social buttons stop
  // propagation so they keep working independently, and keyboard users get
  // Enter/Space via the role="link" + tabIndex pattern (an <a> can't wrap the
  // card because those social links are block-level children of it).
  const openMember = (id: string) => router.push(`/team/${id}`);
  const onCardKey = (e: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMember(id);
    }
  };
  const stopNav = (e: MouseEvent<HTMLElement>) => e.stopPropagation();

  const { data, error, isLoading, mutate } = useApi<{ members: Member[] }>('/api/team');

  const members = useMemo(() => data?.members || [], [data]);
  const filtered = useMemo(
    () =>
      members.filter((m) => {
        if (role !== 'all' && m.role !== role) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          m.name?.toLowerCase().includes(q) ||
          m.designation?.toLowerCase().includes(q) ||
          m.team?.toLowerCase().includes(q)
        );
      }),
    [members, role, search]
  );
  const shown = filtered.slice(0, visible);

  return (
    <div className="bg-ink min-h-screen">
      <section className="border-b border-line bg-terminal">
        <ScrollReveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="tag-mono-acid mb-3">{'// THE TEAM'}</div>
          <h1 className="display text-4xl sm:text-5xl">People behind TESLA</h1>
          <p className="text-ivory-2 mt-3 max-w-2xl text-sm sm:text-base">
            The students and faculty driving every project, event and win. Live from the club database.
          </p>
        </ScrollReveal>
      </section>

      <section className="pb-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center py-6 border-b border-line mb-8">
            <div className="flex flex-wrap gap-1.5 flex-1">
              {ROLE_TABS.map((r) => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setVisible(PAGE_SIZE); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.12em] border transition-colors ${
                    role === r
                      ? 'bg-acid text-acid-ink border-acid font-bold'
                      : 'border-line text-ivory-2 hover:border-acid hover:text-acid'
                  }`}
                >
                  {r === 'all' ? 'All' : r}
                </button>
              ))}
            </div>
            <div className="relative sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
                placeholder="Search name, team, skill..."
                className="input-brut rounded-md !pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <SkeletonGrid count={8} />
          ) : error ? (
            <ErrorState
              title="Unable to load team data"
              message="Please check your connection and try again."
              onRetry={() => mutate()}
            />
          ) : filtered.length === 0 ? (
            <EmptyState title="No members found" hint="Try a different filter or search term." />
          ) : (
            <>
              <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shown.map((member) => (
                  <StaggerItem key={member.id} className="h-full">
                  <div
                    role="link"
                    tabIndex={0}
                    aria-label={`View profile of ${member.name}`}
                    onClick={() => openMember(member.id)}
                    onKeyDown={(e) => onCardKey(e, member.id)}
                    className="card-brut rounded-xl p-6 flex flex-col items-center text-center h-full hover:-translate-y-0.5 transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-acid focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                  >
                    <Avatar src={member.profileImage} name={member.name} />
                    <h3 className="display text-lg mt-4">{member.name}</h3>
                    <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-acid mt-1">
                      {member.designation || member.role}
                    </p>
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-1">
                      {[member.team, member.batch ? `Batch ${member.batch}` : member.year]
                        .filter(Boolean)
                        .join(' · ') || '\u00A0'}
                    </p>
                    {member.bio && <p className="text-xs text-ivory-2 mt-3 line-clamp-3">{member.bio}</p>}

                    {member.skills && member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                        {member.skills.slice(0, 3).map((s: string) => (
                          <span key={s} className="chip border border-line text-muted !py-0.5 !px-2 !text-[10px]">
                            {s}
                          </span>
                        ))}
                        {member.skills.length > 3 && (
                          <span className="chip border border-acid/50 text-acid !py-0.5 !px-2 !text-[10px]">
                            +{member.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {(member.socialLinks?.linkedin || member.socialLinks?.github || member.portfolio) && (
                      <div className="flex gap-2 mt-auto pt-5">
                        {member.socialLinks?.linkedin && (
                          <a href={member.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" onClick={stopNav} className="w-8 h-8 rounded-md border border-line flex items-center justify-center hover:border-acid hover:text-acid text-ivory-2 transition-colors text-xs font-mono">in</a>
                        )}
                        {member.socialLinks?.github && (
                          <a href={member.socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" onClick={stopNav} className="w-8 h-8 rounded-md border border-line flex items-center justify-center hover:border-acid hover:text-acid text-ivory-2 transition-colors text-xs font-mono">{'</>'}</a>
                        )}
                        {member.portfolio && (
                          <a href={member.portfolio} target="_blank" rel="noopener noreferrer" aria-label="Portfolio" onClick={stopNav} className="w-8 h-8 rounded-md border border-line flex items-center justify-center hover:border-acid hover:text-acid text-ivory-2 transition-colors text-xs font-mono">@</a>
                        )}
                      </div>
                    )}
                  </div>
                  </StaggerItem>
                ))}
              </StaggerGroup>

              {filtered.length > visible && (
                <div className="text-center mt-10">
                  <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn-brut">
                    Load more ({filtered.length - visible} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}