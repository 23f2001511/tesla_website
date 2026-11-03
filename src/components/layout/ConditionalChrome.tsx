'use client';

// Route-based chrome: the site's public Navbar/Footer are rendered here in the
// root layout, but they must NOT appear on app-shell routes (/dashboard/*,
// /admin/*) which already provide their own complete sidebar/header layout.
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const APP_SHELL_PREFIXES = ['/dashboard', '/admin'];

export default function ConditionalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppShell = APP_SHELL_PREFIXES.some((p) => pathname.startsWith(p));

  if (isAppShell) {
    // App shells already render their own sidebar + header; no global chrome,
    // and no pt-16 offset (that only exists for the fixed public Navbar).
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-16">{children}</main>
      <Footer />
    </>
  );
}
