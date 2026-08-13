'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Download, Search } from 'lucide-react';

const resources = [
  { id: 1, title: 'Data Structures Notes', type: 'NOTES', subject: 'CS201', semester: 'Sem 3', downloads: 142 },
  { id: 2, title: 'Operating Systems PYQ 2025', type: 'PYQ', subject: 'CS301', semester: 'Sem 5', downloads: 89 },
  { id: 3, title: 'Database Management Lab Manual', type: 'LAB', subject: 'CS302', semester: 'Sem 5', downloads: 256 },
  { id: 4, title: 'Machine Learning Basics', type: 'SLIDES', subject: 'CS401', semester: 'Sem 7', downloads: 67 },
];

export default function ResourcesPage() {
  const [semester, setSemester] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = resources.filter(
    (r) =>
      (semester === 'All' || r.semester === semester) &&
      r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-ink min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 mb-10 border-b border-line">
          <div>
            <div className="tag-mono-acid mb-3">// VAULT</div>
            <h1 className="display text-5xl sm:text-7xl text-ivory">RESOURCES</h1>
            <p className="text-ivory-2 mt-4 max-w-md text-sm leading-relaxed">
              Notes, PYQs and lab manuals — curated by seniors, maintained by
              the club. Free for everyone.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="SEARCH FILES..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border border-line focus:border-acid px-4 py-3 pl-10 font-mono text-xs tracking-wider text-ivory placeholder:text-muted focus:outline-none transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-10">
          <span className="tag-mono mr-2">SEM —</span>
          {['All', 'Sem 1', 'Sem 3', 'Sem 5', 'Sem 7'].map((sem) => (
            <button
              key={sem}
              onClick={() => setSemester(sem)}
              className={`px-4 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase border transition-colors ${
                semester === sem
                  ? 'border-acid text-acid'
                  : 'border-line text-muted hover:text-ivory hover:border-line-2'
              }`}
            >
              {sem}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="border border-line overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="border-b border-line bg-ink-2">
                <th className="tag-mono px-5 py-4 font-normal">FILE</th>
                <th className="tag-mono px-5 py-4 font-normal">TYPE</th>
                <th className="tag-mono px-5 py-4 font-normal">SUBJECT / SEM</th>
                <th className="tag-mono px-5 py-4 font-normal text-right">DL</th>
                <th className="tag-mono px-5 py-4 font-normal text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-line last:border-b-0 hover:bg-ink-2 transition-colors group"
                >
                  <td className="px-5 py-4">
                    <span className="text-sm text-ivory font-medium group-hover:text-acid transition-colors">
                      {r.title}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-[10px] tracking-wider text-ivory-2 border border-line px-2 py-0.5">
                      {r.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-muted">
                    {r.subject} / {r.semester.toUpperCase()}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-muted text-right">
                    {r.downloads}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="inline-flex items-center gap-2 px-3 py-1.5 border border-line font-mono text-[10px] tracking-wider uppercase text-ivory-2 hover:border-acid hover:text-acid transition-colors">
                      <Download className="w-3 h-3" /> Get
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center tag-mono">NO FILES MATCH</div>
          )}
        </div>
      </div>
    </div>
  );
}
