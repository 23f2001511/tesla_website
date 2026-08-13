'use client';

import { motion } from 'framer-motion';

const pillars = [
  {
    id: 'P/01',
    title: 'SHIP > SLIDES',
    desc: 'Everything we teach ends in a working artifact — a repo, a robot, a writeup. No tutorial hell.',
  },
  {
    id: 'P/02',
    title: 'PEER-LED',
    desc: 'Seniors teach juniors. Alumni mentor seniors. Knowledge flows down, pull requests flow up.',
  },
  {
    id: 'P/03',
    title: 'OPEN BY DEFAULT',
    desc: 'Every workshop is recorded, every note is published, every project is open source.',
  },
];

const timeline = [
  {
    year: '2020',
    tag: 'ORIGIN',
    desc: 'Six students, one Discord server, zero budget. First weekend hack night.',
  },
  {
    year: '2021',
    tag: 'GROWTH',
    desc: 'First national hackathon win. Membership crosses 150. Web division formed.',
  },
  {
    year: '2023',
    tag: 'EXPANSION',
    desc: 'Robotics lab allocated. Research wing publishes first IEEE paper. HACK-TESLA born.',
  },
  {
    year: '2026',
    tag: 'TODAY',
    desc: '500+ members, six tracks, 60+ tier-1 placements. Still student-run. Still free.',
  },
];

const reasons = [
  'Project teams with real deadlines',
  '1:1 mentorship from alumni in industry',
  'Priority seats at every hackathon',
  'Interview & CP prep with seniors',
  'Hardware lab & cloud credits',
  'A network that outlasts college',
];

export default function AboutPage() {
  return (
    <div className="bg-ink">
      {/* Header */}
      <section className="border-b border-line">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14 sm:pt-24 sm:pb-20">
          <div className="tag-mono-acid mb-4">// ABOUT US</div>
          <h1 className="display text-5xl sm:text-7xl lg:text-8xl text-ivory">
            BUILT BY
            <br />
            STUDENTS<span className="text-acid">.</span>
          </h1>
          <p className="mt-8 max-w-xl text-ivory-2 leading-relaxed">
            Founded in 2020 to close the gap between what college teaches and
            what industry expects. What started as six students and a Discord
            server is now the largest technical community on campus — and still
            completely student-run.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-b border-line">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="tag-mono-acid mb-10">// OPERATING PRINCIPLES</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line border border-line">
            {pillars.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-ink p-8 min-h-[220px] flex flex-col"
              >
                <span className="tag-mono text-acid mb-4">[{p.id}]</span>
                <h3 className="display text-2xl text-ivory mb-3">{p.title}</h3>
                <p className="text-sm text-muted leading-relaxed mt-auto">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-b border-line">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="tag-mono-acid mb-10">// TIMELINE</div>
          <div className="border border-line">
            {timeline.map((t, i) => (
              <motion.div
                key={t.year}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="grid grid-cols-1 sm:grid-cols-12 border-b border-line last:border-b-0 hover:bg-ink-2 transition-colors"
              >
                <div className="sm:col-span-2 border-b sm:border-b-0 sm:border-r border-line px-6 py-6">
                  <div className="display text-3xl text-ivory">{t.year}</div>
                </div>
                <div className="sm:col-span-2 border-b sm:border-b-0 sm:border-r border-line px-6 py-6 flex items-center">
                  <span className="tag-mono-acid">{t.tag}</span>
                </div>
                <div className="sm:col-span-8 px-6 py-6 text-sm text-ivory-2 leading-relaxed flex items-center">
                  {t.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why join */}
      <section>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <div className="tag-mono-acid mb-3">// MEMBERSHIP</div>
              <h2 className="display text-4xl sm:text-5xl text-ivory">
                WHY JOIN?
              </h2>
              <p className="text-sm text-muted leading-relaxed mt-4 max-w-sm">
                Free forever. Open to every branch and year. All we ask is that
                you show up and build.
              </p>
            </div>
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line">
              {reasons.map((r, i) => (
                <div key={i} className="bg-ink px-5 py-4 flex items-center gap-4">
                  <span className="font-mono text-xs text-acid">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm text-ivory-2">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
