'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [settings, setSettings] = useState<any>({
    location: 'DEPT. OF CSE, CAMPUS BLOCK A',
    githubUrl: 'https://github.com',
    linkedinUrl: 'https://linkedin.com',
    instagramUrl: 'https://instagram.com',
    twitterUrl: 'https://twitter.com',
  });

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.warn('Footer settings notice:', err));
  }, []);

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
        ['Home', '/'],
        ['About', '/about'],
        ['Events', '/events'],
        ['Team', '/team'],
        ['Blogs', '/blogs'],
      ],
    },
    {
      heading: 'Community',
      links: [
        ['Resources', '/resources'],
        ['Alumni', '/alumni'],
        ['Gallery', '/gallery'],
        ['Admin Control', '/admin'],
        ['Contact', '/contact'],
      ],
    },
    {
      heading: 'External',
      links: [
        ['GitHub', settings.githubUrl || 'https://github.com'],
        ['LinkedIn', settings.linkedinUrl || 'https://linkedin.com'],
        ['Instagram', settings.instagramUrl || 'https://instagram.com'],
        ['X / Twitter', settings.twitterUrl || 'https://twitter.com'],
      ],
    },
  ];

  return (
    <footer className="relative bg-ink border-t border-line text-ivory-2">
      {/* Giant wordmark strip */}
      <div className="border-b border-line overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-end justify-between gap-6">
          <h2 className="display text-[16vw] sm:text-[11vw] leading-[0.82] text-ivory select-none">
            TESLA<span className="text-acid">.</span>
          </h2>
          <div className="tag-mono hidden sm:block text-right">
            <div>EST. 2020</div>
            <div>CAMPUS / INDIA</div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Mission */}
        <div className="md:col-span-4 space-y-4">
          <div className="tag-mono-acid">// ABOUT TESLA</div>
          <p className="text-sm leading-relaxed text-ivory-2 max-w-sm">
            A student-run technical club. We learn by shipping — software,
            hardware, research — and we teach by sharing. No gatekeeping, no
            fluff.
          </p>
          <div className="tag-mono">{settings.location || 'DEPT. OF CSE, CAMPUS BLOCK A'}</div>
        </div>

        {/* Link columns */}
        {cols.map((col) => (
          <div key={col.heading} className="md:col-span-2">
            <div className="tag-mono-acid mb-4">// {col.heading.toUpperCase()}</div>
            <ul className="space-y-2 text-sm">
              {col.links.map(([name, href]) => {
                const external = href.startsWith('http');
                return (
                  <li key={name}>
                    <Link
                      href={href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-1 text-ivory-2 hover:text-acid transition-colors"
                    >
                      {name}
                      {external && <ArrowUpRight className="w-3 h-3" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Newsletter */}
        <div className="md:col-span-2 lg:col-span-2">
          <div className="tag-mono-acid mb-4">// NEWSLETTER</div>
          <p className="text-xs text-muted leading-relaxed mb-4">
            One email a month. Events, workshops, and opportunities. No spam.
          </p>
          <form onSubmit={handleSubscribe} className="flex border border-line focus-within:border-acid transition-colors">
            <input
              type="email"
              required
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent px-3 py-2.5 text-xs text-ivory placeholder:text-muted focus:outline-none font-mono"
            />
            <button
              type="submit"
              className="px-3 bg-acid text-acid-ink font-mono text-[11px] uppercase font-bold hover:bg-ivory transition-colors"
            >
              {subscribed ? <Check className="w-4 h-4" /> : '→'}
            </button>
          </form>
          {subscribed && (
            <div className="tag-mono-acid mt-2">Subscribed.</div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-line">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 tag-mono">
          <span>© {new Date().getFullYear()} TESLA TECHNICAL CLUB</span>
          <span>BUILT BY STUDENTS — FOR STUDENTS</span>
          <span className="text-acid">v3.0 / FULL-STACK</span>
        </div>
      </div>
    </footer>
  );
}
