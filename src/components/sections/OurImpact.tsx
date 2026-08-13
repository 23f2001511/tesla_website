'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const impacts = [
  { id: 'A', value: '60+', label: 'TIER-1 PLACEMENTS', desc: 'Google, Microsoft, Amazon, top startups' },
  { id: 'B', value: '120+', label: 'PAID INTERNSHIPS', desc: 'Pre-final & final year students' },
  { id: 'C', value: '30+', label: 'HACKATHONS WON', desc: 'National & inter-college competitions' },
  { id: 'D', value: '20+', label: 'PAPERS PUBLISHED', desc: 'AI, IoT & systems research — IEEE' },
];

export function OurImpact() {
  return (
    <section className="relative bg-ink border-b border-line py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="tag-mono-acid mb-3">// RECEIPTS</div>
            <h2 className="display text-4xl sm:text-5xl lg:text-6xl text-ivory mb-6">
              OUTPUT OVER HYPE.
            </h2>
            <p className="text-ivory-2 text-sm sm:text-base leading-relaxed max-w-md mb-8">
              We bridge classroom theory and industry engineering through
              project building, peer mentorship, and a strong competitive
              culture. The numbers below are cumulative since 2020.
            </p>

            {/* Quote */}
            <div className="border border-line p-6 mb-8 relative">
              <span className="absolute -top-px -left-px w-3 h-3 border-t border-l border-acid" />
              <span className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-acid" />
              <div className="tag-mono-acid mb-3">ALUMNI // BATCH OF '25</div>
              <p className="text-sm text-ivory leading-relaxed italic mb-3">
                "Joining TESLA gave me the mentorship and hands-on project
                experience I needed to crack my SWE internship at Google."
              </p>
              <div className="tag-mono">— CORE TEAM LEAD, 2025</div>
            </div>

            <Link href="/about" className="btn-brut self-start">
              Our story <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line">
            {impacts.map((imp, i) => (
              <motion.div
                key={imp.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-ink hover:bg-ink-2 transition-colors p-6 sm:p-8 flex flex-col justify-between min-h-[220px] group"
              >
                <div className="flex items-start justify-between">
                  <span className="tag-mono text-muted group-hover:text-acid transition-colors">
                    [{imp.id}]
                  </span>
                  <span className="w-2 h-2 bg-line-2 group-hover:bg-acid transition-colors" />
                </div>
                <div>
                  <div className="display text-5xl sm:text-6xl text-ivory mb-2">
                    {imp.value}
                  </div>
                  <div className="tag-mono-acid mb-1">{imp.label}</div>
                  <div className="text-xs text-muted">{imp.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
