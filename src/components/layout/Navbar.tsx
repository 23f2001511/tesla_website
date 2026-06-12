'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import{Bell} from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isPrivateArea = pathname.startsWith('/admin') || pathname.startsWith('/dashboard');

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
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      router.push('/login');
    } catch (error) {
      console.error(error);
    }
  };

  const profileRoute =
    user?.role === 'Admin'
      ? '/admin'
      : user?.role === 'president'
        ? '/president'
        : user?.role === 'team_leader'
          ? '/leader'
          : '/dashboard/profile';

          
  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href="/" className="flex items-center gap-3 group">
              {/* Replace with actual logo if available */}
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 group-hover:glow-box transition-all">
                <span className="text-xl font-bold text-primary">T</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl leading-none text-white tracking-wider">TESLA</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Technical Club</span>
              </div>
            </Link>
          </div>

          <div className="hidden md:block">
            {!isPrivateArea && (
              <div className="ml-10 flex items-baseline space-x-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

   <div className="hidden md:flex items-center gap-4">
  {isPrivateArea ? (
    <>
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search..."
          className="w-64 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Notification Bell */}
      <button className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
        <Bell className="w-5 h-5 text-gray-300" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>

      {/* Existing Profile Section */}
      {user &&(

      <div className="relative group">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
            {user.name?.split(' ')[0]?.charAt(0).toUpperCase()}
          </div>

          <div className="text-left">
            <p className="text-sm font-medium text-white">
              {user.name?.split(' ')[0]}
            </p>

            <p className="text-xs text-gray-400">
              {user.role}
            </p>
          </div>

          <span className="text-gray-400 text-xs">▼</span>
        </div>

        <div
          className="absolute right-0 top-full mt-2 w-52 glass rounded-xl border border-white/10 shadow-xl
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200 overflow-hidden z-50"
        >
          <Link
            href={profileRoute}
            className="block px-4 py-3 text-sm text-white hover:bg-white/5"
          >
            My Profile
          </Link>

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"
          >
            Logout
          </button>
        </div>
      </div>
      )}
    </>
  ) : (
    <>
      <Link
        href="/login"
        className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        Login
      </Link>

      <Link
        href="/contact"
        className="text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.5)]"
      >
        Join Us
      </Link>

      <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
        <Settings className="w-4 h-4" />
      </button>
    </>
  )}
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

      {isOpen && !isPrivateArea && (
        <div className="md:hidden glass border-t border-white/5">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === link.href
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
                Join Us
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
