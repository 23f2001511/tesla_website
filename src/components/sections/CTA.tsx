'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="relative bg-ink py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative border border-line corner-marks bg-ink-2 px-6 py-16 sm:px-12 sm:py-20 text-center"
        >
          <div className="tag-mono-acid mb-6">// OPEN CALL</div>
          <h2 className="display text-4xl sm:text-6xl lg:text-7xl text-ivory leading-[0.92] mb-6">
            STOP WATCHING.
            <br />
            <span className="text-acid">START SHIPPING.</span>
          </h2>
          <p className="text-ivory-2 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-10">
            Membership is free and open to every year and branch. Pick a track,
            show up to one session, ship something small. That's the whole
            onboarding.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/contact" className="btn-acid">
              Become a member <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link href="/resources" className="btn-brut">
              Free resources
            </Link>
          </div>

          <div className="tag-mono mt-12 text-muted">
            NO APPLICATION ESSAYS <span className="mx-2 text-line-2">/</span> NO
            GPA REQUIREMENT <span className="mx-2 text-line-2">/</span> JUST
            BUILD
          </div>
        </motion.div>
      </div>
    </section>
  );
}
