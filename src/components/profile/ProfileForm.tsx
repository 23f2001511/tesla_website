'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGithub, FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa';
import {
  X, Save, Upload, User, Globe, Code2, GraduationCap,
  Bell, Lock, ChevronRight, AlertCircle, CheckCircle2,
  Loader2, Plus, Eye, Edit3, Shield,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserType {
  _id: string; name: string; email: string;
  rollNumber?: string; role?: string; team?: string;
  designation?: string; memberId?: string; branch?: string;
  bio?: string; phone?: string; location?: string; portfolio?: string;
  profileImage?: string; skills?: string[]; interests?: string[];
  languages?: string[]; currentSemester?: number; cgpa?: string;
  availability?: string; preferredDomains?: string[];
  openToCollaboration?: boolean; resume?: string;
  socialLinks?: { github?: string; linkedin?: string; twitter?: string; instagram?: string };
  preferences?: { theme?: string; emailNotifications?: boolean; coverBanner?: string; openToCollaboration?: boolean };
  isVerified?: boolean; createdAt?: string;
}

interface ProfileDrawerProps {
  user: UserType | null;
  onSaveSuccess: () => void;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{label}</span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
  );
}

function FieldLabel({ children, locked }: { children: React.ReactNode; locked?: boolean }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1.5">
      {children}
      {locked && <Lock className="w-2.5 h-2.5 text-slate-600" />}
    </label>
  );
}

const inputBase =
  'w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all font-medium';
const inputActive =
  `${inputBase} bg-white/[0.04] border-white/[0.09] text-white placeholder-slate-600 focus:border-indigo-500/60 focus:bg-white/[0.06] hover:border-white/[0.14]`;
const inputDisabled =
  `${inputBase} bg-white/[0.02] border-white/[0.04] text-slate-600 cursor-not-allowed`;

function Input({ label, value, onChange, placeholder, type = 'text', disabled = false, hint }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean; hint?: string;
}) {
  return (
    <div>
      <FieldLabel locked={disabled}>{label}</FieldLabel>
      <input
        type={type} value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className={disabled ? inputDisabled : inputActive}
      />
      {hint && <p className="mt-1 text-[10px] text-slate-600">{hint}</p>}
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        className={`${inputActive} resize-none leading-relaxed`}
      />
    </div>
  );
}

function Toggle({ label, description, value, onChange }: {
  label: string; description?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="pr-4">
        <p className="text-sm font-semibold text-white">{label}</p>
        {description && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative shrink-0 transition-colors duration-200"
        style={{ width: 40, height: 22, borderRadius: 11, background: value ? '#6366f1' : 'rgba(255,255,255,0.1)' }}
      >
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow"
        />
      </button>
    </div>
  );
}

function TagInput({ label, tags, onChange, placeholder }: {
  label: string; tags: string[]; onChange: (t: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v) && tags.length < 20) { onChange([...tags, v]); setInput(''); }
  };
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-2 mb-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder || 'Type and press Enter'}
          className={inputActive + ' flex-1'} />
        <button onClick={add}
          className="px-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-all">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span key={tag}
              className="group flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:border-red-500/30 hover:bg-red-500/5 transition-all">
              {tag}
              <button onClick={() => onChange(tags.filter(t => t !== tag))}
                className="text-slate-600 group-hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Completion Ring ──────────────────────────────────────────────────────────
