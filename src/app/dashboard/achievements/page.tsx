'use client';

import {
  Trophy, Plus, Trash2, RefreshCw, X, Award, Save,
  Search, ExternalLink, CheckCircle2, Star, ShieldCheck,
  Link2, Users, Tag, Calendar, Sparkles, BookOpen,
  GitBranch, Briefcase, FileText, FolderOpen, HelpCircle,
  Image as ImageIcon, Zap, Code2, Globe, Palette, Database,
  Cpu, ArrowUpRight, Copy, Download, Share2, Eye, Edit3,
  TrendingUp, Medal, Target, Rocket, GraduationCap,
  ChevronRight, BarChart2, Activity, Clock, Layers,
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLinkedin, FaGithub } from 'react-icons/fa';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Achievement {
  _id: string; title: string; description: string; year: string;
  category: string; teamMembers: string[]; eventLink: string;
  coverImage: string; isFeatured: boolean;
}
interface UserProfile {
  name: string; role: string; team: string; designation: string;
  branch: string; year: string; skills: string[]; bio: string;
  profileImage: string; rollNo: string; batch: number;
  socialLinks: { linkedin: string; github: string; instagram: string };
}

// ─── Category config ─────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  'Hackathon','Certification','Internship',
];
const CAT: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  'Hackathon':         { icon: Trophy,      color: '#f59e0b', bg: '#f59e0b15', border: '#f59e0b35' },
  'Open Source':       { icon: GitBranch,   color: '#34d399', bg: '#34d39915', border: '#34d39935' },
  'Project Milestone': { icon: FolderOpen,  color: '#60a5fa', bg: '#60a5fa15', border: '#60a5fa35' },
  'Research Paper':    { icon: FileText,    color: '#c084fc', bg: '#c084fc15', border: '#c084fc35' },
  'Certification':     { icon: ShieldCheck, color: '#fb7185', bg: '#fb718515', border: '#fb718535' },
  'Internship':        { icon: Briefcase,   color: '#38bdf8', bg: '#38bdf815', border: '#38bdf835' },
  'Placement':         { icon: Sparkles,    color: '#a78bfa', bg: '#a78bfa15', border: '#a78bfa35' },
  'Other':             { icon: BookOpen,    color: '#94a3b8', bg: '#94a3b815', border: '#94a3b835' },
};
function cs(cat: string) {
  return CAT[cat] ?? { icon: Tag, color: '#818cf8', bg: '#818cf815', border: '#818cf835' };
}

// ─── Skill palettes ──────────────────────────────────────────────────────────
const SP = [
  { bg:'#6366f115',color:'#818cf8',border:'#6366f130' },
  { bg:'#8b5cf615',color:'#a78bfa',border:'#8b5cf630' },
  { bg:'#06b6d415',color:'#38bdf8',border:'#06b6d430' },
  { bg:'#10b98115',color:'#34d399',border:'#10b98130' },
  { bg:'#f59e0b15',color:'#fbbf24',border:'#f59e0b30' },
  { bg:'#fb718515',color:'#fb7185',border:'#f4366030' },
  { bg:'#ec489915',color:'#f472b6',border:'#ec489930' },
  { bg:'#14b8a615',color:'#2dd4bf',border:'#14b8a630' },
];
const sp = (i: number) => SP[i % SP.length];

// ─── Skill groups ────────────────────────────────────────────────────────────
const SKILL_GROUPS: Record<string, { icon: any; color: string; keywords: string[] }> = {
  Frontend:    { icon: Palette,   color: '#818cf8', keywords: ['react','next','vue','angular','html','css','tailwind','javascript','typescript','svelte','figma','ui','ux'] },
  Backend:     { icon: Code2,     color: '#34d399', keywords: ['node','express','django','flask','spring','laravel','fastapi','graphql','rest','api'] },
  Database:    { icon: Database,  color: '#60a5fa', keywords: ['mongodb','postgres','mysql','redis','firebase','supabase','prisma','sql','nosql'] },
  Cloud:       { icon: Globe,     color: '#38bdf8', keywords: ['aws','gcp','azure','docker','kubernetes','vercel','netlify','heroku','linux','devops','ci','cd'] },
  'AI / ML':   { icon: Cpu,       color: '#c084fc', keywords: ['python','ml','ai','tensorflow','pytorch','nlp','opencv','sklearn','pandas','numpy','jupyter','llm'] },
  Programming: { icon: Code2,     color: '#fbbf24', keywords: ['c','c++','java','kotlin','swift','go','rust','dart','flutter','ruby','php','bash'] },
  Tools:       { icon: Zap,       color: '#fb7185', keywords: ['git','github','jira','notion','postman','vs code','figma','slack','linux','bash'] },
};

function groupSkills(skills: string[]) {
  const groups: Record<string, string[]> = {};
  const ungrouped: string[] = [];
  skills.forEach(skill => {
    const sl = skill.toLowerCase();
    let matched = false;
    for (const [grp, cfg] of Object.entries(SKILL_GROUPS)) {
      if (cfg.keywords.some(k => sl.includes(k))) {
        groups[grp] = [...(groups[grp] || []), skill];
        matched = true; break;
      }
    }
    if (!matched) ungrouped.push(skill);
  });
  if (ungrouped.length) groups['Other'] = ungrouped;
  return groups;
}

