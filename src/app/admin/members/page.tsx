'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Search, Edit2, Trash2, CheckCircle, XCircle, UserPlus, Loader2,
  Crown, ShieldCheck, Mail, Briefcase, ChevronDown, GraduationCap,
  Layers, ShieldAlert, Award, ArrowUpCircle, X, Check, Lock, Power,
  Users, FolderPlus, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Roles permitted to promote/demote/delete/edit members — mirrors the API guard.
const MEMBER_MANAGERS = ['Admin', 'President'];

// ── Replace with your real auth/session hook. Hardcoded here as a clear placeholder. ──
function useCurrentUser(): { id: string; role: string } {
  // e.g. const { data } = useSession(); return { id: data.user.id, role: data.user.role };
  return { id: 'placeholder-current-user-id', role: 'Admin' };
}

const ROLE_ORDER = ['Admin', 'PI', 'President', 'OfficeBearer', 'TeamLeader', 'TeamMember', 'Alumni'];

const ROLE_META: Record<string, { Icon: any; color: string }> = {
  Admin:        { Icon: ShieldAlert, color: '#f87171' },
  PI:           { Icon: ShieldAlert, color: '#a78bfa' },
  President:    { Icon: Crown,       color: '#fbbf24' },
  OfficeBearer: { Icon: ShieldCheck, color: '#60a5fa' },
  TeamLeader:   { Icon: Award,       color: '#34d399' },
  TeamMember:   { Icon: Award,       color: '#9ca3af' },
  Alumni:       { Icon: GraduationCap, color: '#06b6d4' },
};

// ─── Category Groups (NEW) ──────────────────────────────────────────────────────
// "Active Tesla Members" = the working club body (President, OfficeBearer, TeamLeader, TeamMember)
// "PI" = institutional authority (PI + Admin, since Admin also handles the club)
// "Alumni" = past members
const CATEGORY_GROUPS: Record<string, { label: string; roles: string[]; Icon: any; color: string; gradient: string }> = {
  tesla: {
    label: 'Active Tesla Members',
    roles: ['President', 'OfficeBearer', 'TeamLeader', 'TeamMember'],
    Icon: Zap,
    color: '#34d399',
    gradient: 'from-emerald-500/15 to-emerald-500/0',
  },
  pi: {
    label: 'PI',
    roles: ['PI', 'Admin'],
    Icon: ShieldAlert,
    color: '#a78bfa',
    gradient: 'from-violet-500/15 to-violet-500/0',
  },
  alumni: {
    label: 'Alumni',
    roles: ['Alumni'],
    Icon: GraduationCap,
    color: '#06b6d4',
    gradient: 'from-cyan-500/15 to-cyan-500/0',
  },
};

type CategoryKey = keyof typeof CATEGORY_GROUPS;

