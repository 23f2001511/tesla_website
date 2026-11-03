'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SidebarLogo } from '@/components/logo/SidebarLogo';

import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  BookOpen,
  Trophy,
  GraduationCap,
  Image as ImageIcon,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Accounts onboarded with a temporary password must set their own password
  // before they can use the admin panel.
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const res = await fetch('/api/user/me');
        const data = await res.json();
        if (data.success && data.user?.mustChangePassword && pathname !== '/set-password') {
          router.replace('/set-password');
        }
      } catch (error) {
        console.error(error);
      }
    };
    checkOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Members', href: '/admin/members', icon: Users },
    { name: 'Events', href: '/admin/events', icon: Calendar },
    { name: 'Blogs', href: '/admin/blogs', icon: FileText },
    { name: 'Resources', href: '/admin/resources', icon: BookOpen },
    { name: 'Achievements', href: '/admin/achievements', icon: Trophy },
    { name: 'Alumni', href: '/admin/alumni', icon: GraduationCap },
    { name: 'Gallery', href: '/admin/gallery', icon: ImageIcon },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout Error:', err);
    }
  };

  return (
    <div className="min-h-screen flex bg-ink" data-theme="dark">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-acid text-acid-ink rounded-md shadow-lg"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:sticky top-0 left-0 z-30 h-screen w-64 bg-ink border-r border-line transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="flex flex-col h-full overflow-y-auto py-6 px-4 hide-scrollbar">
          <div className="mb-10 flex items-center gap-3">
            <SidebarLogo size={72} />
          </div>

          <div className="tag-mono mb-3">{'// Navigation'}</div>
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md font-mono text-[12px] tracking-[0.06em] uppercase transition-colors ${
                    isActive
                      ? 'bg-acid text-acid-ink'
                      : 'text-ivory-2 hover:bg-white/[0.04] hover:text-ivory'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? '' : 'text-muted'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-line">
            <div className="tag-mono mb-3">{'// System'}</div>

            <div className="space-y-1">
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-3 py-2 rounded-md font-mono text-[12px] tracking-[0.06em] uppercase text-ivory-2 hover:bg-white/[0.04] hover:text-ivory transition-colors"
              >
                <Settings className="w-4 h-4 text-muted" />
                Settings
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md font-mono text-[12px] tracking-[0.06em] uppercase text-acid hover:bg-acid/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-line flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-md bg-ink-3 border border-acid/40 flex items-center justify-center text-acid display text-base shrink-0">
              A
            </div>
            <div>
              <h3 className="display text-sm">Admin</h3>
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-x-hidden bg-ink">{children}</main>
    </div>
  );
}