// ─── Career stages ───────────────────────────────────────────────────────────
const CAREER_STAGES = [
  { label: 'Student',     icon: GraduationCap, roles: ['teammember','alumni'] },
  { label: 'Contributor', icon: GitBranch,     roles: ['teammember'] },
  { label: 'Core Member', icon: Users,         roles: ['officebearer','teamleader','teammember'] },
  { label: 'Team Leader', icon: Target,        roles: ['teamleader'] },
  { label: 'President',   icon: Medal,         roles: ['president','pi'] },
  { label: 'Alumni',      icon: Award,         roles: ['alumni'] },
];

// ─── Recognition badges ──────────────────────────────────────────────────────
const RECOGNITION = [
  { label: 'Hackathon Winner', icon: Trophy,    color: '#f59e0b', glow: '#f59e0b40', cond: (a: Achievement[]) => a.some(x => x.category === 'Hackathon') },
  { label: 'Researcher',       icon: FileText,  color: '#c084fc', glow: '#c084fc40', cond: (a: Achievement[]) => a.some(x => x.category === 'Research Paper') },
  { label: 'Open Source',      icon: GitBranch, color: '#34d399', glow: '#34d39940', cond: (a: Achievement[]) => a.some(x => x.category === 'Open Source') },
  { label: 'Certified',        icon: ShieldCheck,color:'#fb7185', glow: '#fb718540', cond: (a: Achievement[]) => a.some(x => x.category === 'Certification') },
  { label: 'Intern',           icon: Briefcase, color: '#38bdf8', glow: '#38bdf840', cond: (a: Achievement[]) => a.some(x => x.category === 'Internship') },
  { label: 'Achiever',         icon: Star,      color: '#a78bfa', glow: '#a78bfa40', cond: (a: Achievement[]) => a.length >= 3 },
  { label: 'Skilled',          icon: Zap,       color: '#fbbf24', glow: '#fbbf2440', cond: (_: Achievement[], s: string[]) => s.length >= 5 },
  { label: 'Verified',         icon: CheckCircle2,color:'#34d399',glow:'#34d39940', cond: () => true },
];

