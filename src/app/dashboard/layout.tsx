'use client';

import { useState , useEffect } from 'react';
import Link from 'next/link';
import { usePathname , useRouter } from 'next/navigation';
import { 
  User, 
  FileText, 
  Calendar, 
  BookOpen, 
  Trophy, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {

  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });

      router.push('/login');
    } catch (error) {
      console.error(error);
      alert('Logout failed');
    }
  };

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

  const navItems = [
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'My Blogs', href: '/dashboard/blogs', icon: FileText },
    { name: 'My Events', href: '/dashboard/events', icon: Calendar },
    { name: 'My Resources', href: '/dashboard/resources', icon: BookOpen },
    { name: 'My Achievements', href: '/dashboard/achievements', icon: Trophy },
  ];

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
          <div className="mb-8 px-2 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary/30 overflow-hidden">
              <img src="https://i.pravatar.cc/150?u=current_user" alt="User" className="w-full h-full object-cover" />
            </div>
            <div>
               <h2 className="text-sm font-bold text-white">
                {user?.name || 'Loading...'}
              </h2>

              <p className="text-xs text-gray-400">
                {user?.role || ''}
              </p>
            </div>
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
            <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors">
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
