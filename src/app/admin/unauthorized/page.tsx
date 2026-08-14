'use client';

import { useUser, SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';
import { ShieldX, LogOut, ArrowLeft } from 'lucide-react';

export default function AdminUnauthorizedPage() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress || 'your account';

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-ink flex items-center justify-center px-4 py-20 bg-terminal">
      <div className="w-full max-w-lg">
        <div className="border border-red-500/40 bg-ink-2 p-8 sm:p-10 corner-marks relative overflow-hidden">
          <div className="flex items-center gap-3 text-red-400 mb-6 border-b border-line pb-4">
            <ShieldX className="w-8 h-8 shrink-0" />
            <div>
              <h1 className="display text-3xl text-ivory">ACCESS DENIED</h1>
              <div className="tag-mono text-red-400 mt-1">403 — NOT ON ADMIN WHITELIST</div>
            </div>
          </div>

          <div className="space-y-4 text-sm text-ivory-2 leading-relaxed mb-8">
            <p>
              You are signed in as <span className="text-acid font-mono font-bold">{email}</span>, but this email address is not authorized in the{' '}
              <code className="bg-ink px-2 py-0.5 border border-line text-acid font-mono text-xs">
                ADMIN_EMAILS
              </code>{' '}
              whitelist in <code className="bg-ink px-2 py-0.5 border border-line text-xs font-mono">.env</code>.
            </p>
            <p className="text-xs text-muted">
              If you are a club lead or faculty advisor, contact the system administrator to append your email to{' '}
              <code className="text-acid">ADMIN_EMAILS</code>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-line">
            <SignOutButton>
              <button className="btn-acid flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </SignOutButton>
            <Link
              href="/"
              className="btn-brut flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