function CompletionRing({ form }: { form: any }) {
  const checks = [!!form.name, !!form.bio, !!form.profileImage, !!form.phone, !!form.portfolio, !!form.github, !!form.linkedin, (form.skills?.length || 0) > 0, !!form.location];
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const r = 18; const circ = 2 * Math.PI * r;
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const missing = [!form.bio && 'Bio', !form.profileImage && 'Profile Photo', !form.phone && 'Phone', !form.portfolio && 'Portfolio', !form.github && 'GitHub', (form.skills?.length||0)===0 && 'Skills'].filter(Boolean) as string[];

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <div className="relative shrink-0">
        <svg width="46" height="46" viewBox="0 0 46 46">
          <circle cx="23" cy="23" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
          <circle cx="23" cy="23" r={r} fill="none" stroke={color} strokeWidth="3.5"
            strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
            strokeLinecap="round" transform="rotate(-90 23 23)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white">{pct}%</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white">Profile Strength</p>
        <div className="flex flex-wrap gap-x-2 mt-0.5">
          {missing.slice(0, 3).map(m => (
            <span key={m} className="text-[10px] text-slate-500">· {m}</span>
          ))}
          {missing.length > 3 && <span className="text-[10px] text-slate-600">+{missing.length - 3} more</span>}
        </div>
      </div>
      {pct === 100 && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfileForm({
  user,
  onSaveSuccess,
  onClose,
}: ProfileDrawerProps) {
  const [form, setForm] = useState({
    name:                user?.name || '',
    bio:                 user?.bio || '',
    phone:               user?.phone || '',
    location:            user?.location || '',
    portfolio:           user?.portfolio || '',
    github:              user?.socialLinks?.github || '',
    linkedin:            user?.socialLinks?.linkedin || '',
    twitter:             user?.socialLinks?.twitter || '',
    instagram:           user?.socialLinks?.instagram || '',
    skills:              user?.skills || [] as string[],
    interests:           user?.interests || [] as string[],
    languages:           user?.languages || [] as string[],
    preferredDomains:    user?.preferredDomains || [] as string[],
    currentSemester:     String(user?.currentSemester || ''),
    cgpa:                user?.cgpa || '',
    availability:        user?.availability || 'available',
    openToCollaboration: user?.preferences?.openToCollaboration ?? user?.openToCollaboration ?? false,
    profileImage:        user?.profileImage || '',
    coverBanner:         user?.preferences?.coverBanner || '',
    resume:              user?.resume || '',
    theme:               user?.preferences?.theme || 'dark',
    emailNotifications:  user?.preferences?.emailNotifications ?? true,
  });

  const [saving,        setSaving]      = useState(false);
  const [saveState,     setSaveState]   = useState<'idle'|'success'|'error'>('idle');
  const [hasChanges,    setHasChanges]  = useState(false);
  const [activeSection, setActiveSection] = useState('identity');
  const profileImgRef = useRef<HTMLInputElement>(null);
  const bannerImgRef  = useRef<HTMLInputElement>(null);

  const set = useCallback((key: string, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
    setHasChanges(true); setSaveState('idle');
  }, []);

  const handleImageUpload = (file: File, field: 'profileImage' | 'coverBanner') => {
    const reader = new FileReader();
    reader.onload = e => set(field, e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/member-profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, bio: form.bio, phone: form.phone, location: form.location,
          profileImage: form.profileImage, portfolio: form.portfolio,
          github: form.github, linkedin: form.linkedin, twitter: form.twitter, instagram: form.instagram,
          skills: form.skills, theme: form.theme, emailNotifications: form.emailNotifications,
          openToCollaboration: form.openToCollaboration, coverBanner: form.coverBanner,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveState('success'); setHasChanges(false); onSaveSuccess();
        setTimeout(() => setSaveState('idle'), 3000);
      } else { setSaveState('error'); }
    } catch { setSaveState('error'); }
    finally { setSaving(false); }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const initials = (user?.name || 'ME').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const TABS = [
    { id: 'identity', label: 'Identity', icon: User },
    { id: 'social',   label: 'Social',   icon: Globe },
    { id: 'skills',   label: 'Skills',   icon: Code2 },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'settings', label: 'Settings', icon: Bell },
  ];

  return (
    <>
      
      {/* Drawer — fixed right side, NOT full screen */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
        style={{
          width: 440,
          maxWidth: '100vw',
          background: '#0b0f1a',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* ── Header ── */}
        <div className="shrink-0 px-5 pt-5 pb-4 border-b border-white/[0.06] space-y-4">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-center">
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <h2 className="text-sm font-bold text-white">Edit Profile</h2>
              {hasChanges && (
                <motion.span initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 border border-amber-500/25 text-amber-400 uppercase tracking-wide">
                  Unsaved
                </motion.span>
              )}
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Completion */}
          <CompletionRing form={form} />

          {/* Tab pills */}
          <div className="flex gap-1 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveSection(t.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all"
                style={activeSection === t.id
                  ? { background: '#6366f118', border: '1px solid #6366f130', color: '#818cf8' }
                  : { background: 'transparent', border: '1px solid transparent', color: '#64748b' }
                }>
                <t.icon className="w-3 h-3" />{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6" style={{ scrollbarWidth: 'none' }}>
          <AnimatePresence mode="wait">

            {/* ── IDENTITY ── */}
            {activeSection === 'identity' && (
              <motion.div key="identity" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-6">

                {/* Cover banner */}
                <div>
                  <SectionDivider label="Cover Banner" />
                  <div
                    onClick={() => bannerImgRef.current?.click()}
                    className="mt-2 h-24 rounded-2xl overflow-hidden cursor-pointer border border-white/[0.07] hover:border-indigo-500/30 transition-all relative group"
                    style={{ background: form.coverBanner ? `url(${form.coverBanner}) center/cover` : 'linear-gradient(135deg,#0f172a,#1e1b4b,#0f172a)' }}>
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center gap-2 text-white/60 group-hover:text-white text-xs font-semibold">
                      <Upload className="w-4 h-4" /> Upload Cover
                    </div>
                    <input ref={bannerImgRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'coverBanner')} />
                  </div>
                </div>

                {/* Profile photo */}
                <div>
                  <SectionDivider label="Profile Photo" />
                  <div className="mt-2 flex items-center gap-4">
                    <div className="relative group cursor-pointer shrink-0" onClick={() => profileImgRef.current?.click()}>
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/[0.1] shadow-lg">
                        {form.profileImage
                          ? <img src={form.profileImage} className="w-full h-full object-cover" alt="Profile" />
                          : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-black text-white">{initials}</div>}
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <Upload className="w-4 h-4 text-white" />
                      </div>
                      <input ref={profileImgRef} type="file" accept="image/*" className="hidden"
                        onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'profileImage')} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Profile Photo</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG or WebP · Max 2MB</p>
                      <button onClick={() => profileImgRef.current?.click()}
                        className="mt-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                        <Upload className="w-3 h-3" /> Change Photo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Admin-locked fields */}
                <div>
                  <SectionDivider label="Managed by Admin" />
                  <div className="mt-2 mb-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/[0.12]">
                    <Shield className="w-3.5 h-3.5 text-amber-500/70 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-slate-500 leading-relaxed">Role, team, branch, email & roll number are set by admins.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Email"       value={user?.email || ''}       disabled />
                    <Input label="Roll Number" value={user?.rollNumber || ''}  disabled />
                    <Input label="Role"        value={user?.role || ''}        disabled />
                    <Input label="Team"        value={user?.team || ''}        disabled />
                    <Input label="Designation" value={user?.designation || ''} disabled />
                    <Input label="Member ID"   value={user?.memberId || user?._id?.slice(-6).toUpperCase() || ''} disabled />
                  </div>
                </div>

                {/* Personal info */}
                <div>
                  <SectionDivider label="Personal Info" />
                  <div className="mt-2 space-y-3">
                    <Input label="Full Name" value={form.name} onChange={v => set('name', v)} placeholder="Your full name" />
                    <Textarea label="Bio" value={form.bio} onChange={v => set('bio', v)}
                      placeholder="Tell the club about yourself — your background, what you build, what drives you…" rows={4} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Phone"    value={form.phone}    onChange={v => set('phone', v)}    placeholder="+91 9876543210" type="tel" />
                      <Input label="Location" value={form.location} onChange={v => set('location', v)} placeholder="City, State" />
                    </div>
                  </div>
                </div>

                {/* Portfolio + Resume */}
                <div>
                  <SectionDivider label="Portfolio & Resume" />
                  <div className="mt-2 space-y-3">
                    <Input label="Portfolio Website" value={form.portfolio} onChange={v => set('portfolio', v)} placeholder="https://yourportfolio.dev" />
                    <div>
                      <FieldLabel>Resume URL</FieldLabel>
                      <input value={form.resume} onChange={e => set('resume', e.target.value)}
                        placeholder="Paste Google Drive or Notion link"
                        className={inputActive} />
                      {form.resume && (
                        <a href={form.resume} target="_blank" rel="noopener noreferrer"
                          className="mt-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                          <Eye className="w-3 h-3" /> Preview resume
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <SectionDivider label="Availability" />
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      { v: 'available', label: 'Available', color: '#10b981' },
                      { v: 'busy',      label: 'Busy',      color: '#ef4444' },
                      { v: 'away',      label: 'Away',      color: '#f59e0b' },
                    ].map(opt => (
                      <button key={opt.v} onClick={() => set('availability', opt.v)}
                        className="py-2 rounded-xl text-xs font-semibold border transition-all"
                        style={form.availability === opt.v
                          ? { background: `${opt.color}18`, borderColor: `${opt.color}40`, color: opt.color }
                          : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)', color: '#475569' }
                        }>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SOCIAL ── */}
            {activeSection === 'social' && (
              <motion.div key="social" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-3">
                <SectionDivider label="Social Links" />
                {[
                  { key: 'github',    label: 'GitHub',          icon: FaGithub,    color: '#94a3b8', placeholder: 'https://github.com/username' },
                  { key: 'linkedin',  label: 'LinkedIn',         icon: FaLinkedin,  color: '#3b82f6', placeholder: 'https://linkedin.com/in/username' },
                  { key: 'twitter',   label: 'Twitter / X',      icon: FaTwitter,   color: '#38bdf8', placeholder: 'https://x.com/username' },
                  { key: 'instagram', label: 'Instagram',         icon: FaInstagram, color: '#ec4899', placeholder: 'https://instagram.com/username' },
                  { key: 'portfolio', label: 'Portfolio',         icon: Globe,       color: '#34d399', placeholder: 'https://yoursite.dev' },
                ].map(({ key, label, icon: Icon, color, placeholder }) => (
                  <div key={key}>
                    <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 mb-1.5">
                      <Icon style={{ color }} className="w-3.5 h-3.5" /> {label}
                    </label>
                    <input value={(form as any)[key] || ''} onChange={e => set(key, e.target.value)}
                      placeholder={placeholder} className={inputActive} />
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── SKILLS ── */}
            {activeSection === 'skills' && (
              <motion.div key="skills" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-5">
                <SectionDivider label="Skills & Interests" />
                <TagInput label="Skills"            tags={form.skills}           onChange={v => set('skills', v)}           placeholder="e.g. React, Python, UI/UX" />
                <TagInput label="Interests"         tags={form.interests}        onChange={v => set('interests', v)}        placeholder="e.g. Open Source, AI, Web3" />
                <TagInput label="Languages"         tags={form.languages}        onChange={v => set('languages', v)}        placeholder="e.g. English, Hindi" />
                <TagInput label="Preferred Domains" tags={form.preferredDomains} onChange={v => set('preferredDomains', v)} placeholder="e.g. Frontend, Backend, ML" />
                <div>
                  <SectionDivider label="Collaboration" />
                  <div className="mt-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 divide-y divide-white/[0.04]">
                    <Toggle
                      label="Open to Collaboration"
                      description="Let other members know you're available to collaborate on projects"
                      value={form.openToCollaboration}
                      onChange={v => set('openToCollaboration', v)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ACADEMIC ── */}
            {activeSection === 'academic' && (
              <motion.div key="academic" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-4">
                <SectionDivider label="Academic Details" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Branch"           value={user?.branch || ''}         disabled hint="Set by admin" />
                  <Input label="Current Semester" value={form.currentSemester}       onChange={v => set('currentSemester', v)} placeholder="e.g. 5" type="number" />
                  <Input label="CGPA (optional)"  value={form.cgpa}                  onChange={v => set('cgpa', v)}            placeholder="e.g. 8.5" />
                  <Input label="Club Join Date"   value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''} disabled />
                </div>
              </motion.div>
            )}

            {/* ── SETTINGS ── */}
            {activeSection === 'settings' && (
              <motion.div key="settings" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-5">
                {/* Theme */}
                <div>
                  <SectionDivider label="Theme" />
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {['dark', 'midnight', 'dim'].map(t => (
                      <button key={t} onClick={() => set('theme', t)}
                        className="py-2.5 rounded-xl text-xs font-semibold capitalize border transition-all"
                        style={form.theme === t
                          ? { background: '#6366f118', borderColor: '#6366f140', color: '#818cf8' }
                          : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)', color: '#475569' }
                        }>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <SectionDivider label="Notifications & Privacy" />
                  <div className="mt-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 divide-y divide-white/[0.04]">
                    <Toggle
                      label="Email Notifications"
                      description="Receive updates about events, blogs and club news"
                      value={form.emailNotifications}
                      onChange={v => set('emailNotifications', v)}
                    />
                  </div>
                </div>

                {/* Verification */}
                <div>
                  <SectionDivider label="Account Status" />
                  <div className="mt-2 flex items-center gap-3 p-3.5 rounded-2xl border"
                    style={user?.isVerified
                      ? { borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)' }
                      : { borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    {user?.isVerified
                      ? <><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div><p className="text-sm font-semibold text-emerald-400">Verified Member</p><p className="text-[11px] text-slate-500 mt-0.5">Verified by admin</p></div></>
                      : <><AlertCircle className="w-4 h-4 text-slate-600 shrink-0" />
                          <div><p className="text-sm font-semibold text-slate-400">Not Verified</p><p className="text-[11px] text-slate-600 mt-0.5">Contact admin to verify your account</p></div></>
                    }
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-5 py-4 border-t border-white/[0.06] space-y-2.5">
          <AnimatePresence>
            {saveState === 'success' && (
              <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                className="flex items-center gap-2 text-emerald-400 text-xs font-semibold p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Profile saved successfully!
              </motion.div>
            )}
            {saveState === 'error' && (
              <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                className="flex items-center gap-2 text-red-400 text-xs font-semibold p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-3.5 h-3.5" /> Failed to save. Try again.
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 border border-white/[0.07] hover:bg-white/[0.04] transition-all">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !hasChanges}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={saving || !hasChanges
                ? { background: 'rgba(255,255,255,0.04)', color: '#475569', cursor: 'not-allowed', border: '1px solid rgba(255,255,255,0.06)' }
                : { background: '#4f46e5', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }
              }>
              {saving
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                : <><Save className="w-3.5 h-3.5" /> Save Changes</>
              }
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}