'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SidebarLogo } from '@/components/logo/SidebarLogo';

import {
  LayoutDashboard,
  FileText,
  Calendar,
  BookOpen,
  Trophy,
  Users,
  GraduationCap,
  Image as ImageIcon,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import {
  DASHBOARD_THEME_CSS,
  THEME_CHANGE_EVENT,
  THEME_KEY,
  getStoredThemeChoice,
  resolveTheme,
  type ResolvedTheme,
} from './theme';
import type { MemberDTO } from '@/types/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // `/api/user/me` returns the signed-in user document (minus password).
  const [user, setUser] = useState<MemberDTO | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [theme, setTheme] = useState<ResolvedTheme>(() =>
    typeof window === 'undefined' ? 'dark' : resolveTheme(getStoredThemeChoice())
  );

  useEffect(() => {
    const apply = () => setTheme(resolveTheme(getStoredThemeChoice()));

    apply();

    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY) apply();
    };

    mq.addEventListener('change', apply);
    window.addEventListener(THEME_CHANGE_EVENT, apply);
    window.addEventListener('storage', onStorage);

    return () => {
      mq.removeEventListener('change', apply);
      window.removeEventListener(THEME_CHANGE_EVENT, apply);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user/me');
        const data = await res.json();

        if (data.success) {
          setUser(data.user);
          // Newly onboarded accounts (temporary password) must set their own
          // password before they can use the dashboard.
          if (data.user?.mustChangePassword && pathname !== '/set-password') {
            router.replace('/set-password');
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userRole = user?.role;

  type NavItem = {
    name: string;
    href: string;
    icon: typeof LayoutDashboard;
  };

  let navItems: NavItem[] = [];

  if (userRole === 'TeamLeader') {
    navItems = [
      { name: 'Overview', href: '/dashboard/members', icon: LayoutDashboard },
      { name: 'Team', href: '/dashboard/members/team', icon: Users },
      { name: 'My Events', href: '/dashboard/members/events', icon: Calendar },
      { name: 'My Blogs', href: '/dashboard/members/blogs', icon: FileText },
      { name: 'Resources', href: '/dashboard/resources', icon: BookOpen },
      { name: 'My Journey', href: '/dashboard/my-journey', icon: Trophy },
      { name: 'Gallery', href: '/dashboard/gallery', icon: ImageIcon },
      { name: 'Club Achievments', href: '/dashboard/members/achievments', icon: Trophy },
    ];

  } else if (userRole === 'TeamMember') {
    navItems = [
      { name: 'Overview', href: '/dashboard/members', icon: LayoutDashboard },
      { name: 'My Events', href: '/dashboard/members/events', icon: Calendar },
      { name: 'My Blogs', href: '/dashboard/members/blogs', icon: FileText },
      { name: 'Resources', href: '/dashboard/resources', icon: BookOpen },
      { name: 'My Journey', href: '/dashboard/my-journey', icon: Trophy },
      { name: 'Gallery', href: '/dashboard/gallery', icon: ImageIcon },
      { name: 'Club Achievments', href: '/dashboard/members/achievments', icon: Trophy },
    ];

  } else if (userRole === 'OfficeBearer') {
    navItems = [
      { name: 'Overview', href: '/dashboard/leadership', icon: LayoutDashboard },
      { name: 'Members', href: '/dashboard/leadership/members', icon: Users },
      { name: 'Events', href: '/dashboard/leadership/events', icon: Calendar },
      { name: 'Blogs', href: '/dashboard/leadership/blogs', icon: FileText },
      { name: 'My Journey', href: '/dashboard/my-journey', icon: Trophy },
      { name: 'Resources', href: '/dashboard/leadership/resources', icon: BookOpen },
      { name: 'Alumni', href: '/dashboard/leadership/alumni', icon: GraduationCap },
      { name: 'Gallery', href: '/dashboard/leadership/gallery', icon: ImageIcon },
      { name: 'Club Achievments', href: '/dashboard/leadership/club-achievements', icon: Trophy },
     
    ];

  } else if (userRole === 'PI') {
    // PI is a read-only oversight role — a single analytics view, no manage pages.
    navItems = [
      { name: 'PI Dashboard', href: '/dashboard/pi', icon: BarChart3 },
    ];

  } else if (userRole === 'Alumni') {
    navItems = [
      { name: 'Overview', href: '/dashboard/alumni', icon: LayoutDashboard },
      { name: 'Club Insights', href: '/dashboard/alumni/insights', icon: BarChart3 },
      { name: 'Alumni Network', href: '/dashboard/alumni/network', icon: GraduationCap },
      { name: 'My Profile', href: '/dashboard/profile', icon: Users }
    ];

  }else{
     navItems = [
      { name: 'Overview', href: '/dashboard/leadership', icon: LayoutDashboard },
      { name: 'Members', href: '/dashboard/leadership/members', icon: Users },
      { name: 'Events', href: '/dashboard/leadership/events', icon: Calendar },
      { name: 'Blogs', href: '/dashboard/leadership/blogs', icon: FileText },
      { name: 'My Journey', href: '/dashboard/my-journey', icon: Trophy },
      { name: 'Resources', href: '/dashboard/leadership/resources', icon: BookOpen },
      { name: 'Alumni', href: '/dashboard/leadership/alumni', icon: GraduationCap },
      { name: 'Gallery', href: '/dashboard/leadership/gallery', icon: ImageIcon },
      { name: 'Club Achievments', href: '/dashboard/leadership/club-achievements', icon: Trophy },
      
    ];
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div
      className="min-h-screen flex bg-ink text-ivory"
      data-theme={theme}
      suppressHydrationWarning
    >
      <style>{DASHBOARD_THEME_CSS}</style>
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
            <div className="w-9 h-9 rounded-md overflow-hidden bg-ink-3 border border-acid/40 shrink-0 flex items-center justify-center text-acid display text-base">
              {user?.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profileImage}
                  alt={user?.name || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                (user?.name || "?").charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h3 className="display text-sm truncate">{user?.name}</h3>
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">{userRole}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 overflow-x-hidden bg-ink">{children}</main>
    </div>
  );
}