'use client';

import { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import {
  GraduationCap, Plus, Search, ChevronDown, Trash2, Key,
  RefreshCw, AlertCircle, Loader2, Users, Briefcase,
  Mail, Eye, MapPin, X, UserPlus, ArrowRightLeft,
  Globe, ShieldAlert, Lock, Pencil,
  Check, Award, Code2,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AlumniMember {
  id: string;
  name: string;
  email: string;
  branch: string;
  batch: number | null;
  graduationYear: number | null;
  company: string;
  currentRole: string;
  location: string;
  profileImage: string;
  linkedin: string;
  github: string;
  bio: string;
  skills: string[];
  achievements: { title: string; description: string; year: string }[];
  projects: { title: string; description: string; github: string; demo: string }[];
  portfolio: string;
  isVerified: boolean;
  createdAt: string;
}

interface ConvertableMember {
  id: string;
  name: string;
  email: string;
  branch: string;
  batch: number | null;
  designation: string;
  role: string;
  profileImage: string;
}

const ALUMNI_MANAGERS = ['Admin', 'President', 'OfficeBearer'];

function useCurrentUserRole(): string {
  return 'Admin';
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ─── Animated number ───────────────────────────────────────────────────────────
const AnimatedNumber = memo(({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 600, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display.toLocaleString()}</>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      <div className="h-28 rounded-2xl bg-white/[0.04] animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/[0.04] animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-2xl bg-white/[0.04] animate-pulse" />)}
      </div>
    </div>
  );
}

function NoPermissionNotice() {
  return (
    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2.5 text-xs text-amber-400">
      <Lock className="w-3.5 h-3.5 flex-shrink-0" />
      Only Admins, Presidents, and Office Bearers can add or edit alumni. You can still browse the directory.
    </div>
  );
}

// ─── Convert / Add Modal with Password Node ───
function ManageAlumniModal({
  onClose, onDone, actorRole,
}: { onClose: () => void; onDone: () => void; actorRole: string }) {
  const [tab, setTab] = useState<'convert' | 'create'>('convert');

  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<ConvertableMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ConvertableMember | null>(null);

  const [extra, setExtra] = useState({ company: '', currentRole: '', graduationYear: '', location: '' });

  // Create tab state containing credentials password block
  const [createForm, setCreateForm] = useState({
    name: '', email: '', branch: '', linkedin: '', password: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const searchMembers = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/alumni?mode=convertable&search=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) setMembers(data.members);
    } catch { /* fail bypass safely */ }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchMembers(query), 300);
    return () => clearTimeout(t);
  }, [query, searchMembers]);

  const submitConvert = async () => {
    if (!selected) { setError('Pick a member to convert.'); return; }
    if (!extra.company.trim() || !extra.currentRole.trim()) {
      setError('Company and current role are required.'); return;
    }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/admin/alumni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorRole, mode: 'convert', userId: selected.id,
          company: extra.company, currentRole: extra.currentRole,
          graduationYear: extra.graduationYear, location: extra.location,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Conversion failed.'); return; }
      onDone(); onClose();
    } catch { setError('Could not reach the server. Try again.'); }
    finally { setSubmitting(false); }
  };

  const submitCreate = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim() || !extra.company.trim() || !extra.currentRole.trim()) {
      setError('Name, email, initial password, company, and current role are required.'); return;
    }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/admin/alumni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorRole, mode: 'create',
          ...createForm,
          company: extra.company, currentRole: extra.currentRole,
          graduationYear: extra.graduationYear, location: extra.location,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Could not add alumnus.'); return; }
      onDone(); onClose();
    } catch { setError('Could not reach the server. Try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center"><GraduationCap className="w-4 h-4 text-indigo-400" /></div>
              <h2 className="text-sm font-bold text-white">Onboard to Alumni Network</h2>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center"><X className="w-3.5 h-3.5 text-gray-400" /></button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-6 pt-4">
            {[
              { key: 'convert', label: 'Convert Existing Member', Icon: ArrowRightLeft },
              { key: 'create', label: 'Add new passout', Icon: UserPlus },
            ].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key as any); setError(''); }} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${tab === t.key ? 'bg-indigo-500/15 text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}><t.Icon className="w-3 h-3" /> {t.label}</button>
            ))}
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-xs text-red-400"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}</div>}

            {tab === 'convert' ? (
              <>
                <p className="text-[11px] text-gray-500 -mt-1">Search for a current or past club member. Converting keeps their history — it just marks them as alumni.</p>
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-indigo-500/40">
                  <Search className="w-3.5 h-3.5 text-gray-600" />
                  <input className="bg-transparent text-gray-200 text-sm outline-none w-full placeholder-gray-600" placeholder="Search by name or email…" value={query} onChange={e => { setQuery(e.target.value); setSelected(null); }} />
                  {searching && <Loader2 className="w-3.5 h-3.5 text-gray-600 animate-spin" />}
                </div>

                {!selected && members.length > 0 && (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {members.map(m => (
                      <button key={m.id} onClick={() => setSelected(m)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-indigo-500/30 hover:bg-indigo-500/5 text-left">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">{initials(m.name)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-200 truncate">{m.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{m.email} · {m.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selected && (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{initials(selected.name)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-100 truncate">{selected.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{selected.email}</p>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-300"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-[11px] text-gray-500 -mt-1">Onboard alumni who graduated before the club used this system. Credentials will be shared directly via email broadcast.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name <span className="text-red-400">*</span></label>
                    <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500/50" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block textxs text-gray-400 mb-1.5 font-medium">Email <span className="text-red-400">*</span></label>
                    <input type="email" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500/50" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>

                {/* ── Dynamic Credentials Password Section block ── */}
                <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400"><Key className="w-3.5 h-3.5" /> Security Credentials Setup</div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1 font-medium">Initial Profile Access Password <span className="text-red-400">*</span></label>
                    <input type="text" className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-indigo-300 font-mono outline-none focus:border-indigo-500" placeholder="Set temporary pass key..." value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Branch</label>
                    <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500/50" placeholder="e.g. Electrical Engineering" value={createForm.branch} onChange={e => setCreateForm(f => ({ ...f, branch: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">LinkedIn</label>
                    <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500/50" placeholder="https://linkedin.com/in/…" value={createForm.linkedin} onChange={e => setCreateForm(f => ({ ...f, linkedin: e.target.value }))} />
                  </div>
                </div>
              </>
            )}

            {/* Shared fields */}
            <div className="border-t border-white/[0.06] pt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Company <span className="text-red-400">*</span></label>
                <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500/50" placeholder="e.g. NVIDIA" value={extra.company} onChange={e => setExtra(f => ({ ...f, company: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Current role <span className="text-red-400">*</span></label>
                <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500/50" placeholder="e.g. Systems Architect" value={extra.currentRole} onChange={e => setExtra(f => ({ ...f, currentRole: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Graduation year</label>
                <input type="number" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500/50" placeholder="e.g. 2024" value={extra.graduationYear} onChange={e => setExtra(f => ({ ...f, graduationYear: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Location</label>
                <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-indigo-500/50" placeholder="e.g. Bangalore" value={extra.location} onChange={e => setExtra(f => ({ ...f, location: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 transition-all">Cancel</button>
            <button onClick={tab === 'convert' ? submitConvert : submitCreate} disabled={submitting} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg disabled:opacity-50">{submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} {submitting ? 'Saving…' : tab === 'convert' ? 'Convert to alumni' : 'Add Alumnus profile'}</button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── View Profile Modal ────────────────────────────────────────────────────────
function ProfileModal({ alumnus, onClose }: { alumnus: AlumniMember; onClose: () => void }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
          <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent border-b border-white/[0.06]">
            <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center"><X className="w-3.5 h-3.5 text-gray-400" /></button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl flex items-center justify-center flex-shrink-0">{initials(alumnus.name)}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white truncate">{alumnus.name}</h2>
                  {alumnus.isVerified && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                </div>
                <p className="text-sm text-gray-400 truncate">{alumnus.currentRole}{alumnus.currentRole && alumnus.company ? ' at ' : ''}{alumnus.company}</p>
                {alumnus.branch && <p className="text-[11px] text-gray-500 mt-0.5">{alumnus.branch}{alumnus.graduationYear ? ` · Class of ${alumnus.graduationYear}` : ''}</p>}
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {alumnus.bio && <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3"><p className="text-sm text-gray-300 leading-relaxed">{alumnus.bio}</p></div>}
            <div className="grid grid-cols-2 gap-3">
              {alumnus.location && <div className="flex items-center gap-2 text-xs text-gray-400"><MapPin className="w-3.5 h-3.5 text-gray-600" /> {alumnus.location}</div>}
              <div className="flex items-center gap-2 text-xs text-gray-400 truncate"><Mail className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" /><a href={`mailto:${alumnus.email}`} className="truncate hover:text-indigo-400">{alumnus.email}</a></div>
            </div>

            {alumnus.skills?.length > 0 && (
              <div>
                <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">{alumnus.skills.map((s, i) => <span key={i} className="text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full">{s}</span>)}</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-6 py-4 border-t border-white/[0.06]">
            <a href={`mailto:${alumnus.email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-gray-300 hover:text-white transition-all"><Mail className="w-3 h-3" /> Email</a>
            {alumnus.linkedin && <a href={alumnus.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 hover:bg-blue-500/20 transition-all"><FaLinkedin className="w-3 h-3" /> LinkedIn</a>}
            {alumnus.github && <a href={alumnus.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-gray-300 hover:text-white transition-all"><FaGithub className="w-3 h-3" /> GitHub</a>}
            <button onClick={onClose} className="ml-auto px-4 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:bg-white/[0.05] transition-all">Close</button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Alumni Card ────────────────────────────────────────────────────────────────
const AlumniCard = memo(function AlumniCard({
  item, canManage, onView, onDelete,
}: { item: AlumniMember; canManage: boolean; onView: () => void; onDelete: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-5 hover:border-indigo-500/25 relative transition-all group flex flex-col justify-between overflow-hidden cursor-pointer" onClick={onView}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center uppercase flex-shrink-0">{initials(item.name)}</div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white tracking-tight truncate">{item.name}</h3>
              <p className="text-[10px] text-gray-500 font-semibold truncate">{item.branch}{item.graduationYear ? ` · Class of ${item.graduationYear}` : ''}</p>
            </div>
          </div>
          {canManage && (
            <button onClick={e => { e.stopPropagation(); onDelete(); }} className="w-6 h-6 rounded-lg border border-white/5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"><Trash2 className="w-3 h-3" /></button>
          )}
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-200 font-semibold"><Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" /><span className="truncate">{item.currentRole || 'Role not listed'}</span></div>
          <p className="text-[11px] text-gray-400 font-medium pl-5 truncate">{item.company ? `at ${item.company}` : 'Company not listed'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-white/[0.04] pt-3 mt-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 flex-shrink-0" /> {item.location || 'Location not listed'}</span>
        <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <a href={`mailto:${item.email}`} className="w-6 h-6 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center hover:text-white" title={item.email}><Mail className="w-3 h-3" /></a>
          {item.linkedin && <a href={item.linkedin} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-blue-400" title="LinkedIn"><FaLinkedin className="w-3 h-3" /></a>}
        </div>
      </div>
    </motion.div>
  );
});

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminAlumniPage() {
  const actorRole = useCurrentUserRole();
  const canManage = ALUMNI_MANAGERS.includes(actorRole);

  const [alumni, setAlumni] = useState<AlumniMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [batchFilter, setBatchFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);
  const [viewing, setViewing] = useState<AlumniMember | null>(null);

  const fetchAlumni = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/alumni', { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load alumni.');
      setAlumni(data.alumni);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Could not reach the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!canManage) return;
    if (!confirm(`Remove ${name} from the alumni directory? This can't be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/alumni?id=${id}&actorRole=${encodeURIComponent(actorRole)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) { alert(data.error || 'Delete failed.'); return; }
      setAlumni(prev => prev.filter(a => a.id !== id));
    } catch { alert('Could not reach the server.'); }
  }, [canManage, actorRole]);

  const graduationYears = useMemo(
    () => Array.from(new Set(alumni.map(a => a.graduationYear).filter(Boolean))).sort((a: any, b: any) => b - a),
    [alumni]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return alumni.filter(a => {
      const mQ = !q || a.name.toLowerCase().includes(q) || a.company.toLowerCase().includes(q) || a.currentRole.toLowerCase().includes(q);
      const mB = batchFilter === 'All' || a.graduationYear?.toString() === batchFilter;
      return mQ && mB;
    });
  }, [alumni, search, batchFilter]);

  const stats = useMemo(() => [
    { label: 'Alumni in network', value: alumni.length, color: '#6366f1', Icon: Users },
    { label: 'Companies represented', value: new Set(alumni.map(a => a.company).filter(Boolean)).size, color: '#10b981', Icon: Briefcase },
    { label: 'Graduation years', value: graduationYears.length, color: '#a78bfa', Icon: GraduationCap },
    { label: 'Verified profiles', value: alumni.filter(a => a.isVerified).length, color: '#06b6d4', Icon: Check },
  ], [alumni, graduationYears]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto text-gray-100">
      <AnimatePresence>
        {showManageModal && (
          <ManageAlumniModal actorRole={actorRole} onClose={() => setShowManageModal(false)} onDone={() => fetchAlumni(true)} />
        )}
        {viewing && <ProfileModal alumnus={viewing} onClose={() => setViewing(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.025] border border-white/[0.07] p-5">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">Alumni Network</h1>
            </div>
            <p className="text-xs text-gray-400">Where past members are now — for mentorship, referrals, and reunions.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fetchAlumni(true)} disabled={refreshing} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-400 transition-all"><RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />{refreshing ? 'Refreshing…' : 'Refresh'}</button>
            {canManage && (
              <button onClick={() => setShowManageModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg"><Plus className="w-3.5 h-3.5" /> Add Alumnus</button>
            )}
          </div>
        </div>
      </div>

      {!canManage && <NoPermissionNotice />}

      {error && (
        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => fetchAlumni()} className="ml-auto text-xs font-semibold underline">Try again</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border mb-2" style={{ background: `${s.color}15`, borderColor: `${s.color}30` }}><s.Icon style={{ color: s.color, width: 14, height: 14 }} /></div>
            <p className="text-xl font-black text-white tracking-tight"><AnimatedNumber value={s.value} /></p>
            <p className="text-[10px] text-gray-500 font-medium mt-1.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <select className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-gray-300 px-3 py-2 pr-9 outline-none cursor-pointer" value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
            <option value="All">All Graduation Years</option>
            {graduationYears.map(y => <option key={y} value={y!.toString()} className="bg-gray-900">Class of {y}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
        </div>
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 w-full sm:w-60">
          <Search className="w-3 h-3 text-gray-600 flex-shrink-0" />
          <input className="bg-transparent text-gray-200 text-xs outline-none w-full" placeholder="Search by name or company…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Directory Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 text-center py-16 border border-white/[0.05] rounded-2xl">
          <GraduationCap className="w-8 h-8 text-gray-700" />
          <p className="text-sm text-gray-500 font-medium">{alumni.length === 0 ? 'No alumni yet' : 'No one matches your search'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence initial={false}>
            {filtered.map(item => <AlumniCard key={item.id} item={item} canManage={canManage} onView={() => setViewing(item)} onDelete={() => handleDelete(item.id, item.name)} />)}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}