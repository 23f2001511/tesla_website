'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SidebarLogo } from '@/components/logo/SidebarLogo';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Events', href: '/events' },
    { name: 'Team', href: '/team' },
    { name: 'Blogs', href: '/blogs' },
    { name: 'Resources', href: '/resources' },
    { name: 'Alumni', href: '/alumni' },
    { name: 'Gallery', href: '/gallery' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href="/" className="group">
              <SidebarLogo className="group-hover:glow-box transition-all duration-300" />
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/contact" className="text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              Join Us
            </Link>
            <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden glass border-t border-white/5">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === link.href
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-2 px-3">
              <Link href="/login" className="text-center w-full block text-base font-medium text-gray-300 bg-white/5 py-2 rounded-md">
                Login
              </Link>
              <Link href="/contact" className="text-center w-full block text-base font-medium bg-primary text-white py-2 rounded-md">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
