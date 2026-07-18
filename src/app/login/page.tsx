'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { Navbar } from "@/components/layout/Navbar";


const ROLE_LANDING: Record<string, string> = {
  Admin:        '/admin',
  PI:           '/dashboard/pi',
  President:    '/dashboard/leadership',           // President has admin panel access too
  OfficeBearer: '/dashboard/leadership',
  TeamLeader:   '/dashboard/members',
  TeamMember:   '/dashboard/members',
  Alumni:       '/dashboard/alumni',
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

      const destination = ROLE_LANDING[data.role] || '/';
      router.push(destination);
    } catch (error) {
      console.error(error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center p-4">
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-8 rounded-3xl border-primary/20 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent z-0 pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400 text-sm">Sign in to your TESLA account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5 text-sm text-red-400 mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="name@college.edu"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-400">Password</label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-60"
            >
              {loading ? 'Signing In...' : 'Sign In'} <LogIn className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account? <Link href="/register" className="text-primary hover:underline font-medium">Create one</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}