'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function SignInPage() {
  const hasClerkKey = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder')
  );

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-ink flex items-center justify-center px-4 py-16 bg-terminal">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs text-muted hover:text-acid transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>

        {hasClerkKey ? (
          <div className="border border-line corner-marks bg-ink-2 p-2 sm:p-4">
            <div className="border-b border-line px-4 py-2.5 mb-4 flex items-center justify-between bg-ink">
              <span className="tag-mono-acid">// ADMIN AUTH GATEWAY</span>
              <span className="tag-mono text-[10px]">OAUTH / CLERK</span>
            </div>
            <div className="flex justify-center p-2">
              <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
            </div>
            <div className="border-t border-line mt-4 pt-3 px-4 text-center">
              <p className="tag-mono text-[10px] text-muted">
                NOTICE: Only whitelisted .env admin emails will be granted access.
              </p>
            </div>
          </div>
        ) : (
          <div className="border border-line corner-marks bg-ink-2 p-8 space-y-6">
            <div className="flex items-center gap-3 text-acid border-b border-line pb-4">
              <ShieldAlert className="w-6 h-6" />
              <h2 className="display text-2xl text-ivory">CLERK SETUP REQUIRED</h2>
            </div>
            <p className="text-sm text-ivory-2 leading-relaxed">
              To enable Clerk OAuth (Google/GitHub/Email) for admin logins, add your Clerk credentials to{' '}
              <code className="bg-ink px-1.5 py-0.5 text-acid font-mono text-xs border border-line">
                .env.local
              </code>
              :
            </p>
            <div className="bg-ink p-4 border border-line font-mono text-xs text-ivory-2 space-y-1.5 overflow-x-auto">
              <div className="text-muted"># In .env.local:</div>
              <div>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...</div>
              <div>CLERK_SECRET_KEY=sk_test_...</div>
              <div className="text-acid mt-2">ADMIN_EMAILS=admin@tesla.club,your_email@gmail.com</div>
            </div>
            <div className="pt-2">
              <Link
                href="/admin"
                className="btn-acid w-full justify-center"
              >
                Access Admin (Dev Mode) →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
