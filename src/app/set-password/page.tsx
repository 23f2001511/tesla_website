'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Loader2, Lock, CheckCircle2, LogOut } from 'lucide-react';

export default function SetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/user/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) setEmail(d.user.email || '');
        else router.replace('/login');
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const submit = async () => {
    setError('');
    if (!currentPassword || !newPassword) {
      setError('Enter your temporary password and a new password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Your new password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirm) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Could not update your password.');
      } else {
        setDone(true);
        window.setTimeout(() => router.push('/dashboard'), 1000);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4 bg-terminal">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-acid text-acid-ink mb-4">
            <KeyRound className="w-7 h-7" />
          </div>
          <div className="tag-mono-acid mb-2">{'// Security'}</div>
          <h1 className="display text-3xl">Set your password</h1>
          <p className="text-sm text-muted mt-2">
            Your temporary password is valid for one login only. Choose a personal
            password to unlock your dashboard.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-ink-2 p-6 sm:p-8 shadow-2xl">
          {done ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-acid mx-auto mb-3" />
              <h2 className="display text-xl mb-1">Password saved</h2>
              <p className="text-sm text-muted">Taking you to your dashboard…</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-[0.14em] text-muted mb-1.5 block">
                  Account
                </label>
                <input
                  value={email}
                  readOnly
                  className="input-brut w-full bg-white/[0.02] text-ivory-2"
                  placeholder="you@nitp.ac.in"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-[0.14em] text-muted mb-1.5 block">
                  Temporary password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-brut w-full"
                  placeholder="The password from your welcome email"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-[0.14em] text-muted mb-1.5 block">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-brut w-full"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-[0.14em] text-muted mb-1.5 block">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input-brut w-full"
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={submit}
                disabled={loading}
                className="btn-acid w-full justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {loading ? 'Saving…' : 'Set password & continue'}
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-muted hover:text-ivory transition-colors mt-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Log out and finish later
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted mt-6">
          <Link href="/login" className="text-acid hover:underline">
            Already set your password? Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}