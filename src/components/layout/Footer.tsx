'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Send } from 'lucide-react';
import { ClubLogo } from '@/components/logo/ClubLogo';

// Brand icons (inline SVG — lucide-react dropped brand glyphs)
function LinkedInIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

function InstagramIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z" />
    </svg>
  );
}

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 3000);
    }
  };

  const cols = [
    {
      heading: 'Navigate',
      links: [
        ['Home', '/', null],
        ['About', '/about', null],
        ['Events', '/events', null],
        ['Team', '/team', null],
        ['Blogs', '/blogs', null],
      ] as [string, string, React.ReactNode][],
    },
    {
      heading: 'Community',
      links: [
        ['Resources', '/resources', null],
        ['Alumni', '/alumni', null],
        ['Gallery', '/gallery', null],
        ['Login', '/login', null],
        ['Contact', '/contact', null],
      ] as [string, string, React.ReactNode][],
    },
    {
      heading: 'External',
      links: [
        ['LinkedIn', 'https://www.linkedin.com/company/tesla-club-nitp/', <LinkedInIcon key="li" />],
        ['Instagram', 'https://www.instagram.com/tesla_nitp/', <InstagramIcon key="ig" />],
        ['X / Twitter', 'https://x.com/T_E_S_L_Aclub', <XIcon key="x" />],
      ] as [string, string, React.ReactNode][],
    },
  ];

  return (
    <footer className="relative bg-ink border-t border-line text-ivory-2">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Mission */}
        <div className="md:col-span-4 space-y-4">
          <ClubLogo size={100} className="mb-3" />
          <div className="tag-mono-acid">{'// ABOUT TESLA'}</div>
          <p className="text-sm leading-relaxed text-ivory-2 max-w-sm">
            A premier Electrical Engineering club at NIT Patna. We foster technical
            excellence, innovation, and collaboration in Electrical Engineering and
            Blockchain Technology. Dept. of Electrical Engineering, NIT Patna.
          </p>
          <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
            EST. 2021 · NIT PATNA
          </div>
        </div>

        {/* Link columns */}
        {cols.map((col) => (
          <div key={col.heading} className="md:col-span-2">
            <div className="tag-mono-acid mb-4">{'// '}{col.heading.toUpperCase()}</div>
            <ul className="space-y-2 text-sm">
              {col.links.map(([name, href, Icon]) => {
                const external = href.startsWith('http');
                return (
                  <li key={name}>
                    <Link
                      href={href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-1 text-ivory-2 hover:text-acid transition-colors"
                    >
                      {Icon ? (
                        <span className="inline-flex items-center gap-1.5">
                          {Icon} {name}
                        </span>
                      ) : (
                        name
                      )}
                      {external && <ArrowUpRight className="w-3 h-3" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Newsletter */}
        <div className="md:col-span-2">
          <div className="tag-mono-acid mb-4">{'// NEWSLETTER'}</div>
          <p className="text-xs text-muted leading-relaxed mb-4">
            One email a month. Events, workshops, and opportunities. No spam.
          </p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-brut rounded-xl"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="btn-acid shrink-0 !p-3 rounded-xl"
            >
              {subscribed ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          {subscribed && (
            <div className="text-acid font-mono text-[11px] tracking-wider uppercase mt-2">
              Subscribed.
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-line">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
          <span>© {new Date().getFullYear()} TESLA TECHNICAL CLUB</span>
          <span>BUILT BY STUDENTS — FOR STUDENTS</span>
          <span className="text-acid font-bold">v4.0 / NOVA</span>
        </div>
      </div>
    </footer>
  );
}
