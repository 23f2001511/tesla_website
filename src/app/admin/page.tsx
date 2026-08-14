'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  Zap,
  Image as ImageIcon,
  FileText,
  BookOpen,
  Trophy,
  GraduationCap,
  Database,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSeedDatabase = async () => {
    if (!confirm('This will seed/reset initial club data for all modules. Proceed?')) {
      return;
    }

    try {
      setSeeding(true);
      setSeedSuccess(null);
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedSuccess('Database populated with starter data successfully!');
        fetchStats();
      } else {
        alert('Seeding failed: ' + (data.error || data.message));
      }
    } catch (err: any) {
      alert('Seeding error: ' + err.message);
    } finally {
      setSeeding(false);
      setTimeout(() => setSeedSuccess(null), 6000);
    }
  };

  const statCards = [
    {
      title: 'Team Roster',
      value: stats?.counts?.team ?? '-',
      href: '/admin/team',
      icon: Users,
      tag: 'ROSTER',
    },
    {
      title: 'Events & Sessions',
      value: stats?.counts?.events ?? '-',
      sub: `${stats?.counts?.upcomingEvents ?? 0} upcoming`,
      href: '/admin/events',
      icon: Calendar,
      tag: 'SCHEDULE',
    },
    {
      title: 'Tech Logs & Blogs',
      value: stats?.counts?.blogs ?? '-',
      href: '/admin/blogs',
      icon: FileText,
      tag: 'WRITING',
    },
    {
      title: 'Photo Gallery',
      value: stats?.counts?.gallery ?? '-',
      href: '/admin/gallery',
      icon: ImageIcon,
      tag: 'MEDIA',
    },
    {
      title: 'Resource Vault',
      value: stats?.counts?.resources ?? '-',
      href: '/admin/resources',
      icon: BookOpen,
      tag: 'VAULT',
    },
    {
      title: 'Trophy Cabinet',
      value: stats?.counts?.achievements ?? '-',
      href: '/admin/achievements',
      icon: Trophy,
      tag: 'WINS',
    },
    {
      title: 'Alumni Network',
      value: stats?.counts?.alumni ?? '-',
      href: '/admin/alumni',
      icon: GraduationCap,
      tag: 'NETWORK',
    },
    {
      title: 'Flagship Event',
      value: "HACK '26",
      href: '/admin/flagship',
      icon: Zap,
      tag: 'FLAGSHIP',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header with Seed Button */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-line">
        <div>
          <div className="tag-mono-acid mb-2">// COMMAND CENTER</div>
          <h1 className="display text-4xl sm:text-5xl text-ivory">SYSTEM OVERVIEW</h1>
          <p className="text-sm text-ivory-2 mt-2 max-w-lg">
            Manage real-time variable club content across team rosters, events, hackathon tracks, vault files, and site links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="btn-brut text-xs py-2.5 px-4"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="btn-acid text-xs py-2.5 px-4"
          >
            <Database className="w-3.5 h-3.5" />
            {seeding ? 'SEEDING DATABASE…' : 'INITIALIZE / SEED DATA'}
          </button>
        </div>
      </div>

      {seedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-acid/10 border border-acid p-4 flex items-center gap-3 text-acid font-mono text-xs"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{seedSuccess}</span>
        </motion.div>
      )}

      {/* Security & System Info Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line border border-line">
        <div className="bg-ink-2 p-4 flex items-center gap-3">
          <div className="p-2.5 bg-ink border border-line text-acid">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="tag-mono text-[10px]">DATABASE STATUS</div>
            <div className="font-mono text-xs text-ivory font-bold flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> MongoDB Atlas / Connected
            </div>
          </div>
        </div>

        <div className="bg-ink-2 p-4 flex items-center gap-3">
          <div className="p-2.5 bg-ink border border-line text-acid">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="tag-mono text-[10px]">ADMIN GATEWAY</div>
            <div className="font-mono text-xs text-ivory font-bold flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-acid" /> Clerk OAuth + .env Whitelist
            </div>
          </div>
        </div>

        <div className="bg-ink-2 p-4 flex items-center gap-3">
          <div className="p-2.5 bg-ink border border-line text-acid">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="tag-mono text-[10px]">CURRENT USER</div>
            <div className="font-mono text-xs text-acid font-bold truncate mt-0.5 max-w-[200px]">
              {stats?.user?.email || 'Administrator'}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div>
        <div className="tag-mono-acid mb-4">// CONTENT MODULES</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
          {statCards.map((card, idx) => (
            <Link
              key={card.title}
              href={card.href}
              className="group bg-ink hover:bg-ink-2 transition-all p-6 flex flex-col justify-between min-h-[160px]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <card.icon className="w-4 h-4 text-muted group-hover:text-acid transition-colors" />
                  <span className="tag-mono text-[10px]">[{card.tag}]</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-acid group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>

              <div className="mt-4">
                <div className="display text-4xl text-ivory group-hover:text-acid transition-colors">
                  {card.value}
                </div>
                <div className="text-xs text-ivory-2 mt-1 font-mono flex items-center justify-between">
                  <span>{card.title}</span>
                  {card.sub && <span className="tag-mono-acid text-[10px]">{card.sub}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="border border-line corner-marks bg-ink-2 p-6 sm:p-8">
        <div className="tag-mono-acid mb-3">// QUICK NAVIGATION</div>
        <h3 className="display text-2xl text-ivory mb-6">DIRECT DATA EDITORS</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Link
            href="/admin/team"
            className="p-4 bg-ink border border-line hover:border-acid text-center transition-colors group"
          >
            <Users className="w-5 h-5 text-muted group-hover:text-acid mx-auto mb-2" />
            <div className="tag-mono text-[10px] text-ivory">Manage Team</div>
          </Link>
          <Link
            href="/admin/events"
            className="p-4 bg-ink border border-line hover:border-acid text-center transition-colors group"
          >
            <Calendar className="w-5 h-5 text-muted group-hover:text-acid mx-auto mb-2" />
            <div className="tag-mono text-[10px] text-ivory">Manage Events</div>
          </Link>
          <Link
            href="/admin/flagship"
            className="p-4 bg-ink border border-line hover:border-acid text-center transition-colors group"
          >
            <Zap className="w-5 h-5 text-muted group-hover:text-acid mx-auto mb-2" />
            <div className="tag-mono text-[10px] text-ivory">Hack-Tesla '26</div>
          </Link>
          <Link
            href="/admin/blogs"
            className="p-4 bg-ink border border-line hover:border-acid text-center transition-colors group"
          >
            <FileText className="w-5 h-5 text-muted group-hover:text-acid mx-auto mb-2" />
            <div className="tag-mono text-[10px] text-ivory">Write Article</div>
          </Link>
          <Link
            href="/admin/settings"
            className="p-4 bg-ink border border-line hover:border-acid text-center transition-colors group"
          >
            <Database className="w-5 h-5 text-muted group-hover:text-acid mx-auto mb-2" />
            <div className="tag-mono text-[10px] text-ivory">Site Settings</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
