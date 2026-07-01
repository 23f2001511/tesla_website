'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Search, Edit2, Trash2, CheckCircle, XCircle, UserPlus, Loader2,
  Crown, ShieldCheck, Mail, Briefcase, ChevronDown, GraduationCap,
  ShieldAlert, Award, ArrowUpCircle, X, Check, Lock, Power,
  Users, UserCheck, FolderPlus, ArrowLeft, ImageIcon, Calendar,
  FileText, FolderOpen, Settings2, Building2, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TL_PERMISSIONS } from '@/lib/permissions';

// ─── Role config ─────────────────────────────────────────────────────────────
const ALL_ROLES = ['Admin', 'PI', 'President', 'OfficeBearer', 'TeamLeader', 'TeamMember', 'Alumni'];
// PI is intentionally excluded — nobody can be promoted to PI from the dashboard.
const PROMOTABLE_ROLES = ['Admin', 'President', 'OfficeBearer', 'TeamLeader', 'TeamMember', 'Alumni'];

// Roles allowed to add/edit/delete/toggle members, manage teams & permissions.
const MEMBER_MANAGERS = ['Admin', 'President', 'OfficeBearer'];
// Roles allowed to change another member's role (promote/demote).
const ROLE_MANAGERS = ['Admin', 'President'];

const ROLE_META: Record<string, { Icon: any; color: string }> = {
  Admin:        { Icon: ShieldAlert,   color: '#f87171' },
  PI:           { Icon: ShieldAlert,   color: '#a78bfa' },
  President:    { Icon: Crown,         color: '#fbbf24' },
  OfficeBearer: { Icon: ShieldCheck,   color: '#60a5fa' },
  TeamLeader:   { Icon: Award,         color: '#34d399' },
  TeamMember:   { Icon: Award,         color: '#9ca3af' },
  Alumni:       { Icon: GraduationCap, color: '#06b6d4' },
};

const UNASSIGNED_KEY = '__unassigned__';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// The team "bucket" a member belongs to (their team name, or the unassigned bucket).
function teamKeyOf(m: any) {
  const t = (m.team || '').trim();
  return t ? t : UNASSIGNED_KEY;
}

// ─── Current user (real session via /api/user/me) ────────────────────────────
function useCurrentUser() {
  const [actor, setActor] = useState<{ id: string; role: string }>({ id: '', role: '' });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user/me');
        const data = await res.json();
        if (data.success && data.user) {
          setActor({ id: data.user._id, role: data.user.role });
        }
      } catch {
        /* leave actor empty → view-only */
      } finally {
        setReady(true);
      }
    })();
  }, []);
  return { actor, ready };
}

