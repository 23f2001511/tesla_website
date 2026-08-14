'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { UserButton, useUser, SignOutButton } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Zap,
  Image as ImageIcon,
  FileText,
  BookOpen,
  Trophy,
  GraduationCap,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoaded } = useUser();

  const navItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Team Roster', href: '/admin/team', icon: Users },
    { name: 'Events & Schedule', href: '/admin/events', icon: Calendar },
    { name: 'Flagship Hackathon', href: '/admin/flagship', icon: Zap },
    { name: 'Photo Gallery', href: '/admin/gallery', icon: ImageIcon },
    { name: 'Tech Blogs / Logs', href: '/admin/blogs', icon: FileText },
    { name: 'Resource Vault', href: '/admin/resources', icon: BookOpen },
    { name: 'Achievements', href: '/admin/achievements', icon: Trophy },
    { name: 'Alumni Network', href: '/admin/alumni', icon: GraduationCap },
    { name: 'Site Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-ink text-ivory">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-20 left-4 z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2.5 bg-ink-2 border border-line text-acid hover:border-acid transition-colors shadow-xl"
          aria-label="Toggle admin menu"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-ink border-r border-line transition-transform duration-300 flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Admin Header */}
        <div className="p-5 border-b border-line bg-ink-2">
          <div className="flex items-center justify-between">
            <span className="tag-mono-acid">// CONTROL PANEL</span>
            <span className="tag-mono text-[9px] bg-ink px-2 py-0.5 border border-line text-acid">
              ADMIN
            </span>
          </div>
          <h2 className="display text-xl text-ivory mt-1">TESLA CORE</h2>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted font-mono truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-acid shrink-0" />
            <span className="truncate">
              {isLoaded && user ? user.primaryEmailAddress?.emailAddress : 'Superuser Session'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 font-mono text-xs tracking-wider transition-all border ${
                  isActive
                    ? 'bg-acid text-acid-ink border-acid font-bold'
                    : 'border-transparent text-ivory-2 hover:text-ivory hover:bg-ink-2 hover:border-line'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-acid-ink' : 'text-muted'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-line bg-ink-2 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-mono text-ivory-2 hover:text-acid border border-line bg-ink transition-colors"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted" />
          </Link>

          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2">
              <UserButton />
              <span className="tag-mono text-[10px]">AUTH SESSION</span>
            </div>
            <SignOutButton>
              <button
                className="p-1.5 text-muted hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </SignOutButton>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 w-full overflow-x-hidden min-w-0">
        {children}
      </main>
    </div>
  );
}
