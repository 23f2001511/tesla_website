'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

const ROLE_LANDING: Record<string, string> = {
  Admin: '/admin',
  PI: '/dashboard/pi',
  President: '/dashboard/leadership',
  OfficeBearer: '/dashboard/leadership',
  TeamLeader: '/dashboard/members',
  TeamMember: '/dashboard/members',
  Alumni: '/dashboard/alumni',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Check your credentials and try again.');
        return;
      }

      // Accounts created with a temporary password (onboarding) are forced to
      // set a personal password before they can use their dashboard.
      const destination = data.mustChangePassword ? '/set-password' : (ROLE_LANDING[data.role] || '/');
      router.push(destination);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4 bg-terminal">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-md bg-acid text-acid-ink flex items-center justify-center display font-bold">
              T
            </div>
            <span className="display text-2xl">TESLA</span>
          </div>
          <div className="tag-mono-acid mb-2">{'// Authenticate'}</div>
          <h1 className="display text-3xl">Welcome back</h1>
          <p className="text-sm text-muted mt-2">Sign in to your TESLA account</p>
        </div>

        <div className="card-brut rounded-xl p-6 corner-marks relative">
          {error && (
            <div className="flex items-center gap-2 bg-acid/10 border border-acid/30 rounded-md px-3.5 py-2.5 text-sm text-acid mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div>
              <label className="block font-mono text-[11px] tracking-[0.14em] uppercase text-muted mb-2">
                Email address
              </label>
              {/* Icon sits in a flex row — never overlaps the typed text */}
              <div className="flex items-center gap-3 input-brut rounded-md !px-3.5">
                <Mail className="w-4 h-4 text-muted shrink-0 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent outline-none font-mono text-[13px] text-ivory placeholder:text-muted"
                  placeholder="name@college.edu"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">Password</label>
                <a href="#" className="font-mono text-[11px] tracking-[0.14em] uppercase text-acid hover:underline">
                  Forgot?
                </a>
              </div>
              <div className="flex items-center gap-3 input-brut rounded-md !px-3.5">
                <Lock className="w-4 h-4 text-muted shrink-0 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent outline-none font-mono text-[13px] text-ivory placeholder:text-muted"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-acid w-full justify-center mt-2 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'} <LogIn className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-line text-center font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-acid hover:underline">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}