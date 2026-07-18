'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, GraduationCap, Briefcase, MapPin, ArrowRight, RefreshCw, Users } from 'lucide-react';

interface AlumniCard {
  id: string; name: string; profileImage: string; batch: number | null;
  branch: string; company: string; currentRole: string; location: string;
  designation: string; team: string;
}

export default function AlumniNetworkPage() {
  const [alumni, setAlumni] = useState<AlumniCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/alumni?section=network')
      .then((r) => r.json())
      .then((d) => d.success && setAlumni(d.alumni || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return alumni;
    return alumni.filter((a) =>
      [a.name, a.branch, a.company, a.currentRole, a.location, String(a.batch || '')]
        .some((f) => f.toLowerCase().includes(q))
    );
  }, [alumni, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" /> Loading alumni network...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Alumni Network</h1>
          <p className="text-gray-400 mt-1">{alumni.length} alumni · reconnect with your batchmates and seniors.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, batch, branch, company..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          {alumni.length === 0 ? 'No alumni in the network yet.' : 'No alumni match your search.'}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((a) => (
            <div key={a.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col items-center text-center hover:border-primary/30 transition-colors">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500/30 to-violet-500/30 flex items-center justify-center mb-3">
                {a.profileImage
                  ? <img src={a.profileImage} alt={a.name} className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-white/70">{a.name.charAt(0).toUpperCase()}</span>}
              </div>
              <h3 className="text-sm font-semibold text-white truncate w-full">{a.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
                <GraduationCap className="w-3 h-3" />
                {a.batch ? `Batch ${a.batch}` : 'Alumni'}{a.branch ? ` · ${a.branch}` : ''}
              </p>
              {(a.currentRole || a.company) && (
                <p className="text-xs text-gray-400 mt-1.5 flex items-center justify-center gap-1 truncate w-full">
                  <Briefcase className="w-3 h-3 shrink-0" />
                  {[a.currentRole, a.company].filter(Boolean).join(' @ ')}
                </p>
              )}
              {a.location && (
                <p className="text-[11px] text-gray-600 mt-0.5 flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3" /> {a.location}
                </p>
              )}
              <Link
                href={`/dashboard/profile/${a.id}`}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/25 transition-colors"
              >
                View Profile <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
