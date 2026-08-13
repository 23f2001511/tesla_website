'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const domains = [
  {
    id: '01',
    title: 'Web & Mobile',
    desc: 'Fullstack architecture, modern JS frameworks, responsive UI, and cloud APIs. Ship apps people actually use.',
    tags: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Postgres'],
  },
  {
    id: '02',
    title: 'AI & Data Science',
    desc: 'ML, deep learning, NLP, computer vision, and generative AI. Labs, paper readings, model training.',
    tags: ['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'OpenCV'],
  },
  {
    id: '03',
    title: 'Competitive Prog.',
    desc: 'Algorithms, data structures, graph theory. Weekly contests, mock interviews, ICPC and Codeforces prep.',
    tags: ['C++', 'DSA', 'Algorithms', 'Graphs'],
  },
  {
    id: '04',
    title: 'Robotics & IoT',
    desc: 'Embedded systems, microcontrollers, sensors, and PCBs. Build bots that move and devices that talk.',
    tags: ['Arduino', 'RPi', 'C/C++', 'PCB Design'],
  },
  {
    id: '05',
    title: 'Security & Cloud',
    desc: 'Network defense, ethical hacking, CTFs, and cloud infrastructure. Deploy, harden, and audit.',
    tags: ['Linux', 'Docker', 'AWS', 'CTF'],
  },
  {
    id: '06',
    title: 'Design & UX',
    desc: 'Turn requirements into elegant, accessible interfaces. Design systems, wireframes, prototypes, reviews.',
    tags: ['Figma', 'Wireframes', 'Design Systems'],
  },
];

export function Features() {
  return (
    <section className="relative bg-ink border-b border-line py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 mb-10 border-b border-line">
          <div>
            <div className="tag-mono-acid mb-3">// TRACKS</div>
            <h2 className="display text-4xl sm:text-5xl lg:text-6xl text-ivory">
              SIX TRACKS.
              <br />
              ONE CREW.
            </h2>
          </div>
          <p className="tag-mono max-w-xs sm:text-right">
            PICK A LANE. SWITCH ANY TIME. PROJECTS CROSS POLLINATE.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line">
          {domains.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="group bg-ink hover:bg-ink-2 transition-colors p-6 sm:p-8 flex flex-col justify-between min-h-[280px] relative"
            >
              <div>
                <div className="flex items-start justify-between mb-6">
                  <span className="tag-mono text-acid">[{d.id}]</span>
                  <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-acid group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h3 className="display text-2xl text-ivory mb-3 group-hover:text-acid transition-colors">
                  {d.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {d.desc}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-line">
                {d.tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[10px] tracking-wider uppercase text-ivory-2 border border-line px-2 py-0.5"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
