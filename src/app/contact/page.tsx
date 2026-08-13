'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

const channels = [
  { k: 'EMAIL', v: 'teslaclub@college.edu', href: 'mailto:teslaclub@college.edu' },
  { k: 'LOCATION', v: 'CSE Block, Campus', href: '#' },
  { k: 'DISCORD', v: 'discord.gg/tesla', href: '#' },
  { k: 'HOURS', v: 'Lab open 16:00–21:00', href: '#' },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="bg-ink min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24">
        {/* Header */}
        <div className="pb-10 mb-12 border-b border-line">
          <div className="tag-mono-acid mb-3">// CONTACT</div>
          <h1 className="display text-5xl sm:text-7xl text-ivory">
            SAY HELLO<span className="text-acid">.</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: direct channels */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5"
          >
            <div className="tag-mono mb-6">DIRECT CHANNELS —</div>
            <div className="border border-line">
              {channels.map((c, i) => (
                <a
                  key={c.k}
                  href={c.href}
                  className={`flex items-center justify-between px-5 py-5 group hover:bg-ink-2 transition-colors ${
                    i !== 0 ? 'border-t border-line' : ''
                  }`}
                >
                  <div>
                    <div className="tag-mono mb-1">{c.k}</div>
                    <div className="font-mono text-sm text-ivory group-hover:text-acid transition-colors">
                      {c.v}
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-acid group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              ))}
            </div>

            <div className="border border-line border-t-0 p-5">
              <div className="tag-mono-acid mb-2">// WANT TO JOIN?</div>
              <p className="text-sm text-muted leading-relaxed">
                Show up to any open session — no forms. Or send a message here
                and a core member will reply within 48 hours.
              </p>
            </div>
          </motion.div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <form
              className="border border-line corner-marks p-6 sm:p-10 flex flex-col gap-6"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div className="tag-mono-acid">// NEW MESSAGE</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="tag-mono block mb-2">NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    className="w-full bg-transparent border border-line focus:border-acid px-4 py-3 text-sm text-ivory placeholder:text-muted focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="tag-mono block mb-2">EMAIL</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@college.edu"
                    className="w-full bg-transparent border border-line focus:border-acid px-4 py-3 text-sm text-ivory placeholder:text-muted focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="tag-mono block mb-2">SUBJECT</label>
                <select
                  className="w-full bg-ink border border-line focus:border-acid px-4 py-3 text-sm text-ivory focus:outline-none transition-colors appearance-none"
                >
                  <option>General inquiry</option>
                  <option>Membership</option>
                  <option>Sponsorship</option>
                  <option>Speaking / collab</option>
                </select>
              </div>

              <div>
                <label className="tag-mono block mb-2">MESSAGE</label>
                <textarea
                  rows={5}
                  required
                  placeholder="What's on your mind?"
                  className="w-full bg-transparent border border-line focus:border-acid px-4 py-3 text-sm text-ivory placeholder:text-muted focus:outline-none transition-colors resize-none"
                />
              </div>

              <button type="submit" className="btn-acid self-start">
                {sent ? 'Message sent — we\'ll reply soon' : 'Send message'}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
