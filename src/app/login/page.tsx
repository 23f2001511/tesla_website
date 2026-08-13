'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const handleLogin = async () => {
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
        setError(data.error || 'Login failed');
        return;
      }

      switch (data.role) {
        case 'Admin':
          router.push('/admin');
          break;
        case 'PI':
          router.push('/pi');
          break;
        case 'President':
          router.push('/president');
          break;
        case 'OfficeBearer':
          router.push('/office-bearer');
          break;
        case 'TeamLeader':
          router.push('/team-leader');
          break;
        case 'TeamMember':
          router.push('/dashboard/profile');
          break;
        case 'Alumni':
          router.push('/alumni');
          break;
        default:
          router.push('/');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-ink min-h-screen flex items-center justify-center px-4 py-20 bg-terminal">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Terminal chrome */}
        <div className="border border-line corner-marks bg-ink-2">
          <div className="border-b border-line px-4 py-2.5 flex items-center justify-between bg-ink">
            <span className="tag-mono">AUTH.SH — MEMBER LOGIN</span>
            <span className="flex gap-1.5">
              <span className="w-2 h-2 border border-line-2" />
              <span className="w-2 h-2 border border-line-2" />
              <span className="w-2 h-2 bg-acid" />
            </span>
          </div>

          <div className="p-8 sm:p-10">
            <div className="tag-mono-acid mb-4">// ACCESS</div>
            <h1 className="display text-4xl text-ivory mb-8">
              SIGN IN<span className="text-acid">_</span>
            </h1>

            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <div>
                <label className="tag-mono block mb-2">EMAIL</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full bg-ink border border-line focus:border-acid px-4 py-3 font-mono text-sm text-ivory placeholder:text-muted focus:outline-none transition-colors"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="tag-mono">PASSWORD</label>
                  <a href="#" className="tag-mono text-acid hover:text-ivory transition-colors">
                    FORGOT?
                  </a>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-ink border border-line focus:border-acid px-4 py-3 font-mono text-sm text-ivory placeholder:text-muted focus:outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="border border-acid px-4 py-3 font-mono text-xs text-acid">
                  ERR: {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-acid w-full justify-center"
              >
                {loading ? 'AUTHENTICATING…' : 'SIGN IN'}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>

            <div className="tag-mono mt-8 text-center">
              NO ACCOUNT?{' '}
              <Link href="/contact" className="text-acid hover:text-ivory transition-colors">
                REQUEST ONE
              </Link>
            </div>
          </div>
        </div>

        <div className="tag-mono mt-4 text-center">
          MEMBERS-ONLY AREA — UNAUTHORIZED ACCESS LOGGED
        </div>
      </motion.div>
    </div>
  );
}