// ─── Promote Modal ──────────────────────────────────────────────────────────────
function PromoteModal({
  member, onClose, onDone, actor,
}: { member: any; onClose: () => void; onDone: () => void; actor: { id: string; role: string } }) {
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
        body: JSON.stringify({
          actorRole: actor.role, actorId: actor.id,
          id: member._id, action: 'updateRole', role,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Update failed.'); return; }
      onDone(); onClose();
    } catch { setError('Could not reach the server. Try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-blue-400" /> Change role
            </h3>
            <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {member.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-100 truncate">{member.name}</p>
              <p className="text-[11px] text-gray-500 truncate">Currently {member.role}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">{error}</div>
          )}

          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 font-medium">New role</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 pr-8"
                value={role} onChange={e => setRole(e.target.value)}
              >
                {ROLE_ORDER.map(r => <option key={r} value={r} className="bg-zinc-950">{r}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="text-xs text-gray-400 px-3 py-1.5 hover:text-gray-200">Cancel</button>
            <button
              onClick={submit} disabled={submitting}
              className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-xl text-white disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {submitting ? 'Saving…' : 'Confirm change'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Edit Modal ─────────────────────────────────────────────────────────────────
function EditModal({
  member, onClose, onDone, actor, teams,
}: { member: any; onClose: () => void; onDone: () => void; actor: { id: string; role: string }; teams: string[] }) {
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
        body: JSON.stringify({
          actorRole: actor.role, actorId: actor.id,
          id: member._id, action: 'updateDetails', ...form,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Update failed.'); return; }
      onDone(); onClose();
    } catch { setError('Could not reach the server. Try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-400" /> Edit member
            </h3>
            <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">{error}</div>}

          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-medium">Name</label>
            <input
              className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-medium">Team</label>
            <div className="relative">
              <select
                className="w-full appearance-none p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500 pr-8"
                value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
              >
                <option value="" className="bg-zinc-950">— None —</option>
                {teams.map(t => <option key={t} value={t} className="bg-zinc-950">{t}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-medium">Designation</label>
            <input
              className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-500"
              placeholder="e.g. Web Dev Lead"
              value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="text-xs text-gray-400 px-3 py-1.5 hover:text-gray-200">Cancel</button>
            <button
              onClick={submit} disabled={submitting}
              className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded-xl text-white disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Create Team Modal (NEW) ─────────────────────────────────────────────────────
// Lets an Admin/President manually create a new team — name + description.
// Hits POST /api/admin/teams (mirror the shape of the members endpoint).
function CreateTeamModal({
  onClose, onDone, actor,
}: { onClose: () => void; onDone: (teamName: string) => void; actor: { id: string; role: string } }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim()) { setError('Team name is required.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorRole: actor.role, actorId: actor.id,
          name: name.trim(), description: description.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Could not create team.'); return; }
      onDone(name.trim());
      onClose();
    } catch {
      setError('Could not reach the server. Team was not created.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-emerald-400" /> Create new team
            </h3>
            <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">{error}</div>
          )}

          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 font-medium">Team name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. AI/ML Team"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5 font-medium">Description</label>
            <textarea
              placeholder="What does this team work on?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="text-xs text-gray-400 px-3 py-1.5 hover:text-gray-200">Cancel</button>
            <button
              onClick={submit} disabled={submitting}
              className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 rounded-xl text-white disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {submitting ? 'Creating…' : 'Create team'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default function AdminMembers() {
  const actor = useCurrentUser();
  const canManage = MEMBER_MANAGERS.includes(actor.role);

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'All'>('All'); // NEW
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false); // NEW
  const [visibleCount, setVisibleCount] = useState(8);

  const [promoting, setPromoting] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null); // for status toggle / delete spinners

  const [existingTeams, setExistingTeams] = useState<string[]>([
    'Core Team', 'Project Team', 'Web Team', 'Blockchain Team', 'PR/Content Team', 'Design Team',
  ]);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'TeamMember', team: 'Core Team',
  });

  useEffect(() => {
    if (formData.role === 'PI') {
      setFormData(prev => ({ ...prev, team: 'Institutional Head / Faculty' }));
    } else if (formData.team === 'Institutional Head / Faculty') {
      setFormData(prev => ({ ...prev, team: 'Core Team' }));
    }
  }, [formData.role]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/members');
      const data = await res.json();
      if (data.success) setMembers(data.members);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // NEW: called after a team is created so the dropdowns immediately know about it.
  const handleTeamCreated = useCallback((teamName: string) => {
    setExistingTeams(prev => prev.includes(teamName) ? prev : [...prev, teamName]);
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.name?.toLowerCase().includes(search.toLowerCase()) ||
        member.email?.toLowerCase().includes(search.toLowerCase()) ||
        member.team?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = selectedRole === 'All' || member.role === selectedRole;
      // NEW: category filter (Tesla Members / PI / Alumni)
      const matchesCategory = activeCategory === 'All' || CATEGORY_GROUPS[activeCategory].roles.includes(member.role);
      return matchesSearch && matchesRole && matchesCategory;
    });
  }, [members, search, selectedRole, activeCategory]);

  const stats = useMemo(() => ({
    totalTeams: existingTeams.length,
    bearersCount: members.filter(m => m.role === 'OfficeBearer').length,
    alumniCount: members.filter(m => m.role === 'Alumni').length,
  }), [members, existingTeams]);

  // NEW: counts per category, shown as badges on the filter buttons
  const categoryCounts = useMemo(() => ({
    tesla:  members.filter(m => CATEGORY_GROUPS.tesla.roles.includes(m.role)).length,
    pi:     members.filter(m => CATEGORY_GROUPS.pi.roles.includes(m.role)).length,
    alumni: members.filter(m => CATEGORY_GROUPS.alumni.roles.includes(m.role)).length,
  }), [members]);

  const paginatedMembers = useMemo(() => {
    if (search !== '') return filteredMembers;
    return filteredMembers.slice(0, visibleCount);
  }, [filteredMembers, visibleCount, search]);

  const handleCreateMember = async () => {
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || 'Failed to create member'); return; }
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'TeamMember', team: 'Core Team' });
      await fetchMembers();
    } catch (error) {
      console.error(error);
      alert('Could not reach the server. The member was not created.');
    }
  };

  const handleToggleStatus = useCallback(async (member: any) => {
    if (!canManage) return;
    setBusyId(member._id);
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: actor.role, actorId: actor.id, id: member._id, action: 'toggleStatus' }),
      });
      const data = await res.json();
      if (!data.success) { alert(data.message || 'Update failed.'); return; }
      await fetchMembers();
    } catch { alert('Could not reach the server.'); }
    finally { setBusyId(null); }
  }, [canManage, actor, fetchMembers]);

  const handleDelete = useCallback(async (member: any) => {
    if (!canManage) return;
    if (!confirm(`Remove ${member.name} permanently? This can't be undone.`)) return;
    setBusyId(member._id);
    try {
      const res = await fetch(`/api/admin/members?id=${member._id}&actorRole=${encodeURIComponent(actor.role)}&actorId=${encodeURIComponent(actor.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) { alert(data.message || 'Delete failed.'); return; }
      setMembers(prev => prev.filter(m => m._id !== member._id));
    } catch { alert('Could not reach the server. Nothing was deleted.'); }
    finally { setBusyId(null); }
  }, [canManage, actor]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8 min-h-screen text-slate-200">

      <AnimatePresence>
        {promoting && (
          <PromoteModal member={promoting} actor={actor} onClose={() => setPromoting(null)} onDone={fetchMembers} />
        )}
        {editing && (
          <EditModal member={editing} actor={actor} teams={existingTeams} onClose={() => setEditing(null)} onDone={fetchMembers} />
        )}
        {showTeamModal && (
          <CreateTeamModal actor={actor} onClose={() => setShowTeamModal(false)} onDone={handleTeamCreated} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Member Management</h1>
          <p className="text-xs text-slate-400 mt-1">Manage club members, roles, and team assignments.</p>
        </div>

        {canManage ? (
          <div className="flex items-center gap-3 flex-wrap">
            {/* NEW: Create Team button */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowTeamModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg border border-emerald-500/20"
            >
              <FolderPlus className="w-4 h-4" /> Create new team
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg border border-blue-500/20"
            >
              <UserPlus className="w-4 h-4" /> Add member
            </motion.button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
            <Lock className="w-3.5 h-3.5" /> View only — Admin/President can manage members
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { title: 'Active Teams', count: stats.totalTeams, icon: Layers, color: 'border-cyan-500/10 text-cyan-400' },
          { title: 'Office Bearers', count: stats.bearersCount, icon: ShieldCheck, color: 'border-blue-500/10 text-blue-400' },
          { title: 'Alumni', count: stats.alumniCount, icon: GraduationCap, color: 'border-emerald-500/10 text-emerald-400' },
        ].map((card, i) => (
          <motion.div
            key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-white/[0.01] border ${card.color.split(' ')[0]} p-5 rounded-xl flex items-center justify-between shadow-sm`}
          >
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{card.title}</span>
              <h3 className="text-3xl font-black text-white mt-1">{loading ? '...' : card.count}</h3>
            </div>
            <div className={`p-2.5 rounded-lg bg-white/5 ${card.color.split(' ')[1]}`}>
              <card.icon className="w-5 h-5" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* NEW: Category Switcher — Active Tesla Members / PI / Alumni */}
      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-2 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => setActiveCategory('All')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeCategory === 'All'
              ? 'bg-white/10 text-white shadow-inner'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> All members
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{members.length}</span>
        </button>

        {(Object.keys(CATEGORY_GROUPS) as CategoryKey[]).map((key) => {
          const group = CATEGORY_GROUPS[key];
          const Icon = group.Icon;
          const isActive = activeCategory === key;
          return (
            <motion.button
              key={key}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={() => setActiveCategory(key)}
              className={`flex-1 relative flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs font-bold transition-all duration-200 border overflow-hidden ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/[0.03]'
              }`}
              style={{
                borderColor: isActive ? `${group.color}50` : 'transparent',
                background: isActive ? `linear-gradient(135deg, ${group.color}25, ${group.color}05)` : undefined,
              }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: isActive ? group.color : undefined }} />
              {group.label}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: `${group.color}25`, color: group.color }}
              >
                {categoryCounts[key as keyof typeof categoryCounts]}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4 items-center">
        <div className="relative w-full md:w-80 group">
          <input
            type="text" placeholder="Search by name, email, team…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/40 border border-white/5 rounded-lg py-2.5 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/40 transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400" />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 border border-white/5 px-3 py-2 rounded-lg w-full md:w-auto justify-between">
          <span className="font-bold uppercase tracking-wider text-slate-500">Role:</span>
          <select
            value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs ml-2"
          >
            <option value="All" className="bg-slate-950">All roles</option>
            {ROLE_ORDER.map(r => <option key={r} value={r} className="bg-slate-950">{r}</option>)}
          </select>
        </div>
      </div>

      {/* Column headers */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-9 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        <div className="col-span-4">Identity</div>
        <div className="col-span-2">Role</div>
        <div className="col-span-2">Team</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2 text-right pr-6">Actions</div>
      </div>

      {/* Member rows */}
      <div className="space-y-3">
        {loading && (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-2 bg-white/[0.01] border border-white/5 rounded-xl">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400">Loading members…</span>
          </div>
        )}

        {!loading && paginatedMembers.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-500 bg-white/[0.01] border border-white/5 rounded-xl">
            No members match your search or filter.
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {!loading && paginatedMembers.map((member) => {
            const meta = ROLE_META[member.role] || ROLE_META.TeamMember;
            const RankIcon = meta.Icon;
            const isSelf = member._id === actor.id;
            const isBusy = busyId === member._id;

            return (
              <motion.div
                layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                key={member._id}
                className="border p-4 rounded-xl grid grid-cols-1 lg:grid-cols-12 gap-4 items-start lg:items-center transition-all duration-200 relative overflow-hidden px-5 lg:px-8 border-white/5 bg-white/[0.01]"
                style={{ borderColor: `${meta.color}30` }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: meta.color }} />

                {/* Identity */}
                <div className="col-span-1 lg:col-span-4 flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-black text-sm shadow-inner"
                    style={{ background: `${meta.color}20`, color: meta.color }}>
                    {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                  </div>
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

                {/* Role */}
                <div className="col-span-1 lg:col-span-2 flex flex-col lg:block">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider lg:hidden mb-0.5">Role</span>
                  <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: meta.color }}>
                    <RankIcon className="w-3.5 h-3.5 flex-shrink-0" /> {member.role}
                  </span>
                </div>

                {/* Team */}
                <div className="col-span-1 lg:col-span-2 flex flex-col lg:block">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider lg:hidden mb-0.5">Team</span>
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-500 flex-shrink-0" /> {member.team || '—'}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-1 lg:col-span-2 flex flex-col lg:block">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider lg:hidden mb-0.5">Status</span>
                  <button
                    onClick={() => handleToggleStatus(member)}
                    disabled={!canManage || isSelf || isBusy}
                    title={isSelf ? "You can't change your own status" : canManage ? 'Click to toggle' : 'No permission'}
                    className={`text-xs font-bold flex items-center gap-1 transition-opacity ${
                      member.status === 'inactive' ? 'text-rose-400' : 'text-emerald-400'
                    } ${canManage && !isSelf ? 'hover:opacity-70 cursor-pointer' : 'cursor-default opacity-80'}`}
                  >
                    {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : member.status === 'inactive' ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    {member.status || 'active'}
                  </button>
                </div>

                {/* Actions */}
                <div className="col-span-1 lg:col-span-2 flex lg:flex-row items-center justify-between lg:justify-end gap-3 w-full border-t lg:border-t-0 border-white/5 pt-3 lg:pt-0">
                  <span className="text-xs text-slate-400 lg:hidden">{member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}</span>
                  <div className="flex items-center gap-1.5">
                    {canManage && (
                      <button
                        onClick={() => setPromoting(member)}
                        title="Change role"
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-all"
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => canManage && setEditing(member)}
                      disabled={!canManage}
                      title={canManage ? 'Edit' : 'No permission'}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(member)}
                      disabled={!canManage || isSelf || isBusy}
                      title={isSelf ? "You can't delete yourself" : canManage ? 'Delete' : 'No permission'}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {search === '' && filteredMembers.length > visibleCount && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setVisibleCount(prev => prev + 8)}
              className="flex items-center gap-1.5 px-5 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300 transition-all border border-white/10"
            >
              Show more <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Create member modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">Add new member</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
              </div>

              <form onSubmit={(e) => e.preventDefault()} autoComplete="off" className="space-y-4">
                <input type="text" className="hidden" aria-hidden="true" autoComplete="false" />
                <input type="password" className="hidden" aria-hidden="true" autoComplete="false" />

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full name</label>
                  <input
                    type="text" placeholder="Enter full name" value={formData.name} autoComplete="new-unique-name"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email" placeholder="name@domain.com" value={formData.email} autoComplete="new-unique-email"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password" placeholder="••••••••" value={formData.password} autoComplete="new-password"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role</label>
                    <select
                      value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="PI" className="bg-zinc-950">PI (Faculty)</option>
                      <option value="President" className="bg-zinc-950">President</option>
                      <option value="OfficeBearer" className="bg-zinc-950">Office Bearer</option>
                      <option value="TeamLeader" className="bg-zinc-950">Team Leader</option>
                      <option value="TeamMember" className="bg-zinc-950">Team Member</option>
                      <option value="Alumni" className="bg-zinc-950">Alumni</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Team</label>
                    <select
                      value={formData.team} disabled={formData.role === 'PI'}
                      onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                      className={`w-full p-2.5 rounded-lg bg-white/5 border text-xs focus:outline-none cursor-pointer transition-all ${
                        formData.role === 'PI'
                          ? 'border-purple-500/30 text-purple-400 font-medium bg-purple-950/20 cursor-not-allowed'
                          : 'border-white/10 text-white focus:border-blue-500'
                      }`}
                    >
                      {formData.role === 'PI' ? (
                        <option value="Institutional Head / Faculty" className="bg-zinc-950">Faculty Authority</option>
                      ) : (
                        existingTeams.map(t => <option key={t} value={t} className="bg-zinc-950">{t}</option>)
                      )}
                    </select>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="button"
                  onClick={handleCreateMember}
                  className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-md transition-all border border-blue-400/20"
                >
                  Create member
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}