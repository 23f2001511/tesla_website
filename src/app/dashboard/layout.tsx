'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  LayoutDashboard,
  FileText,
  Calendar,
  BookOpen,
  Trophy,
  Users,
  Image as ImageIcon,
  Settings,
  LogOut,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user/me');
        const data = await res.json();

        if (data.success) {
          setUser(data.user);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchUser();
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
      { name: 'Dashboard', href: '/dashboard/members', icon: LayoutDashboard },
      { name: 'Team', href: '/dashboard/members/team', icon: Users },
      { name: 'My Events', href: '/dashboard/members/events', icon: Calendar },
      { name: 'My Blogs', href: '/dashboard/members/blogs', icon: FileText },
      { name: 'Resources', href: '/dashboard/resources', icon: BookOpen },
      { name: 'Achievements', href: '/dashboard/achievements', icon: Trophy },
      { name: 'Gallery', href: '/dashboard/gallery', icon: ImageIcon }
    ];

  } else if (userRole === 'TeamMember') {
    navItems = [
      { name: 'Dashboard', href: '/dashboard/members', icon: LayoutDashboard },
      { name: 'My Events', href: '/dashboard/members/events', icon: Calendar },
      { name: 'My Blogs', href: '/dashboard/members/blogs', icon: FileText },
      { name: 'Resources', href: '/dashboard/resources', icon: BookOpen },
      { name: 'Achievements', href: '/dashboard/achievements', icon: Trophy },
      { name: 'Gallery', href: '/dashboard/gallery', icon: ImageIcon }
    ];

  } else if (userRole === 'OfficeBearer') {
    navItems = [
      { name: 'Dashboard', href: '/dashboard/members', icon: LayoutDashboard },
      { name: 'Blogs and Events', href: '/dashboard/members/events', icon: FileText },
      { name: 'Resources', href: '/dashboard/resources', icon: BookOpen },
      { name: 'Achievements', href: '/dashboard/achievements', icon: Trophy },
      { name: 'Gallery', href: '/dashboard/gallery', icon: ImageIcon }
    ];

  } else if (userRole === 'PI') {
    navItems = [
      { name: 'Dashboard', href: '/dashboard/members', icon: LayoutDashboard },
      { name: 'manage', href: '/dashboard/manage', icon: FileText }
    ];

  } else if (userRole === 'Alumni') {
    navItems = [
      { name: 'Dashboard', href: '/dashboard/members', icon: LayoutDashboard },
      { name: 'My Events', href: '/dashboard/members/events', icon: Calendar },
      { name: 'My Blogs', href: '/dashboard/members/blogs', icon: FileText },
      { name: 'Resources', href: '/dashboard/resources', icon: BookOpen },
      { name: 'Achievements', href: '/dashboard/achievements', icon: Trophy },
      { name: 'Gallery', href: '/dashboard/gallery', icon: ImageIcon }
    ];

  }else{
     navItems = [
      { name: 'Dashboard', href: '/dashboard/members', icon: LayoutDashboard },
      { name: 'My Events', href: '/dashboard/members/events', icon: Calendar },
      { name: 'My Blogs', href: '/dashboard/members/blogs', icon: FileText },
      { name: 'Resources', href: '/dashboard/resources', icon: BookOpen },
      { name: 'Achievements', href: '/dashboard/achievements', icon: Trophy },
      { name: 'Gallery', href: '/dashboard/gallery', icon: ImageIcon }
    ];
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="h-screen w-full bg-[#0d1117] flex overflow-hidden selection:bg-primary/30 selection:text-white">
      
      {/* ── DESIGNER PREMIUM SIDEBAR ── */}
      <aside className="w-56 border-r border-white/[0.06] bg-gradient-to-b from-[#0f141c] via-[#0d1117] to-[#0b0e14] p-4 flex flex-col h-full flex-shrink-0 sticky top-0 select-none shadow-2xl shadow-black/40">
        
        {/* Brand/Logo Section with Glowing Border Sub-pipe */}
        <div className="mb-6 pl-2.5 pt-2 relative group">
          <div className="space-y-0.5">
            <h1 className="text-xl font-black text-white tracking-wider flex items-center gap-1.5 font-sans">
              TESLA <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-primary/80">
              Technical Club
            </p>
          </div>
          {/* Suttle accent line under logo */}
          <div className="w-12 h-[2px] bg-gradient-to-r from-primary to-transparent mt-3.5 opacity-60 group-hover:w-20 transition-all duration-300" />
        </div>

        {/* Navigation Items Link Pipeline */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-white border border-primary/20 shadow-lg shadow-primary/5'
                    : 'text-gray-400 hover:bg-white/[0.03] hover:text-white border border-transparent'
                }`}
              >
                {/* Active Indicator Strip Indicator */}
                {isActive && (
                  <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-md bg-primary" />
                )}
                
                <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-primary' : 'text-gray-400 group-hover:text-white'
                }`} />
                
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions Section with Smooth Gradient Borders */}
        <div className="border-t border-white/[0.06] pt-3.5 space-y-1.5 mt-auto">
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide border border-transparent transition-all duration-200 group ${
              pathname === '/dashboard/settings'
                ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-white border-primary/20'
                : 'text-gray-400 hover:bg-white/[0.03] hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-white transition-colors" />
            <span>Settings</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide text-red-400/90 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/10 transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-400/80 group-hover:translate-x-0.5 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ROUTER CONTAINER ── */}
      <main className="flex-1 h-full p-8 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}