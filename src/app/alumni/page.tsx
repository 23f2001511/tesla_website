'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const fallbackAlumni = [
  { id: '1', name: 'Nikhil Patel', role: 'SOFTWARE ENGINEER', company: 'GOOGLE', batch: '2020', city: 'BENGALURU' },
  { id: '2', name: 'Kritika Joshi', role: 'DATA SCIENTIST', company: 'MICROSOFT', batch: '2021', city: 'HYDERABAD' },
  { id: '3', name: 'Rishabh Jain', role: 'PRODUCT MANAGER', company: 'AMAZON', batch: '2020', city: 'SEATTLE' },
  { id: '4', name: 'Sneha Reddy', role: 'SDE II', company: 'ADOBE', batch: '2022', city: 'NOIDA' },
];

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<any[]>(fallbackAlumni);

  useEffect(() => {
    fetch('/api/alumni')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.alumni && data.alumni.length > 0) {
          setAlumni(data.alumni);
        }
      })
      .catch((err) => console.warn('Using fallback alumni:', err));
  }, []);

  return (
    <div className="bg-ink min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 mb-10 border-b border-line">
          <div>
            <div className="tag-mono-acid mb-3">// NETWORK</div>
            <h1 className="display text-5xl sm:text-7xl text-ivory">ALUMNI</h1>
            <p className="text-ivory-2 mt-4 max-w-md text-sm leading-relaxed">
              Former members now at companies you'd recognize. They review
              resumes, mock interviews, and occasionally hire.
            </p>
          </div>
          <Link href="/contact" className="btn-acid self-start md:self-auto">
            Join network <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
          {alumni.map((a, i) => (
            <motion.div
              key={a._id || a.id || i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group bg-ink hover:bg-ink-2 transition-colors p-6 flex flex-col min-h-[280px]"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="font-mono text-[10px] text-muted">
                  '{a.batch.slice(-2)} BATCH
                </span>
                <span className="w-2 h-2 bg-line-2 group-hover:bg-acid transition-colors" />
              </div>

              <div className="w-16 h-16 border border-line-2 flex items-center justify-center mb-6 group-hover:border-acid transition-colors">
                <span className="display text-2xl text-ivory">
                  {a.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .slice(0, 2)}
                </span>
              </div>

              <h3 className="display text-xl text-ivory leading-tight">{a.name}</h3>
              <div className="font-mono text-[11px] tracking-wider text-acid mt-2">
                {a.role}
              </div>
              <div className="tag-mono mt-1">@{a.company}</div>
              {a.city && <div className="tag-mono text-[9px] text-muted mt-0.5">{a.city}</div>}

              <div className="flex gap-2 mt-auto pt-6">
                {a.linkedin ? (
                  <a
                    href={a.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 border border-line font-mono text-[10px] tracking-wider uppercase text-ivory-2 hover:border-acid hover:text-acid text-center transition-colors"
                  >
                    Connect
                  </a>
                ) : (
                  <button className="flex-1 py-2 border border-line font-mono text-[10px] tracking-wider uppercase text-ivory-2 hover:border-acid hover:text-acid transition-colors">
                    Connect
                  </button>
                )}
                <Link
                  href="/contact"
                  className="flex-1 py-2 bg-acid text-acid-ink font-mono text-[10px] tracking-wider uppercase font-bold hover:bg-ivory text-center transition-colors"
                >
                  Mentor
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