// ─── Suggested certs ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { title: 'AWS Cloud Practitioner', org: 'Amazon', icon: Globe,    color: '#f59e0b' },
  { title: 'Google UX Design',       org: 'Google', icon: Palette,  color: '#34d399' },
  { title: 'Meta Backend Dev',       org: 'Meta',   icon: Code2,    color: '#60a5fa' },
  { title: 'GitHub Foundations',     org: 'GitHub', icon: GitBranch,color: '#a78bfa' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseImageLink(url: string) {
  if (!url) return '';
  const t = url.trim();
  const m = t.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || t.match(/id=([a-zA-Z0-9_-]+)/);
  return m ? `https://docs.google.com/uc?export=view&id=${m[1]}` : t;
}

// ─── Micro-components ────────────────────────────────────────────────────────
function Glass({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-3xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-xl ${className}`} style={style}>
      {children}
    </div>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">{children}</p>;
}
const iCls = (x = '') =>
  `w-full bg-[#0c1018] border border-white/[0.09] rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/60 transition-colors ${x}`;
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  // cast transition to any to satisfy framer-motion TS types for ease
  transition: { duration: 0.4, delay, ease: 'easeOut' } as any,
});

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AchievementsDashboard() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [user,         setUser]         = useState<UserProfile | null>(null);
  const [achLoading,   setAchLoading]   = useState(true);
  const [showAdd,      setShowAdd]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [preview,      setPreview]      = useState<Achievement | null>(null);
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('All');
  const [customCats,   setCustomCats]   = useState<string[]>([]);
  const [skills,       setSkills]       = useState<string[]>([]);
  const [skillInput,   setSkillInput]   = useState('');
  const [skillSaving,  setSkillSaving]  = useState(false);
  const [tab,          setTab]          = useState<'overview'|'achievements'|'skills'|'timeline'>('overview');
  const [copied,       setCopied]       = useState(false);
  const [showCustom,   setShowCustom]   = useState(false);
  const skillRef = useRef<HTMLInputElement>(null);

  const blankForm = {
    title:'', description:'', year: new Date().getFullYear().toString(),
    category:'Hackathon', customCategory:'', teamMembers:'', eventLink:'', coverImage:'', isFeatured:false,
  };
  const [form, setForm] = useState(blankForm);

  const allCats = useMemo(() => [...DEFAULT_CATEGORIES, ...customCats], [customCats]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      const [achRes, meRes] = await Promise.all([
        fetch('/api/dashboard/achievements'),
        fetch('/api/user/me'),
      ]);
      const achData = await achRes.json();
      const meData  = await meRes.json();
      if (achData.success) setAchievements(achData.achievements || []);
      if (meData.success)  { setUser(meData.user); setSkills(meData.user?.skills || []); }
    } catch (e) { console.error(e); }
    finally { setAchLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  // ── Achievement CRUD ───────────────────────────────────────────────────────
  const handleSave = async () => {
    const finalCat = showCustom && form.customCategory.trim() ? form.customCategory.trim() : form.category;
    if (!form.title.trim()) { alert('Title required.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/dashboard/achievements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, category: finalCat, coverImage: parseImageLink(form.coverImage), teamMembers: form.teamMembers.split(',').map(s => s.trim()).filter(Boolean) }),
      });
      if (res.ok) {
        if (showCustom && form.customCategory.trim() && !allCats.includes(finalCat)) setCustomCats(p => [...p, finalCat]);
        setShowAdd(false); setForm(blankForm); setShowCustom(false); fetchAll();
      }
    } catch { alert('Error saving.'); } finally { setSaving(false); }
  };
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this achievement?')) return;
    const res = await fetch(`/api/dashboard/achievements?id=${id}`, { method: 'DELETE' });
    if (res.ok) { setAchievements(p => p.filter(a => a._id !== id)); if (preview?._id === id) setPreview(null); }
  };
  const handleFeature = async (ach: Achievement, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !ach.isFeatured;
    await fetch('/api/dashboard/achievements', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: ach._id, isFeatured: next }) });
    setAchievements(p => p.map(a => a._id === ach._id ? { ...a, isFeatured: next } : a));
  };

  // ── Skills CRUD ────────────────────────────────────────────────────────────
  const addSkill = async () => {
    const s = skillInput.trim();
    if (!s || skills.includes(s)) { setSkillInput(''); return; }
    const next = [...skills, s]; setSkills(next); setSkillInput(''); skillRef.current?.focus();
    await syncSkills(next);
  };
  const removeSkill = async (skill: string) => {
    const next = skills.filter(s => s !== skill); setSkills(next); await syncSkills(next);
  };
  const syncSkills = async (updated: string[]) => {
    setSkillSaving(true);
    try { await fetch('/api/user/update-profile', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ skills: updated }) }); }
    catch (e) { console.error(e); } finally { setSkillSaving(false); }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return achievements.filter(a =>
      (catFilter === 'All' || a.category === catFilter) &&
      (!q || a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
    );
  }, [achievements, catFilter, search]);

  const stats = useMemo(() => {
    const catCount = achievements.reduce((acc: Record<string,number>, a) => { acc[a.category] = (acc[a.category]||0)+1; return acc; }, {});
    return {
      total:    achievements.length,
      featured: achievements.filter(a => a.isFeatured).length,
      skills:   skills.length,
      cats:     Object.keys(catCount).length,
      hackathons: catCount['Hackathon'] || 0,
      certs:      catCount['Certification'] || 0,
      opensource: catCount['Open Source'] || 0,
      projects:   catCount['Project Milestone'] || 0,
    };
  }, [achievements, skills]);

  const byYear = useMemo(() => {
    const map: Record<string, Achievement[]> = {};
    achievements.forEach(a => { const y = a.year || 'Unknown'; map[y] = [...(map[y]||[]), a]; });
    return Object.entries(map).sort((a,b) => b[0].localeCompare(a[0]));
  }, [achievements]);

  const skillGroups = useMemo(() => groupSkills(skills), [skills]);
  const earnedBadges = useMemo(() => RECOGNITION.filter(r => r.cond(achievements, skills)), [achievements, skills]);
  const featured = useMemo(() => achievements.filter(a => a.isFeatured), [achievements]);

  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    const checks = [user.name, user.bio, user.team, user.branch, skills.length > 0, achievements.length > 0, user.socialLinks?.linkedin, user.profileImage];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [user, skills, achievements]);

  const currentStageIdx = useMemo(() => {
    if (!user) return 0;
    const rl = user.role?.toLowerCase() || '';
    for (let i = CAREER_STAGES.length - 1; i >= 0; i--) {
      if (CAREER_STAGES[i].roles.some(r => rl.includes(r))) return i;
    }
    return 0;
  }, [user]);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.origin + '/profile/' + (user?.rollNo || ''));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const TABS = [
    { id:'overview',      label:'Overview',  icon: BarChart2  },
    { id:'achievements',  label:'Achievements', icon: Trophy  },
    { id:'timeline',      label:'Timeline',  icon: Clock      },
    { id:'skills',        label:'Skills',    icon: Zap        },
  ] as const;

  if (achLoading) return (
    <div className="min-h-screen flex items-center justify-center gap-3 text-sm text-slate-500">
      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> Loading your profile…
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-28 space-y-6" style={{ fontFamily:'system-ui,-apple-system,sans-serif' }}>

      {/* ═══════════════════════ HERO BANNER ═══════════════════════ */}
      <motion.div {...fadeUp(0)}>
        <Glass className="relative overflow-hidden">
          {/* animated bg blobs */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-600/12 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-40 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

          {/* Profile completion bar at very top */}
          <div className="relative h-0.5 bg-white/[0.04] overflow-hidden rounded-t-3xl">
            <motion.div initial={{ width: 0 }} animate={{ width: `${profileCompletion}%` }} transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" />
          </div>

          <div className="relative p-6 md:p-8">
            {/* Top row */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-500/25 overflow-hidden">
                  {user?.profileImage
                    ? <img src={user.profileImage} alt="avatar" className="w-full h-full object-cover" />
                    : <span>{user?.name?.slice(0,2).toUpperCase() || 'ME'}</span>
                  }
                </div>
                {/* Online dot */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#0d1117] shadow-lg shadow-emerald-400/50" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight truncate">{user?.name || 'Your Name'}</h1>
                  {user?.role && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                      style={{ background:'#6366f118', color:'#818cf8', border:'1px solid #6366f130' }}>
                      {user.role}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-3">
                  {[user?.designation, user?.team].filter(Boolean).join(' · ') || 'Tesla Club Member'}
                  {user?.branch && <span className="text-slate-600"> · {user.branch} {user.year && `Year ${user.year}`}</span>}
                </p>

                {/* Mini stats row */}
                <div className="flex flex-wrap gap-4">
                  {[
                    { v: stats.total,    l: 'Achievements', c: '#6366f1' },
                    { v: stats.featured, l: 'Featured',     c: '#f59e0b' },
                    { v: stats.skills,   l: 'Skills',       c: '#34d399' },
                    { v: earnedBadges.length, l: 'Badges',  c: '#a78bfa' },
                  ].map(({ v, l, c }) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <span className="text-lg font-black text-white">{v}</span>
                      <span className="text-xs text-slate-500">{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right actions */}
              <div className="flex flex-col gap-2 shrink-0">
                <div className="flex gap-2">
                  <motion.button onClick={() => setShowAdd(true)} whileHover={{ y:-1 }} whileTap={{ scale:0.96 }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white"
                    style={{ background:'#4f46e5', boxShadow:'0 4px 20px rgba(99,102,241,0.3)' }}>
                    <Plus className="w-4 h-4" /> Add
                  </motion.button>
                  <motion.button onClick={copyUrl} whileTap={{ scale:0.96 }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                    style={{ background:'#ffffff08', border:'1px solid rgba(255,255,255,0.08)', color: copied?'#34d399':'#94a3b8' }}>
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Share'}
                  </motion.button>
                </div>
                {/* Profile completion */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden w-24">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700" style={{ width:`${profileCompletion}%` }} />
                  </div>
                  <span>{profileCompletion}% complete</span>
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="relative mt-6 flex gap-0.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1 w-fit">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id as any)}
                  className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${tab===t.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {tab === t.id && (
                    <motion.div layoutId="tab-active" className="absolute inset-0 rounded-xl"
                      style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)' }} />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <t.icon className="w-3.5 h-3.5" />{t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Glass>
      </motion.div>

      {/* ═══════════════════════ TAB CONTENT ═══════════════════════ */}
      <AnimatePresence mode="wait">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <motion.div key="overview" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-6">

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label:'Total',       value:stats.total,    accent:'#6366f1', icon:Trophy,    sub:'achievements'    },
                { label:'Featured',    value:stats.featured, accent:'#f59e0b', icon:Star,      sub:'highlighted'     },
                { label:'Skills',      value:stats.skills,   accent:'#34d399', icon:Zap,       sub:'added'           },
                { label:'Categories',  value:stats.cats,     accent:'#a78bfa', icon:Tag,       sub:'different types' },
                { label:'Hackathons',  value:stats.hackathons,accent:'#f59e0b',icon:Trophy,    sub:'competed'        },
                { label:'Certificates',value:stats.certs,    accent:'#fb7185', icon:ShieldCheck,sub:'earned'         },
                { label:'Open Source', value:stats.opensource,accent:'#34d399',icon:GitBranch, sub:'contributions'  },
                { label:'Projects',    value:stats.projects, accent:'#60a5fa', icon:FolderOpen, sub:'milestones'     },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.05*i}}>
                  <Glass className="p-4 group hover:border-white/[0.12] transition-all duration-300 cursor-default"
                    style={{ boxShadow:`0 0 0 0 ${s.accent}00`, transition:'box-shadow 0.3s' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background:`${s.accent}18`, border:`1px solid ${s.accent}35` }}>
                        <s.icon style={{ width:16, height:16, color:s.accent }} />
                      </div>
                      <TrendingUp style={{ width:12, height:12, color:s.accent, opacity:0.5 }} />
                    </div>
                    <p className="text-2xl font-black text-white">{s.value}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
                  </Glass>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-5">

              {/* Featured achievements carousel */}
              <div className="lg:col-span-2 space-y-3">
                <SectionLabel>Featured Achievements</SectionLabel>
                {featured.length === 0 ? (
                  <Glass className="p-10 flex flex-col items-center gap-3 text-center border-dashed">
                    <Star className="w-8 h-8 text-slate-700" />
                    <p className="text-sm text-slate-500">No featured achievements yet</p>
                    <p className="text-xs text-slate-600">Click the ★ on any achievement to feature it here</p>
                  </Glass>
                ) : (
                  <div className="space-y-3">
                    {featured.slice(0,3).map((ach, i) => {
                      const s = cs(ach.category); const Icon = s.icon;
                      return (
                        <motion.div key={ach._id} initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:0.1*i}}
                          onClick={() => setPreview(ach)}
                          className="group cursor-pointer rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all overflow-hidden flex"
                          style={{ borderLeft:`3px solid ${s.color}` }}>
                          {/* Image strip */}
                          <div className="w-24 md:w-32 shrink-0 relative overflow-hidden" style={{ background: s.bg }}>
                            {ach.coverImage
                              ? <img src={ach.coverImage} alt="" className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
                              : <Icon className="absolute inset-0 m-auto w-8 h-8" style={{ color:s.color, opacity:0.3 }} />}
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                                  style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
                                  <Icon style={{width:8,height:8}} />{ach.category}
                                </span>
                                <span className="text-[10px] text-slate-600 font-mono">{ach.year}</span>
                                <Star style={{width:10,height:10,color:'#f59e0b',fill:'#f59e0b'}} />
                              </div>
                              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">{ach.title}</h3>
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ach.description}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {ach.eventLink && (
                                <a href={ach.eventLink} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white transition-colors">
                                  <ExternalLink style={{width:10,height:10}} /> Certificate
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight style={{width:14,height:14,color:'#64748b'}} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-5">
                {/* Recognition badges */}
                <div>
                  <SectionLabel>Recognition</SectionLabel>
                  <Glass className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {earnedBadges.map((b, i) => (
                        <motion.div key={b.label} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:0.08*i}}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center"
                          style={{ background:`${b.color}10`, border:`1px solid ${b.color}25` }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background:`${b.color}20`, boxShadow:`0 0 12px ${b.glow}` }}>
                            <b.icon style={{width:16,height:16,color:b.color}} />
                          </div>
                          <span className="text-[10px] font-bold text-white leading-tight">{b.label}</span>
                        </motion.div>
                      ))}
                      {earnedBadges.length === 0 && (
                        <div className="col-span-2 py-6 text-center text-xs text-slate-600">
                          <Medal className="w-6 h-6 mx-auto mb-2 opacity-30" />
                          Add achievements to earn badges
                        </div>
                      )}
                    </div>
                  </Glass>
                </div>

                {/* Career Progress */}
                <div>
                  <SectionLabel>Career Stage</SectionLabel>
                  <Glass className="p-4">
                    <div className="space-y-2">
                      {CAREER_STAGES.map((stage, i) => {
                        const active  = i === currentStageIdx;
                        const past    = i < currentStageIdx;
                        const Icon    = stage.icon;
                        return (
                          <div key={stage.label} className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: active ? '#4f46e5' : past ? '#4f46e520' : '#ffffff08',
                                  border: active ? '2px solid #818cf8' : past ? '1px solid #4f46e540' : '1px solid rgba(255,255,255,0.06)',
                                  boxShadow: active ? '0 0 12px #6366f160' : 'none' }}>
                                <Icon style={{ width:13, height:13, color: active?'#fff': past?'#6366f1':'#334155' }} />
                              </div>
                              {i < CAREER_STAGES.length-1 && (
                                <div className="w-px h-3 mt-0.5" style={{ background: past?'#4f46e540':'rgba(255,255,255,0.04)' }} />
                              )}
                            </div>
                            <span className="text-xs font-semibold" style={{ color: active?'#e2e8f0': past?'#6366f1':'#334155' }}>
                              {stage.label} {active && <span className="text-[10px] font-normal text-indigo-400 ml-1">← current</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </Glass>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <SectionLabel>Quick Actions</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label:'Add Achievement', icon:Plus,        action:()=>setShowAdd(true), accent:'#4f46e5', glow:'rgba(99,102,241,0.25)' },
                  { label:'Add Skill',       icon:Zap,         action:()=>setTab('skills'), accent:'#059669', glow:'rgba(16,185,129,0.25)' },
                  { label:'View Timeline',   icon:Clock,       action:()=>setTab('timeline'),accent:'#7c3aed',glow:'rgba(124,58,237,0.25)' },
                  { label:'Share Portfolio', icon:Share2,      action:copyUrl,              accent:'#0891b2', glow:'rgba(8,145,178,0.25)'  },
                ].map(({ label, icon: Icon, action, accent, glow }) => (
                  <motion.button key={label} onClick={action} whileHover={{ y:-2 }} whileTap={{ scale:0.97 }}
                    className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all text-center group">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                      style={{ background:`${accent}18`, border:`1px solid ${accent}35`, boxShadow:`0 4px 16px ${glow}` }}>
                      <Icon style={{width:18,height:18,color:accent}} />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <SectionLabel>Suggested for You</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {SUGGESTIONS.map((s, i) => (
                  <Glass key={i} className="p-4 hover:border-white/[0.12] transition-all group cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background:`${s.color}15`, border:`1px solid ${s.color}30` }}>
                        <s.icon style={{width:16,height:16,color:s.color}} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">{s.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{s.org}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-500 group-hover:text-indigo-400 transition-colors">
                      <ArrowUpRight style={{width:10,height:10}} /> Explore
                    </div>
                  </Glass>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ACHIEVEMENTS ── */}
        {tab === 'achievements' && (
          <motion.div key="ach" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-5">

            {/* Search + filter bar */}
            <Glass className="p-3">
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <div className="relative w-full md:w-64 shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search achievements…"
                    className="w-full bg-white/[0.04] border border-white/[0.07] rounded-2xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 transition-colors" />
                </div>
                <div className="flex flex-wrap gap-1.5 md:ml-auto">
                  {['All', ...allCats].map(cat => {
                    const active = catFilter === cat;
                    const s = cat !== 'All' ? cs(cat) : null;
                    return (
                      <button key={cat} onClick={() => setCatFilter(cat)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                        style={active && s
                          ? { background:s.bg, color:s.color, border:`1px solid ${s.border}` }
                          : active
                          ? { background:'#6366f118', color:'#818cf8', border:'1px solid #6366f130' }
                          : { background:'transparent', color:'#475569', border:'1px solid transparent' }
                        }>
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Glass>

            {/* Cards grid */}
            {filtered.length === 0 ? (
              <Glass className="p-16 flex flex-col items-center gap-4 text-center" style={{ borderStyle:'dashed' }}>
                <Trophy className="w-10 h-10 text-slate-700" />
                <div>
                  <p className="text-sm font-semibold text-slate-500">No achievements found</p>
                  <p className="text-xs text-slate-600 mt-1">Try a different filter or add your first achievement</p>
                </div>
                <motion.button onClick={() => setShowAdd(true)} whileTap={{scale:0.97}}
                  className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white mt-1"
                  style={{ background:'#4f46e5', boxShadow:'0 4px 16px rgba(99,102,241,0.3)' }}>
                  <Plus className="w-4 h-4 inline mr-1.5" />Add Achievement
                </motion.button>
              </Glass>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filtered.map((ach, i) => {
                    const s = cs(ach.category); const Icon = s.icon;
                    return (
                      <motion.div key={ach._id}
                        initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.95}}
                        transition={{delay:0.04*i}}
                        onClick={() => setPreview(ach)}
                        className="group rounded-3xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] cursor-pointer transition-all duration-300 overflow-hidden flex flex-col"
                        style={{ boxShadow:`0 0 0 1px ${s.border} inset` }}
                      >
                        {/* Cover */}
                        <div className="h-40 relative flex items-center justify-center overflow-hidden" style={{ background: ach.coverImage ? undefined : s.bg }}>
                          {ach.coverImage
                            ? <img src={ach.coverImage} alt={ach.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                            : <Icon style={{width:48,height:48,color:s.color,opacity:0.2}} />}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                          {/* Featured ribbon */}
                          {ach.isFeatured && (
                            <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
                              <div className="absolute top-1.5 right-[-10px] bg-amber-500 text-[8px] font-black text-black py-0.5 w-16 text-center rotate-45">FEAT</div>
                            </div>
                          )}

                          {/* Category chip */}
                          <div className="absolute top-3 left-3">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm"
                              style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
                              <Icon style={{width:9,height:9}} />{ach.category}
                            </span>
                          </div>

                          {/* Star button */}
                          <button onClick={e => handleFeature(ach, e)}
                            className="absolute top-3 right-3 p-1.5 rounded-xl backdrop-blur-sm transition-all"
                            style={{ background: ach.isFeatured?'#f59e0b25':'#00000060', border: ach.isFeatured?'1px solid #f59e0b40':'1px solid rgba(255,255,255,0.08)' }}>
                            <Star style={{width:14,height:14,color:ach.isFeatured?'#f59e0b':'#4b5563',fill:ach.isFeatured?'#f59e0b':'transparent'}} />
                          </button>

                          {/* Year */}
                          <span className="absolute bottom-3 right-3 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm"
                            style={{ background:'#00000070', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.06)' }}>
                            {ach.year}
                          </span>
                        </div>

                        {/* Body */}
                        <div className="p-4 flex-1 flex flex-col gap-3">
                          <div>
                            <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">{ach.title}</h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{ach.description || 'No description.'}</p>
                          </div>
                          {ach.teamMembers?.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Users style={{width:11,height:11,flexShrink:0}} />
                              <span className="truncate">{ach.teamMembers.slice(0,2).join(', ')}{ach.teamMembers.length>2&&` +${ach.teamMembers.length-2}`}</span>
                            </div>
                          )}
                          <div className="mt-auto pt-3 border-t border-white/[0.05] flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold" style={{color:'#34d399'}}>
                              <CheckCircle2 style={{width:11,height:11}} /> Verified
                            </div>
                            <div className="flex items-center gap-1">
                              {ach.eventLink && (
                                <a href={ach.eventLink} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                                  <ExternalLink style={{width:12,height:12}} />
                                </a>
                              )}
                              <button onClick={e=>handleDelete(ach._id,e)}
                                className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                <Trash2 style={{width:12,height:12}} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TIMELINE ── */}
        {tab === 'timeline' && (
          <motion.div key="timeline" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-4">
            {byYear.length === 0 ? (
              <Glass className="p-16 flex flex-col items-center gap-3 text-center" style={{borderStyle:'dashed'}}>
                <Clock className="w-8 h-8 text-slate-700" />
                <p className="text-sm text-slate-500">Your timeline is empty — start adding achievements!</p>
              </Glass>
            ) : byYear.map(([year, achs], yi) => (
              <motion.div key={year} initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{delay:0.1*yi}}>
                {/* Year marker */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="px-4 py-1.5 rounded-2xl text-sm font-black"
                    style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', boxShadow:'0 4px 16px rgba(99,102,241,0.35)' }}>
                    {year}
                  </div>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                  <span className="text-xs text-slate-600">{achs.length} achievement{achs.length!==1?'s':''}</span>
                </div>

                {/* Achievements for that year */}
                <div className="ml-4 pl-4 border-l border-white/[0.06] space-y-3">
                  {achs.map((ach, i) => {
                    const s = cs(ach.category); const Icon = s.icon;
                    return (
                      <motion.div key={ach._id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:0.06*i}}
                        onClick={() => setPreview(ach)}
                        className="group relative flex gap-4 cursor-pointer">
                        {/* Timeline dot */}
                        <div className="absolute -left-[21px] top-4 w-3 h-3 rounded-full border-2"
                          style={{ background:s.bg, borderColor:s.color, boxShadow:`0 0 8px ${s.color}60` }} />

                        <Glass className="flex-1 p-4 flex items-start gap-4 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all">
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ background:s.bg, border:`1px solid ${s.border}` }}>
                            <Icon style={{width:18,height:18,color:s.color}} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{ach.title}</h3>
                              {ach.isFeatured && <Star style={{width:11,height:11,color:'#f59e0b',fill:'#f59e0b',flexShrink:0}} />}
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
                              {ach.category}
                            </span>
                            {ach.description && <p className="text-xs text-slate-400 mt-1.5 line-clamp-1">{ach.description}</p>}
                          </div>
                          <ChevronRight style={{width:14,height:14,color:'#334155',flexShrink:0,marginTop:4}} className="group-hover:text-slate-400 transition-colors" />
                        </Glass>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── SKILLS ── */}
        {tab === 'skills' && (
          <motion.div key="skills" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-5">

            {/* Add skill */}
            <Glass className="p-6 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/05 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{background:'#34d39918',border:'1px solid #34d39930'}}>
                    <Zap style={{width:18,height:18,color:'#34d399'}} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-black text-white">My Skills</h2>
                    <p className="text-xs text-slate-500">{skills.length} skill{skills.length!==1?'s':''} · auto-saved</p>
                  </div>
                  {skillSaving && <RefreshCw style={{width:13,height:13,color:'#64748b'}} className="animate-spin" />}
                </div>
                <div className="flex gap-2">
                  <input ref={skillRef} value={skillInput}
                    onChange={e=>setSkillInput(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&addSkill()}
                    placeholder="Type a skill and press Enter… e.g. React, Python, Figma"
                    className="flex-1 bg-[#0c1018] border border-white/[0.09] rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/60 transition-colors" />
                  <motion.button onClick={addSkill} whileTap={{scale:0.95}}
                    className="px-5 py-3 rounded-2xl text-sm font-semibold text-white"
                    style={{background:'#4f46e5',boxShadow:'0 4px 16px rgba(99,102,241,0.25)'}}>
                    <Plus style={{width:16,height:16}} />
                  </motion.button>
                </div>
                <p className="text-[11px] text-slate-600 mt-2">Press Enter or click + · Hover a skill to remove it</p>
              </div>
            </Glass>

            {/* Grouped skills */}
            {Object.keys(skillGroups).length === 0 ? (
              <Glass className="p-16 flex flex-col items-center gap-3 text-center" style={{borderStyle:'dashed'}}>
                <Zap className="w-8 h-8 text-slate-700" />
                <p className="text-sm text-slate-500">No skills yet — type one above!</p>
              </Glass>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(skillGroups).map(([group, groupSkills], gi) => {
                  const gcfg = SKILL_GROUPS[group];
                  const GIcon = gcfg?.icon ?? Tag;
                  const gc    = gcfg?.color ?? '#818cf8';
                  return (
                    <Glass key={group} className="p-5">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{background:`${gc}18`,border:`1px solid ${gc}30`}}>
                          <GIcon style={{width:14,height:14,color:gc}} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{group}</p>
                          <p className="text-[10px] text-slate-500">{groupSkills.length} skill{groupSkills.length!==1?'s':''}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <AnimatePresence>
                          {groupSkills.map((skill, i) => {
                            const p = sp(gi * 3 + i);
                            return (
                              <motion.div key={skill}
                                initial={{opacity:0,scale:0.85}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}
                                transition={{type:'spring',stiffness:400,damping:25}}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold group/skill"
                                style={{background:p.bg,color:p.color,border:`1px solid ${p.border}`}}>
                                <span>{skill}</span>
                                <button onClick={()=>removeSkill(skill)}
                                  className="opacity-0 group-hover/skill:opacity-100 transition-opacity hover:bg-white/10 rounded p-0.5 -mr-0.5">
                                  <X style={{width:10,height:10}} />
                                </button>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </Glass>
                  );
                })}
              </div>
            )}

            {/* Suggestions */}
            {skills.length < 15 && (
              <Glass className="p-5">
                <SectionLabel>Suggestions</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {['React','Node.js','Python','TypeScript','Figma','MongoDB','Docker','AWS','Next.js','Machine Learning','UI/UX','Git','PostgreSQL','Redis','Kubernetes','TensorFlow']
                    .filter(s => !skills.includes(s)).slice(0,12)
                    .map(s => (
                      <button key={s} onClick={() => { setSkillInput(s); skillRef.current?.focus(); }}
                        className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:text-white border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all">
                        + {s}
                      </button>
                    ))
                  }
                </div>
              </Glass>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════ PREVIEW MODAL ═══════════════════════ */}
      <AnimatePresence>
        {preview && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-50 p-4" onClick={() => setPreview(null)}>
            <motion.div initial={{opacity:0,scale:0.94,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.94,y:10}}
              transition={{type:'spring',stiffness:300,damping:28}}
              onClick={e=>e.stopPropagation()}
              className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
              style={{background:'#0e1420',border:'1px solid rgba(255,255,255,0.09)'}}>
              {/* Cover */}
              <div className="relative h-56 flex items-center justify-center overflow-hidden"
                style={{background: preview.coverImage ? undefined : cs(preview.category).bg}}>
                {preview.coverImage
                  ? <img src={preview.coverImage} alt={preview.title} className="w-full h-full object-cover opacity-55" />
                  : (() => { const I=cs(preview.category).icon; return <I style={{width:56,height:56,color:cs(preview.category).color,opacity:0.2}} />; })()
                }
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e1420] to-transparent" />
                <button onClick={() => setPreview(null)}
                  className="absolute top-4 right-4 p-2 rounded-2xl bg-black/50 hover:bg-black/70 text-white transition-all">
                  <X style={{width:16,height:16}} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {(() => { const s=cs(preview.category); const I=s.icon; return (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>
                        <I style={{width:10,height:10}} />{preview.category}
                      </span>
                    ); })()}
                    <span className="text-xs text-slate-500 font-mono">{preview.year}</span>
                    {preview.isFeatured && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{color:'#f59e0b',background:'#f59e0b18',border:'1px solid #f59e0b30'}}>
                        <Star style={{width:10,height:10,fill:'#f59e0b'}} /> Featured
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-white">{preview.title}</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">{preview.description || 'No description.'}</p>
                </div>
                {preview.teamMembers?.length > 0 && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl" style={{background:'#ffffff08',border:'1px solid rgba(255,255,255,0.06)'}}>
                    <Users style={{width:14,height:14,color:'#64748b',marginTop:2,flexShrink:0}} />
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Team</p>
                      <p className="text-sm text-white">{preview.teamMembers.join(', ')}</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.05]">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck style={{width:14,height:14,color:'#34d399'}} />
                    Verified · <span className="text-slate-300 font-semibold">TSL-{preview.year}</span>
                  </div>
                  <div className="flex gap-2">
                    {preview.eventLink && (
                      <a href={preview.eventLink} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm text-slate-300 hover:text-white transition-all"
                        style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)'}}>
                        <ExternalLink style={{width:13,height:13}} /> Certificate
                      </a>
                    )}
                    <button className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm text-white font-semibold hover:brightness-110 transition-all"
                      style={{background:'#0a66c2',boxShadow:'0 4px 16px rgba(10,102,194,0.3)'}}>
                      <FaLinkedin style={{width:14,height:14}} /> Share
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════ ADD MODAL ═══════════════════════ */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-50 p-4">
            <motion.div initial={{opacity:0,scale:0.95,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              transition={{type:'spring',stiffness:300,damping:28}}
              className="w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
              style={{background:'#0e1420',border:'1px solid rgba(255,255,255,0.09)'}}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{background:'#6366f118',border:'1px solid #6366f130'}}>
                    <Plus style={{width:16,height:16,color:'#818cf8'}} />
                  </div>
                  <h2 className="text-base font-bold text-white">Add Achievement</h2>
                </div>
                <button onClick={() => { setShowAdd(false); setForm(blankForm); setShowCustom(false); }}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                  <X style={{width:16,height:16}} />
                </button>
              </div>

              <div className="space-y-4">
                <Field label="Title *">
                  <input className={iCls()} placeholder="e.g. 1st Prize — Smart India Hackathon 2026"
                    value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Category">
                    <div className="space-y-2">
                      <select value={showCustom?'__custom__':form.category}
                        onChange={e => { if(e.target.value==='__custom__'){setShowCustom(true);}else{setShowCustom(false);setForm({...form,category:e.target.value});} }}
                        className={iCls('cursor-pointer appearance-none')}
                        style={{background:'#0c1018',color:'#ffffff'}}>
                        {allCats.map(c => <option key={c} value={c} style={{background:'#0c1018',color:'#fff'}}>{c}</option>)}
                        <option value="__custom__" style={{background:'#0c1018',color:'#818cf8'}}>+ Add custom…</option>
                      </select>
                      <AnimatePresence>
                        {showCustom && (
                          <motion.input initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                            className={iCls()} placeholder="Custom category name…" autoFocus
                            value={form.customCategory} onChange={e=>setForm({...form,customCategory:e.target.value})} />
                        )}
                      </AnimatePresence>
                    </div>
                  </Field>
                  <Field label="Year">
                    <input className={iCls()} placeholder="2026" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} />
                  </Field>
                </div>

                <Field label="Description">
                  <textarea className={iCls('resize-none')} rows={3}
                    placeholder="Describe your role, achievement, and outcome…"
                    value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
                </Field>

                <Field label="Team Members (comma-separated)">
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input className={iCls('pl-9')} placeholder="Rahul, Priya, Aryan"
                      value={form.teamMembers} onChange={e=>setForm({...form,teamMembers:e.target.value})} />
                  </div>
                </Field>

                <Field label="Cover Image URL">
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input className={iCls('pl-9')} placeholder="Google Drive or direct image link"
                      value={form.coverImage} onChange={e=>setForm({...form,coverImage:e.target.value})} />
                  </div>
                </Field>

                <Field label="Certificate / Event Link (optional)">
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input className={iCls('pl-9')} placeholder="https://…"
                      value={form.eventLink} onChange={e=>setForm({...form,eventLink:e.target.value})} />
                  </div>
                </Field>

                {/* Featured toggle */}
                <div className="flex items-center justify-between py-3 px-4 rounded-2xl" style={{background:'#ffffff06',border:'1px solid rgba(255,255,255,0.07)'}}>
                  <div>
                    <p className="text-sm text-white font-semibold">Mark as Featured</p>
                    <p className="text-[11px] text-slate-500">Highlight on your portfolio overview</p>
                  </div>
                  <button onClick={() => setForm(f => ({...f,isFeatured:!f.isFeatured}))}
                    className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                    style={{background:form.isFeatured?'#f59e0b':'#1e293b'}}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${form.isFeatured?'translate-x-5':'translate-x-0.5'}`} />
                  </button>
                </div>

                <button disabled={saving} onClick={handleSave}
                  className="w-full py-3.5 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)',boxShadow:'0 4px 24px rgba(99,102,241,0.3)'}}>
                  {saving ? <RefreshCw style={{width:15,height:15}} className="animate-spin" /> : <Save style={{width:15,height:15}} />}
                  {saving ? 'Saving…' : 'Save Achievement'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}