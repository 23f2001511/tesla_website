'use client';

import { useMemo, useState } from 'react';
import { Download, FileText, Search } from 'lucide-react';
import { useApi } from '@/lib/api';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ScrollReveal, StaggerGroup, StaggerItem } from '@/components/ui/ScrollReveal';

const PAGE_SIZE = 5;
const SEMESTERS = ['All', '1', '2', '3', '4', '5', '6', '7', '8'];
const TYPES = ['All', 'Note', 'PYQ'] as const;

const pill = (active: boolean) =>
  `px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.12em] border transition-colors ${
    active ? 'bg-acid text-acid-ink border-acid font-bold' : 'border-line text-ivory-2 hover:border-acid hover:text-acid'
  }`;

interface ResourceFileItem {
  _id: string;
  title: string;
  fileUrl: string;
  type: 'Note' | 'PYQ';
  views?: number;
  downloads?: number;
}

interface SubjectItem {
  _id: string;
  subjectName: string;
  subjectCode?: string;
  department: string;
  semester: number;
  files: ResourceFileItem[];
}

export default function ResourcesPage() {
  // Server-side filters (refetch via SWR)
  const [department, setDepartment] = useState('All');
  const [semester, setSemester] = useState('All');
  // Client-side filters (instant)
  const [type, setType] = useState<(typeof TYPES)[number]>('All');
  const [subjectQuery, setSubjectQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const query = new URLSearchParams();
  if (department !== 'All') query.set('department', department);
  if (semester !== 'All') query.set('semester', semester);

  const { data, error, isLoading, mutate } = useApi<{
    resources: SubjectItem[];
    departments: string[];
  }>(`/api/resources?${query.toString()}`);

  const departments = data?.departments || [];
  const allSubjects = data?.resources || [];

  // Apply type + subject-search filters client-side, per file.
  const filtered = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    return allSubjects
      .map((r) => {
        if (q && !`${r.subjectName} ${r.subjectCode || ''}`.toLowerCase().includes(q)) {
          return null;
        }
        const files =
          type === 'All' ? r.files || [] : (r.files || []).filter((f) => f.type === type);
        return { ...r, files };
      })
      .filter((r): r is SubjectItem => Boolean(r && r.files.length > 0));
  }, [allSubjects, type, subjectQuery]);

  const shown = filtered.slice(0, visible);
  const totalFiles = useMemo(
    () => filtered.reduce((n: number, r) => n + r.files.length, 0),
    [filtered]
  );

  // Reset paging whenever any filter changes. Derived during render (the
  // "storing information from previous renders" pattern) so no effect runs.
  const filterKey = `${department}|${semester}|${type}|${subjectQuery}`;
  const [pagingKey, setPagingKey] = useState(filterKey);
  if (pagingKey !== filterKey) {
    setPagingKey(filterKey);
    setVisible(PAGE_SIZE);
  }

  const hasFilters =
    department !== 'All' || semester !== 'All' || type !== 'All' || subjectQuery.trim() !== '';

  return (
    <div className="bg-ink min-h-screen">
      <section className="border-b border-line bg-terminal">
        <ScrollReveal className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="tag-mono-acid mb-3">{'// RESOURCE VAULT'}</div>
          <h1 className="display text-4xl sm:text-5xl">Notes &amp; PYQs</h1>
          <p className="text-ivory-2 mt-3 max-w-2xl text-sm sm:text-base">
            {totalFiles > 0
              ? `${totalFiles} file${totalFiles === 1 ? '' : 's'} across ${filtered.length} subject${filtered.length === 1 ? '' : 's'} — live from the vault.`
              : 'Filter by department, semester, subject and type to find what you need.'}
          </p>
        </ScrollReveal>
      </section>

      <section className="pb-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Filter panel ─────────────────────────────────────────────── */}
          <div className="card-brut rounded-xl p-5 sm:p-6 my-8 space-y-4">
            {/* Department */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted mb-2">
                Department
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setDepartment('All')} className={pill(department === 'All')}>
                  All
                </button>
                {departments.map((d) => (
                  <button key={d} onClick={() => setDepartment(d)} className={pill(department === d)}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Semester + type on one row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted mb-2">
                  Semester
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SEMESTERS.map((s) => (
                    <button key={s} onClick={() => setSemester(s)} className={pill(semester === s)}>
                      {s === 'All' ? 'All' : `Sem ${s}`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted mb-2">
                  Material type
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TYPES.map((t) => (
                    <button key={t} onClick={() => setType(t)} className={pill(type === t)}>
                      {t === 'All' ? 'All' : t === 'PYQ' ? 'PYQs' : 'Notes'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Subject search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                value={subjectQuery}
                onChange={(e) => setSubjectQuery(e.target.value)}
                placeholder="Search subject name or code (e.g. CS201)..."
                className="input-brut rounded-md !pl-9 w-full"
              />
            </div>

            {hasFilters && (
              <button
                onClick={() => {
                  setDepartment('All');
                  setSemester('All');
                  setType('All');
                  setSubjectQuery('');
                }}
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-acid hover:text-ivory transition-colors"
              >
                ✕ Clear all filters
              </button>
            )}
          </div>

          {/* ── Results ──────────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card-brut rounded-xl p-6 animate-pulse">
                  <div className="h-5 w-1/3 bg-ink-3 rounded mb-3" />
                  <div className="h-3 w-2/3 bg-ink-3 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <ErrorState message={(error as Error).message} onRetry={() => mutate()} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={hasFilters ? 'Nothing matches these filters' : 'No resources yet'}
              hint={
                hasFilters
                  ? 'Try widening the department, semester or type.'
                  : 'Notes and PYQs uploaded by members will appear here.'
              }
            />
          ) : (
            <>
              <StaggerGroup className="space-y-4">
                {shown.map((r) => (
                  <StaggerItem key={r._id}>
                  <div className="card-brut rounded-xl p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                      <div>
                        <h3 className="display text-xl">{r.subjectName}</h3>
                        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted mt-1">
                          {r.subjectCode || '—'} · sem {r.semester} · {r.department}
                        </p>
                      </div>
                      <span className="chip border border-line text-muted !py-0.5 !px-2 !text-[10px]">
                        {r.files.length} file{r.files.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {r.files.map((f) => (
                        <div
                          key={f._id}
                          className="flex items-center justify-between gap-3 border border-line rounded-md px-3.5 py-2.5 hover:border-acid transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 text-acid shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm text-ivory truncate">{f.title}</p>
                              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                                <span className={f.type === 'PYQ' ? 'text-acid' : ''}>{f.type}</span>
                                {' · '}
                                {f.views || 0} views · {f.downloads || 0} downloads
                              </p>
                            </div>
                          </div>
                          <a
                            href={f.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-acid hover:text-ivory transition-colors"
                            aria-label={`Open ${f.title}`}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
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