'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { ClubLogo } from '@/components/logo/ClubLogo';
import { PremiumLogoLink } from '@/components/logo/PremiumLogoLink';

interface CurrentUser {
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/user/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  // Close the dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    setIsOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout notice:', err);
    }
    setUser(null);
    router.push('/');
  };

  const navLinks = [
    { name: 'About', href: '/about' },
    { name: 'Events', href: '/events' },
    { name: 'Team', href: '/team' },
    { name: 'Blogs', href: '/blogs' },
    { name: 'Resources', href: '/resources' },
    { name: 'Alumni', href: '/alumni' },
    { name: 'Gallery', href: '/gallery' },
  ];

  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <header className="fixed top-0 w-full z-50 bg-transparent">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo — original club mark with premium charge-up click */}
          <PremiumLogoLink href="/" className="shrink-0" ariaLabel="TESLA — home">
            <ClubLogo size={56} />
          </PremiumLogoLink>

          {/* Center nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-acid bg-acid/10'
                    : 'text-ivory-2 hover:text-ivory hover:bg-white/[0.04]'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {!authChecked ? null : user ? (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-line hover:border-acid/40 transition-colors"
                  aria-label="User menu"
                >
                  <span className="w-7 h-7 rounded-full bg-acid text-acid-ink text-xs font-bold flex items-center justify-center">
                    {initials}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-ink-2 shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-line">
                      <p className="text-sm text-ivory truncate">{user.name}</p>
                      <p className="text-xs text-muted">{user.role}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ivory-2 hover:bg-white/[0.04] transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    {user.role === 'Admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ivory-2 hover:bg-white/[0.04] transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-acid hover:bg-acid/10 transition-colors border-t border-line"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="btn-acid !py-2 !px-5 text-sm">
                <Sparkles className="w-4 h-4" /> Login
              </Link>
            )}
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
          <nav className="flex flex-col p-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm ${
                  isActive(link.href)
                    ? 'text-ivory bg-ink-2'
                    : 'text-ivory-2'
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="mt-3 pt-3 border-t border-line">
              {!authChecked ? null : user ? (
                <>
                  <div className="flex items-center gap-3 px-4 pb-3">
                    <span className="w-8 h-8 rounded-full bg-acid text-acid-ink text-xs font-bold flex items-center justify-center">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-ivory truncate">{user.name}</p>
                      <p className="text-xs text-muted">{user.role}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm text-ivory-2"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  {user.role === 'Admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm text-ivory-2"
                    >
                      <ShieldCheck className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm text-acid"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)} className="btn-acid w-full">
                  Login
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
