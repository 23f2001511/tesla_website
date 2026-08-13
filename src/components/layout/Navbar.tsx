'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: 'About', href: '/about' },
    { name: 'Events', href: '/events' },
    { name: 'Team', href: '/team' },
    { name: 'Blogs', href: '/blogs' },
    { name: 'Resources', href: '/resources' },
    { name: 'Alumni', href: '/alumni' },
    { name: 'Gallery', href: '/gallery' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-ink border-b border-line">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-stretch justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group border-r border-line pr-4 sm:pr-6"
          >
            <span className="w-8 h-8 bg-acid text-acid-ink font-bold text-sm flex items-center justify-center tracking-tighter">
              T
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-bold tracking-tight text-ivory text-base">
                TESLA
              </span>
              <span className="tag-mono text-[9px]">Technical Club</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-stretch flex-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center px-4 border-l border-line first:border-l-0 tag-mono transition-colors ${
                    active
                      ? 'text-acid'
                      : 'text-ivory-2 hover:text-ivory hover:bg-ink-2'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center">
            <Link
              href="/login"
              className="tag-mono px-4 py-2 text-ivory-2 hover:text-ivory transition-colors border-l border-line"
            >
              Login
            </Link>
            <Link
              href="/contact"
              className="ml-0 flex items-center gap-1.5 px-5 h-16 bg-acid text-acid-ink font-mono text-[11px] tracking-[0.14em] uppercase font-bold hover:bg-ivory transition-colors"
            >
              Join <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden flex items-center px-3 text-ivory"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-line bg-ink">
          <nav className="flex flex-col">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-6 py-4 border-b border-line font-mono text-xs tracking-[0.14em] uppercase ${
                    active ? 'text-acid' : 'text-ivory-2'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="flex gap-0">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-6 py-4 text-center font-mono text-xs tracking-[0.14em] uppercase text-ivory-2 border-r border-line"
              >
                Login
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-6 py-4 text-center font-mono text-xs tracking-[0.14em] uppercase bg-acid text-acid-ink font-bold"
              >
                Join
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
