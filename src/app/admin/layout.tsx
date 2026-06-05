'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  BookOpen, 
  Trophy, 
  GraduationCap, 
  Image as ImageIcon,
  Bell,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Members', href: '/admin/members', icon: Users },
    { name: 'Events', href: '/admin/events', icon: Calendar },
    { name: 'Blogs', href: '/admin/blogs', icon: FileText },
    { name: 'Resources', href: '/admin/resources', icon: BookOpen },
    { name: 'Achievements', href: '/admin/achievements', icon: Trophy },
    { name: 'Alumni', href: '/admin/alumni', icon: GraduationCap },
    { name: 'Gallery', href: '/admin/gallery', icon: ImageIcon },
    { name: 'Announcements', href: '/admin/announcements', icon: Bell },
  ];



  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      router.push('/login');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <div className="pt-20 min-h-screen flex bg-background">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-24 left-4 z-40">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-primary text-white rounded-lg shadow-lg"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-20 left-0 z-30 h-[calc(100vh-5rem)] w-64 glass border-r border-white/5 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full overflow-y-auto py-6 px-4 hide-scrollbar">
          <div className="mb-8 px-2">
            <h2 className="text-xl font-bold text-white tracking-wide uppercase">Admin Panel</h2>
            <p className="text-xs text-primary mt-1">Superuser Access</p>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary/20 text-primary border border-primary/30' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-white/10 space-y-1">
            <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors">
            <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