// ─── Avatar (profile image + graceful fallback) ──────────────────────────────
function Avatar({ src, name, color = '#60a5fa', size = 40 }: { src?: string; name?: string; color?: string; size?: number }) {
  return (
    <div
      className="rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center font-black shadow-inner"
      style={{ width: size, height: size, background: `${color}20`, color, fontSize: size * 0.4 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || 'member'} className="w-full h-full object-cover" />
      ) : (
        (name || 'U').charAt(0).toUpperCase()
      )}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
        active
          ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
          : 'text-rose-400 border-rose-500/30 bg-rose-500/10'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
function ModalShell({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className={`pointer-events-auto w-full ${wide ? 'max-w-md' : 'max-w-sm'} bg-zinc-950 border border-white/10 rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto`}>
          {children}
        </div>
      </motion.div>
    </>
  );
}

// ─── Promote / change role modal (no PI) ─────────────────────────────────────
function PromoteModal({ member, onClose, onDone, actor }: { member: any; onClose: () => void; onDone: () => void; actor: { id: string; role: string } }) {
  const [role, setRole] = useState(member.role);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (role === member.role) { onClose(); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: actor.role, actorId: actor.id, id: member._id, action: 'updateRole', role }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Update failed.'); return; }
      onDone(); onClose();
    } catch { setError('Could not reach the server. Try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ArrowUpCircle className="w-4 h-4 text-blue-400" /> Change role
        </h3>
        <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center">
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <Avatar src={member.profileImage} name={member.name} color={(ROLE_META[member.role] || ROLE_META.TeamMember).color} size={36} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-100 truncate">{member.name}</p>
          <p className="text-[11px] text-gray-500 truncate">Currently {member.role}</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">{error}</div>}

      <div>
        <label className="block text-[11px] text-gray-400 mb-1.5 font-medium">New role</label>
        <div className="relative">
          <select
            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 pr-8"
            value={role} onChange={e => setRole(e.target.value)}
          >
            {PROMOTABLE_ROLES.map(r => <option key={r} value={r} className="bg-zinc-950">{r}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>
        <p className="text-[10px] text-gray-600 mt-1.5 flex items-center gap-1">
          <Lock className="w-2.5 h-2.5" /> PI is a protected role and cannot be assigned here.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="text-xs text-gray-400 px-3 py-1.5 hover:text-gray-200">Cancel</button>
        <button onClick={submit} disabled={submitting}
          className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-xl text-white disabled:opacity-50 transition-colors">
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {submitting ? 'Saving…' : 'Confirm change'}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Edit member modal ────────────────────────────────────────────────────────
function EditMemberModal({ member, onClose, onDone, actor, teamNames }: { member: any; onClose: () => void; onDone: () => void; actor: { id: string; role: string }; teamNames: string[] }) {
  const [form, setForm] = useState({ name: member.name || '', team: member.team || '', designation: member.designation || '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.name.trim()) { setError('Name cannot be empty.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: actor.role, actorId: actor.id, id: member._id, action: 'updateDetails', ...form }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Update failed.'); return; }
      onDone(); onClose();
    } catch { setError('Could not reach the server. Try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Edit2 className="w-4 h-4 text-blue-400" /> Edit member</h3>
        <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center"><X className="w-3.5 h-3.5 text-gray-400" /></button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">{error}</div>}

      <div>
        <label className="block text-[11px] text-gray-400 mb-1 font-medium">Name</label>
        <input className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div>
        <label className="block text-[11px] text-gray-400 mb-1 font-medium">Team</label>
        <div className="relative">
          <select className="w-full appearance-none p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500 pr-8"
            value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))}>
            <option value="" className="bg-zinc-950">— None —</option>
            {teamNames.map(t => <option key={t} value={t} className="bg-zinc-950">{t}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>
      </div>
      <div>
        <label className="block text-[11px] text-gray-400 mb-1 font-medium">Designation</label>
        <input className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500"
          placeholder="e.g. Web Dev Lead" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="text-xs text-gray-400 px-3 py-1.5 hover:text-gray-200">Cancel</button>
        <button onClick={submit} disabled={submitting}
          className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-xl text-white disabled:opacity-50 transition-colors">
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Team-Leader permission panel ─────────────────────────────────────────────
// Grants / revokes the existing restricted features. Reuses PATCH setPermissions.
function PermissionPanel({ member, onClose, onDone, actor }: { member: any; onClose: () => void; onDone: () => void; actor: { id: string; role: string } }) {
  const initial = new Set<string>((member.permissions || []).filter((p: string) => TL_PERMISSIONS.some(t => t.key === p)));
  const [granted, setGranted] = useState<Set<string>>(initial);
  const [isLeader, setIsLeader] = useState(member.role === 'TeamLeader');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggle = (key: string) => {
    setGranted(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorRole: actor.role, actorId: actor.id,
          id: member._id, action: 'setPermissions',
          permissions: isLeader ? Array.from(granted) : [],
          makeLeader: isLeader && member.role !== 'TeamLeader',
          revoke: !isLeader && member.role === 'TeamLeader',
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Update failed.'); return; }
      onDone(); onClose();
    } catch { setError('Could not reach the server. Try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalShell onClose={onClose} wide>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400" /> Team-Leader permissions</h3>
        <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center"><X className="w-3.5 h-3.5 text-gray-400" /></button>
      </div>

      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <Avatar src={member.profileImage} name={member.name} color={(ROLE_META[member.role] || ROLE_META.TeamMember).color} size={36} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-100 truncate">{member.name}</p>
          <p className="text-[11px] text-gray-500 truncate">{member.team || 'No team'} · {member.role}</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">{error}</div>}

      {/* Team Leader toggle */}
      <button
        onClick={() => setIsLeader(v => !v)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
          isLeader ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.03] border-white/10'
        }`}
      >
        <span className="flex items-center gap-2 text-xs font-bold text-white"><Award className="w-3.5 h-3.5 text-emerald-400" /> Team Leader role</span>
        <span className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-all ${isLeader ? 'bg-emerald-500 justify-end' : 'bg-white/10 justify-start'}`}>
          <span className="w-4 h-4 rounded-full bg-white" />
        </span>
      </button>

      {/* Restricted features */}
      <div className={`space-y-2 transition-opacity ${isLeader ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Restricted features</p>
        {TL_PERMISSIONS.map(perm => {
          const on = granted.has(perm.key);
          return (
            <button key={perm.key} onClick={() => toggle(perm.key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
                on ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/[0.02] border-white/[0.06]'
              }`}>
              <span className="flex items-center gap-2 text-xs text-gray-200">
                {on ? <CheckCircle className="w-3.5 h-3.5 text-blue-400" /> : <Lock className="w-3.5 h-3.5 text-gray-500" />}
                {perm.label}
              </span>
              <span className={`text-[10px] font-bold ${on ? 'text-blue-400' : 'text-gray-600'}`}>{on ? 'Unlocked' : 'Locked'}</span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="text-xs text-gray-400 px-3 py-1.5 hover:text-gray-200">Cancel</button>
        <button onClick={submit} disabled={submitting}
          className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 rounded-xl text-white disabled:opacity-50 transition-colors">
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {submitting ? 'Saving…' : 'Save permissions'}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Create team modal ────────────────────────────────────────────────────────
function CreateTeamModal({ onClose, onDone, actor }: { onClose: () => void; onDone: () => void; actor: { id: string; role: string } }) {
  const [form, setForm] = useState({ name: '', description: '', coverImage: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.name.trim()) { setError('Team name is required.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: actor.role, actorId: actor.id, ...form, name: form.name.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Could not create team.'); return; }
      onDone(); onClose();
    } catch { setError('Could not reach the server. Team was not created.'); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalShell onClose={onClose} wide>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><FolderPlus className="w-4 h-4 text-emerald-400" /> Create new team</h3>
        <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center"><X className="w-3.5 h-3.5 text-gray-400" /></button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">{error}</div>}

      <div>
        <label className="block text-[11px] text-gray-400 mb-1.5 font-medium">Team name</label>
        <input autoFocus type="text" placeholder="e.g. AI/ML Team" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-500" />
      </div>
      <div>
        <label className="block text-[11px] text-gray-400 mb-1.5 font-medium">Description</label>
        <textarea placeholder="What does this team work on?" value={form.description} rows={3}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-500 resize-none" />
      </div>
      <div>
        <label className="block text-[11px] text-gray-400 mb-1.5 font-medium flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Cover image URL</label>
        <input type="text" placeholder="https://…" value={form.coverImage}
          onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
          className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-500" />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="text-xs text-gray-400 px-3 py-1.5 hover:text-gray-200">Cancel</button>
        <button onClick={submit} disabled={submitting}
          className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 rounded-xl text-white disabled:opacity-50 transition-colors">
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {submitting ? 'Creating…' : 'Create team'}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Edit team modal (name / description / cover / leader / status / delete) ──
function EditTeamModal({ team, teamMembers, onClose, onDone, actor }: { team: any; teamMembers: any[]; onClose: () => void; onDone: () => void; actor: { id: string; role: string } }) {
  const [form, setForm] = useState({
    name: team.name || '',
    description: team.description || '',
    coverImage: team.coverImage || '',
    lead: team.lead?._id || '',
    isActive: team.isActive !== false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!form.name.trim()) { setError('Team name is required.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: actor.role, actorId: actor.id, id: team._id, ...form, name: form.name.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Update failed.'); return; }
      onDone(); onClose();
    } catch { setError('Could not reach the server. Try again.'); }
    finally { setSubmitting(false); }
  };

  const remove = async () => {
    if (!confirm(`Delete team "${team.name}"? This only works if no members remain.`)) return;
    setDeleting(true); setError('');
    try {
      const res = await fetch(`/api/admin/teams?id=${team._id}&actorRole=${encodeURIComponent(actor.role)}&actorId=${encodeURIComponent(actor.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Delete failed.'); return; }
      onDone(); onClose();
    } catch { setError('Could not reach the server. Nothing was deleted.'); }
    finally { setDeleting(false); }
  };

  return (
    <ModalShell onClose={onClose} wide>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Settings2 className="w-4 h-4 text-blue-400" /> Edit team</h3>
        <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center"><X className="w-3.5 h-3.5 text-gray-400" /></button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">{error}</div>}

      {/* Cover preview + controls */}
      <div>
        <label className="block text-[11px] text-gray-400 mb-1.5 font-medium flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Cover image</label>
        <div className="h-24 rounded-lg overflow-hidden border border-white/10 bg-gradient-to-br from-blue-500/20 to-indigo-500/10 flex items-center justify-center mb-2">
          {form.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.coverImage} alt={form.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-white/30" />
          )}
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="Paste cover image URL to upload / replace" value={form.coverImage}
            onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
            className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500" />
          {form.coverImage && (
            <button onClick={() => setForm(f => ({ ...f, coverImage: '' }))} title="Delete cover"
              className="px-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-gray-400 mb-1 font-medium">Team name</label>
        <input className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div>
        <label className="block text-[11px] text-gray-400 mb-1 font-medium">Description</label>
        <textarea rows={2} className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500 resize-none"
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div>
        <label className="block text-[11px] text-gray-400 mb-1 font-medium">Team leader</label>
        <div className="relative">
          <select className="w-full appearance-none p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500 pr-8"
            value={form.lead} onChange={e => setForm(f => ({ ...f, lead: e.target.value }))}>
            <option value="" className="bg-zinc-950">— None —</option>
            {teamMembers.map(m => <option key={m._id} value={m._id} className="bg-zinc-950">{m.name} ({m.role})</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        </div>
      </div>

      <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
          form.isActive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'
        }`}>
        <span className="flex items-center gap-2 text-xs font-bold text-white"><Power className="w-3.5 h-3.5" /> Team status</span>
        <span className={`text-[11px] font-bold ${form.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>{form.isActive ? 'Active' : 'Inactive'}</span>
      </button>

      <div className="flex justify-between items-center gap-2 pt-1">
        <button onClick={remove} disabled={deleting}
          className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-xl hover:bg-rose-500/10 disabled:opacity-50">
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete team
        </button>
        <div className="flex gap-2">
          <button onClick={onClose} className="text-xs text-gray-400 px-3 py-1.5 hover:text-gray-200">Cancel</button>
          <button onClick={save} disabled={submitting}
            className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-xl text-white disabled:opacity-50 transition-colors">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Add member modal ─────────────────────────────────────────────────────────
function AddMemberModal({ onClose, onDone, teamNames, defaultTeam }: { onClose: () => void; onDone: () => void; teamNames: string[]; defaultTeam: string }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'TeamMember', team: defaultTeam });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.name || !form.email || !form.password) { setError('Name, email and password are required.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Failed to create member.'); return; }
      onDone(); onClose();
    } catch { setError('Could not reach the server. The member was not created.'); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalShell onClose={onClose} wide>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><UserPlus className="w-4 h-4 text-blue-400" /> Add new member</h3>
        <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center"><X className="w-3.5 h-3.5 text-gray-400" /></button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">{error}</div>}

      <form onSubmit={e => e.preventDefault()} autoComplete="off" className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full name</label>
          <input type="text" placeholder="Enter full name" value={form.name} autoComplete="new-unique-name"
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
          <input type="email" placeholder="name@domain.com" value={form.email} autoComplete="new-unique-email"
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
          <input type="password" placeholder="••••••••" value={form.password} autoComplete="new-password"
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer">
              {PROMOTABLE_ROLES.map(r => <option key={r} value={r} className="bg-zinc-950">{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Team</label>
            <select value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
              className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer">
              <option value="" className="bg-zinc-950">— None —</option>
              {teamNames.map(t => <option key={t} value={t} className="bg-zinc-950">{t}</option>)}
            </select>
          </div>
        </div>

        <button type="button" onClick={submit} disabled={submitting}
          className="w-full mt-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-md transition-all border border-blue-400/20 disabled:opacity-50 flex items-center justify-center gap-1.5">
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {submitting ? 'Creating…' : 'Create member'}
        </button>
      </form>
    </ModalShell>
  );
}

// ─── Team card ────────────────────────────────────────────────────────────────
function TeamCard({ team, onOpen, index }: { team: any; onOpen: () => void; index: number }) {
  const stat = (Icon: any, label: string, value: number | string) => (
    <div className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-sm font-black text-white leading-none">{value}</span>
      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
    </div>
  );

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }} onClick={onOpen}
      className="text-left bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl hover:border-white/15 transition-all group flex flex-col"
    >
      {/* Cover */}
      <div className="relative h-28 bg-gradient-to-br from-blue-500/25 via-indigo-500/15 to-purple-500/10 overflow-hidden">
        {team.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={team.coverImage} alt={team.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-8 h-8 text-white/20" />
          </div>
        )}
        <div className="absolute top-2 right-2"><StatusBadge active={team.isActive !== false} /></div>
        <div className="absolute bottom-2 left-3 text-[9px] font-medium text-white/70 flex items-center gap-1">
          <Calendar className="w-2.5 h-2.5" /> {fmtDate(team.createdAt)}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-black text-white truncate">{team.name}</h3>
          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 min-h-[28px]">{team.description || 'No description provided.'}</p>
        </div>

        {/* Leader */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          {team.lead ? (
            <>
              <Avatar src={team.lead.profileImage} name={team.lead.name} color="#34d399" size={24} />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-200 truncate leading-tight">{team.lead.name}</p>
                <p className="text-[9px] text-emerald-400 font-semibold">Team Leader</p>
              </div>
            </>
          ) : (
            <span className="text-[10px] text-slate-500 flex items-center gap-1.5"><Award className="w-3 h-3" /> No leader assigned</span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1.5">
          {stat(Users, 'Members', team.totalMembers ?? 0)}
          {stat(UserCheck, 'Active', team.activeMembers ?? 0)}
          {stat(FolderOpen, 'Resources', team.resources ?? 0)}
          {stat(FileText, 'Blogs', team.blogs ?? 0)}
          {stat(Calendar, 'Events', team.events ?? 0)}
          <div className="flex items-center justify-center py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/10 text-blue-400 text-[10px] font-bold gap-1 group-hover:bg-blue-500/10 transition-colors">
            Open <ArrowUpCircle className="w-3 h-3 rotate-45" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Member row ───────────────────────────────────────────────────────────────
function MemberRow({ member, actor, canManageMembers, canManageRoles, busyId, onToggle, onDelete, onEdit, onPromote, onPermissions }: any) {
  const meta = ROLE_META[member.role] || ROLE_META.TeamMember;
  const RankIcon = meta.Icon;
  const isSelf = member._id === actor.id;
  const isBusy = busyId === member._id;
  const active = member.status !== 'inactive';
  const canLeaderPerms = canManageMembers && ['TeamLeader', 'TeamMember'].includes(member.role);

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="border p-4 rounded-xl grid grid-cols-1 lg:grid-cols-12 gap-4 items-start lg:items-center relative overflow-hidden px-5 lg:px-6 bg-white/[0.01]"
      style={{ borderColor: `${meta.color}25` }}>
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: meta.color }} />

      {/* Identity */}
      <div className="col-span-1 lg:col-span-4 flex items-center gap-3 min-w-0">
        <Avatar src={member.profileImage} name={member.name} color={meta.color} size={40} />
        <div className="min-w-0 truncate">
          <h4 className="font-bold text-sm text-white flex items-center gap-1.5 truncate">
            {member.name}
            {isSelf && <span className="text-[9px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded-full font-medium">You</span>}
          </h4>
          <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
            <Mail className="w-3 h-3 text-slate-600 flex-shrink-0" /> {member.email}
          </span>
        </div>
      </div>

      {/* Role + designation */}
      <div className="col-span-1 lg:col-span-3 flex flex-col">
        <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: meta.color }}>
          <RankIcon className="w-3.5 h-3.5 flex-shrink-0" /> {member.role}
        </span>
        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
          <Briefcase className="w-3 h-3 flex-shrink-0" /> {member.designation || '—'}
        </span>
      </div>

      {/* Status + joined */}
      <div className="col-span-1 lg:col-span-3 flex flex-col gap-1">
        <button onClick={() => onToggle(member)} disabled={!canManageMembers || isSelf || isBusy}
          title={isSelf ? "You can't change your own status" : canManageMembers ? 'Click to toggle' : 'No permission'}
          className={`text-xs font-bold flex items-center gap-1 w-fit ${active ? 'text-emerald-400' : 'text-rose-400'} ${
            canManageMembers && !isSelf ? 'hover:opacity-70 cursor-pointer' : 'cursor-default opacity-80'
          }`}>
          {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {member.status || 'active'}
        </button>
        <span className="text-[11px] text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(member.createdAt)}</span>
      </div>

      {/* Actions */}
      <div className="col-span-1 lg:col-span-2 flex items-center justify-start lg:justify-end gap-1 border-t lg:border-t-0 border-white/5 pt-3 lg:pt-0">
        {canLeaderPerms && (
          <button onClick={() => onPermissions(member)} title="Team-Leader permissions"
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-all">
            <Shield className="w-3.5 h-3.5" />
          </button>
        )}
        {canManageRoles && (
          <button onClick={() => onPromote(member)} title="Change role"
            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-all">
            <ArrowUpCircle className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={() => canManageMembers && onEdit(member)} disabled={!canManageMembers}
          title={canManageMembers ? 'Edit' : 'No permission'}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(member)} disabled={!canManageMembers || isSelf || isBusy}
          title={isSelf ? "You can't delete yourself" : canManageMembers ? 'Delete' : 'No permission'}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminMembers() {
  const { actor } = useCurrentUser();
  const canManageMembers = MEMBER_MANAGERS.includes(actor.role);
  const canManageRoles = ROLE_MANAGERS.includes(actor.role);

  const [teams, setTeams] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedKey, setSelectedKey] = useState<string | null>(null); // null → teams grid
  const [teamSearch, setTeamSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(8);

  // modals
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [promoting, setPromoting] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [permMember, setPermMember] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        fetch('/api/admin/teams').then(r => r.json()),
        fetch('/api/admin/members').then(r => r.json()),
      ]);
      if (tRes.success) setTeams(tRes.teams || []);
      if (mRes.success) setMembers(mRes.members || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const realTeamNames = useMemo(() => new Set(teams.map(t => t.name)), [teams]);

  // Team cards = real teams + synthetic buckets so NO member ever disappears.
  const displayTeams = useMemo(() => {
    const real = teams.map(t => ({ ...t, _key: t.name, synthetic: false }));

    const buckets: Record<string, any[]> = {};
    members.forEach(m => {
      const k = teamKeyOf(m);
      if (k !== UNASSIGNED_KEY && realTeamNames.has(k)) return; // already a real card
      (buckets[k] ||= []).push(m);
    });

    const synthetic = Object.entries(buckets).map(([k, ms]) => ({
      _id: `synthetic-${k}`,
      _key: k,
      synthetic: true,
      name: k === UNASSIGNED_KEY ? 'Unassigned' : k,
      description: k === UNASSIGNED_KEY
        ? 'Members not yet assigned to a managed team.'
        : 'Ad-hoc group derived from member records.',
      coverImage: '',
      isActive: true,
      createdAt: null,
      lead: null,
      totalMembers: ms.length,
      activeMembers: ms.filter(x => x.status === 'active').length,
      blogs: 0, events: 0, resources: 0,
    }));

    return [...real, ...synthetic];
  }, [teams, members, realTeamNames]);

  const filteredTeams = useMemo(() => {
    const q = teamSearch.toLowerCase();
    if (!q) return displayTeams;
    return displayTeams.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.lead?.name || '').toLowerCase().includes(q)
    );
  }, [displayTeams, teamSearch]);

  const selectedTeam = useMemo(() => displayTeams.find(t => t._key === selectedKey) || null, [displayTeams, selectedKey]);

  const teamMembers = useMemo(() => {
    if (!selectedTeam) return [];
    return members.filter(m => teamKeyOf(m) === selectedTeam._key);
  }, [members, selectedTeam]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.toLowerCase();
    return teamMembers.filter(m => {
      const matchesSearch = !q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'All' || m.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [teamMembers, memberSearch, roleFilter]);

  const visibleMembers = useMemo(() => {
    if (memberSearch || roleFilter !== 'All') return filteredMembers;
    return filteredMembers.slice(0, visibleCount);
  }, [filteredMembers, visibleCount, memberSearch, roleFilter]);

  const teamNames = useMemo(() => teams.map(t => t.name), [teams]);

  const openTeam = (key: string) => {
    setSelectedKey(key);
    setMemberSearch(''); setRoleFilter('All'); setVisibleCount(8);
  };
  const backToTeams = () => setSelectedKey(null);

  const summary = useMemo(() => ({
    teams: teams.length,
    members: members.length,
    active: members.filter(m => m.status === 'active').length,
  }), [teams, members]);

  const handleToggleStatus = useCallback(async (member: any) => {
    if (!canManageMembers) return;
    setBusyId(member._id);
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: actor.role, actorId: actor.id, id: member._id, action: 'toggleStatus' }),
      });
      const data = await res.json();
      if (!data.success) { alert(data.message || 'Update failed.'); return; }
      await fetchAll();
    } catch { alert('Could not reach the server.'); }
    finally { setBusyId(null); }
  }, [canManageMembers, actor, fetchAll]);

  const handleDelete = useCallback(async (member: any) => {
    if (!canManageMembers) return;
    if (!confirm(`Remove ${member.name} permanently? This can't be undone.`)) return;
    setBusyId(member._id);
    try {
      const res = await fetch(`/api/admin/members?id=${member._id}&actorRole=${encodeURIComponent(actor.role)}&actorId=${encodeURIComponent(actor.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) { alert(data.message || 'Delete failed.'); return; }
      await fetchAll();
    } catch { alert('Could not reach the server. Nothing was deleted.'); }
    finally { setBusyId(null); }
  }, [canManageMembers, actor, fetchAll]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-8 min-h-screen text-slate-200">

      {/* Modals */}
      <AnimatePresence>
        {promoting && <PromoteModal member={promoting} actor={actor} onClose={() => setPromoting(null)} onDone={fetchAll} />}
        {editing && <EditMemberModal member={editing} actor={actor} teamNames={teamNames} onClose={() => setEditing(null)} onDone={fetchAll} />}
        {permMember && <PermissionPanel member={permMember} actor={actor} onClose={() => setPermMember(null)} onDone={fetchAll} />}
        {showCreateTeam && <CreateTeamModal actor={actor} onClose={() => setShowCreateTeam(false)} onDone={fetchAll} />}
        {showEditTeam && selectedTeam && !selectedTeam.synthetic && (
          <EditTeamModal team={selectedTeam} teamMembers={teamMembers} actor={actor} onClose={() => setShowEditTeam(false)} onDone={fetchAll} />
        )}
        {showAddMember && (
          <AddMemberModal teamNames={teamNames} defaultTeam={selectedTeam && !selectedTeam.synthetic ? selectedTeam.name : ''}
            onClose={() => setShowAddMember(false)} onDone={fetchAll} />
        )}
      </AnimatePresence>

      {loading ? (
        <div className="p-16 text-center flex flex-col items-center justify-center gap-2 bg-white/[0.01] border border-white/5 rounded-xl">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs text-slate-400">Loading teams…</span>
        </div>
      ) : !selectedTeam ? (
        // ═══════════════ DEFAULT VIEW — TEAM CARDS ONLY ═══════════════
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-xl">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">Teams</h1>
              <p className="text-xs text-slate-400 mt-1">Pick a team to manage its members, leader and permissions.</p>
            </div>
            {canManageMembers ? (
              <div className="flex items-center gap-3 flex-wrap">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowCreateTeam(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg border border-emerald-500/20">
                  <FolderPlus className="w-4 h-4" /> Create team
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg border border-blue-500/20">
                  <UserPlus className="w-4 h-4" /> Add member
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
                <Lock className="w-3.5 h-3.5" /> View only
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { title: 'Teams', count: summary.teams, Icon: Building2, color: '#60a5fa' },
              { title: 'Members', count: summary.members, Icon: Users, color: '#34d399' },
              { title: 'Active', count: summary.active, Icon: UserCheck, color: '#a78bfa' },
            ].map(c => (
              <div key={c.title} className="bg-white/[0.01] border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{c.title}</span>
                  <h3 className="text-2xl font-black text-white mt-0.5">{c.count}</h3>
                </div>
                <div className="p-2 rounded-lg bg-white/5" style={{ color: c.color }}><c.Icon className="w-5 h-5" /></div>
              </div>
            ))}
          </div>

          {/* Team search */}
          <div className="relative w-full md:w-96 group">
            <input type="text" placeholder="Search teams by name, description or leader…" value={teamSearch}
              onChange={e => setTeamSearch(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/5 rounded-lg py-2.5 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/40" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400" />
          </div>

          {/* Cards */}
          {filteredTeams.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white/[0.01] border border-white/5 rounded-xl">
              No teams match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTeams.map((team, i) => (
                <TeamCard key={team._key} team={team} index={i} onOpen={() => openTeam(team._key)} />
              ))}
            </div>
          )}
        </>
      ) : (
        // ═══════════════ TEAM DETAILS ═══════════════
        <>
          <button onClick={backToTeams}
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 px-4 py-2 rounded-xl transition-all w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Teams
          </button>

          {/* Team header */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
            <div className="relative h-36 bg-gradient-to-br from-blue-500/25 via-indigo-500/15 to-purple-500/10">
              {selectedTeam.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedTeam.coverImage} alt={selectedTeam.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Users className="w-10 h-10 text-white/20" /></div>
              )}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <StatusBadge active={selectedTeam.isActive !== false} />
                {canManageMembers && !selectedTeam.synthetic && (
                  <button onClick={() => setShowEditTeam(true)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-black/40 hover:bg-black/60 border border-white/20 px-3 py-1.5 rounded-lg backdrop-blur">
                    <Settings2 className="w-3.5 h-3.5" /> Edit team
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-black text-white flex items-center gap-2">{selectedTeam.name}</h1>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">{selectedTeam.description || 'No description provided.'}</p>
                <div className="flex items-center gap-2 mt-3">
                  {selectedTeam.lead ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Avatar src={selectedTeam.lead.profileImage} name={selectedTeam.lead.name} color="#34d399" size={22} />
                      <span className="text-[11px] font-bold text-emerald-300">{selectedTeam.lead.name}</span>
                      <span className="text-[9px] text-emerald-500/80 font-semibold uppercase">Leader</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> No leader assigned</span>
                  )}
                  <span className="text-[11px] text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Created {fmtDate(selectedTeam.createdAt)}</span>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-5 gap-2 shrink-0">
                {[
                  { Icon: Users, label: 'Total', value: selectedTeam.totalMembers ?? teamMembers.length },
                  { Icon: UserCheck, label: 'Active', value: selectedTeam.activeMembers ?? teamMembers.filter(m => m.status === 'active').length },
                  { Icon: FolderOpen, label: 'Resources', value: selectedTeam.resources ?? 0 },
                  { Icon: FileText, label: 'Blogs', value: selectedTeam.blogs ?? 0 },
                  { Icon: Calendar, label: 'Events', value: selectedTeam.events ?? 0 },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] min-w-[58px]">
                    <s.Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-lg font-black text-white leading-none">{s.value}</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Member controls */}
          <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-black text-white flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Members
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{teamMembers.length}</span>
              </h2>
              {canManageMembers && (
                <button onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                  <UserPlus className="w-3.5 h-3.5" /> Add member
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 group">
                <input type="text" placeholder="Search members…" value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/40" />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400" />
              </div>
              <div className="relative">
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                  className="appearance-none bg-slate-950/40 border border-white/5 rounded-lg py-2.5 pl-3 pr-8 text-xs text-white font-bold focus:outline-none focus:border-blue-500/40 cursor-pointer">
                  <option value="All" className="bg-slate-950">All roles</option>
                  {ALL_ROLES.map(r => <option key={r} value={r} className="bg-slate-950">{r}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Member list */}
          <div className="space-y-3">
            {filteredMembers.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 bg-white/[0.01] border border-white/5 rounded-xl">
                No members match your search or filter.
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {visibleMembers.map(member => (
                  <MemberRow key={member._id} member={member} actor={actor}
                    canManageMembers={canManageMembers} canManageRoles={canManageRoles} busyId={busyId}
                    onToggle={handleToggleStatus} onDelete={handleDelete}
                    onEdit={setEditing} onPromote={setPromoting} onPermissions={setPermMember} />
                ))}
              </AnimatePresence>
            )}

            {!memberSearch && roleFilter === 'All' && filteredMembers.length > 8 && (
              <div className="flex justify-center pt-2">
                {visibleCount < filteredMembers.length ? (
                  <button onClick={() => setVisibleCount(c => c + 8)}
                    className="flex items-center gap-1.5 px-5 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300 transition-all border border-white/10">
                    See more <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button onClick={() => setVisibleCount(8)}
                    className="flex items-center gap-1.5 px-5 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300 transition-all border border-white/10">
                    See less <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
