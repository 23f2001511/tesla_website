'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-ink flex items-center justify-center px-4 py-16 bg-terminal">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs text-muted hover:text-acid transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>

        <div className="border border-line corner-marks bg-ink-2 p-2 sm:p-4">
          <div className="border-b border-line px-4 py-2.5 mb-4 flex items-center justify-between bg-ink">
            <span className="tag-mono-acid">// NEW ADMIN REGISTRATION</span>
            <span className="tag-mono text-[10px]">OAUTH / CLERK</span>
          </div>
          <div className="flex justify-center p-2">
            <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
          </div>
          <div className="border-t border-line mt-4 pt-3 px-4 text-center">
            <p className="tag-mono text-[10px] text-muted">
              Note: Account must use a whitelisted email in .env to access admin privileges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
