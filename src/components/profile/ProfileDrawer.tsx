'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {FaGithub, FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa'
import {
  X, Save, Upload, User, Globe, Phone, MapPin, BookOpen, Briefcase, Code2, Languages, GraduationCap,
  Bell, Lock, Palette, ChevronRight, AlertCircle, CheckCircle2,
  Loader2, Info, Plus, Trash2, Eye, Download, Edit3, Shield,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface User {
  _id: string;
  name: string;
  email: string;
  rollNumber?: string;
  role?: string;
  team?: string;
  designation?: string;
  memberId?: string;
  branch?: string;
  bio?: string;
  phone?: string;
  location?: string;
  portfolio?: string;
  profileImage?: string;
  skills?: string[];
  interests?: string[];
  languages?: string[];
  currentSemester?: number;
  cgpa?: string;
  availability?: string;
  preferredDomains?: string[];
  openToCollaboration?: boolean;
  resume?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  preferences?: {
    theme?: string;
    emailNotifications?: boolean;
    coverBanner?: string;
    openToCollaboration?: boolean;
  };
  isVerified?: boolean;
  createdAt?: string;
}

interface ProfileDrawerProps {
  user: User | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 flex items-center gap-2">
      <span className="w-3 h-px bg-slate-700" />
      {children}
      <span className="flex-1 h-px bg-slate-800/60" />
    </p>
  );
}

function Field({
  label, value, onChange, placeholder, type = 'text', disabled = false, hint,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
        {label}
        {disabled && <Lock className="w-2.5 h-2.5 text-slate-600" />}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium border transition-all outline-none
          ${disabled
            ? 'bg-white/[0.02] border-white/[0.04] text-slate-600 cursor-not-allowed'
            : 'bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-600 focus:border-indigo-500/50 focus:bg-white/[0.06] hover:border-white/[0.12]'
          }`}
      />
      {hint && <p className="text-[10px] text-slate-600">{hint}</p>}
    </div>
  );
}

function TextareaField({
  label, value, onChange, placeholder, rows = 3,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-400">{label}</label>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2.5 rounded-xl text-xs font-medium border bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-600 focus:border-indigo-500/50 focus:bg-white/[0.06] hover:border-white/[0.12] transition-all outline-none resize-none"
      />
    </div>
  );
}

function Toggle({
  label, description, value, onChange,
}: {
  label: string; description?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-xs font-bold text-white">{label}</p>
        {description && <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5.5 rounded-full transition-all duration-300 flex-shrink-0
          ${value ? 'bg-indigo-500' : 'bg-white/10'}`}
        style={{ height: '22px', width: '40px' }}
      >
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-md"
        />
      </button>
    </div>
  );
}

function TagInput({
  label, tags, onChange, placeholder,
}: {
  label: string; tags: string[]; onChange: (tags: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v) && tags.length < 20) {
      onChange([...tags, v]);
      setInput('');
    }
  };

  const remove = (tag: string) => onChange(tags.filter(t => t !== tag));

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-400">{label}</label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder || 'Type and press Enter'}
          className="flex-1 px-3 py-2.5 rounded-xl text-xs font-medium border bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-600 focus:border-indigo-500/50 outline-none transition-all"
        />
        <button onClick={add} className="px-3 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-all">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map(tag => (
            <span key={tag} className="group flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 hover:border-red-500/30 hover:bg-red-500/5 transition-all">
              {tag}
              <button onClick={() => remove(tag)} className="text-slate-600 group-hover:text-red-400 transition-colors">
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
  const checks = [
    !!form.name,
    !!form.bio,
    !!form.profileImage,
    !!form.phone,
    !!form.portfolio,
    !!form.github,
    !!form.linkedin,
    (form.skills?.length || 0) > 0,
    !!form.location,
    !!form.resume,
  ];
  const filled = checks.filter(Boolean).length;
  const pct = Math.round((filled / checks.length) * 100);
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const missing = [
    !form.name && 'Full Name',
    !form.bio && 'Bio',
    !form.profileImage && 'Profile Photo',
    !form.phone && 'Phone',
    !form.portfolio && 'Portfolio',
    !form.github && 'GitHub',
    (form.skills?.length || 0) === 0 && 'Skills',
    !form.resume && 'Resume',
  ].filter(Boolean) as string[];

  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex gap-4 items-start">
      <div className="relative shrink-0">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 30 30)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">{pct}%</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-white">Profile Completion</p>
        {missing.length > 0 ? (
          <div className="mt-1.5 space-y-0.5">
            {missing.slice(0, 3).map(m => (
              <p key={m} className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />{m}
              </p>
            ))}
            {missing.length > 3 && <p className="text-[10px] text-slate-600">+{missing.length - 3} more</p>}
          </div>
        ) : (
          <p className="text-[10px] text-emerald-400 mt-1">All fields complete 🎉</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfileDrawer({ user, onClose, onSaveSuccess }: ProfileDrawerProps) {
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    location: user?.location || '',
    portfolio: user?.portfolio || '',
    github: user?.socialLinks?.github || '',
    linkedin: user?.socialLinks?.linkedin || '',
    twitter: user?.socialLinks?.twitter || '',
    instagram: user?.socialLinks?.instagram || '',
    skills: user?.skills || [] as string[],
    interests: user?.interests || [] as string[],
    languages: user?.languages || [] as string[],
    preferredDomains: user?.preferredDomains || [] as string[],
    currentSemester: String(user?.currentSemester || ''),
    cgpa: user?.cgpa || '',
    availability: user?.availability || 'available',
    openToCollaboration: user?.preferences?.openToCollaboration ?? user?.openToCollaboration ?? false,
    profileImage: user?.profileImage || '',
    coverBanner: user?.preferences?.coverBanner || '',
    resume: user?.resume || '',
    theme: user?.preferences?.theme || 'dark',
    emailNotifications: user?.preferences?.emailNotifications ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState('identity');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const profileImgRef = useRef<HTMLInputElement>(null);
  const bannerImgRef = useRef<HTMLInputElement>(null);

  const set = useCallback((key: string, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
    setHasChanges(true);
    setSaveState('idle');
  }, []);

  const handleImageUpload = (file: File, field: 'profileImage' | 'coverBanner') => {
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      if (field === 'profileImage') setImagePreview(url);
      else setBannerPreview(url);
      set(field, url);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/member-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          bio: form.bio,
          phone: form.phone,
          location: form.location,
          profileImage: form.profileImage,
          portfolio: form.portfolio,
          github: form.github,
          linkedin: form.linkedin,
          twitter: form.twitter,
          instagram: form.instagram,
          skills: form.skills,
          theme: form.theme,
          emailNotifications: form.emailNotifications,
          openToCollaboration: form.openToCollaboration,
          coverBanner: form.coverBanner,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveState('success');
        setHasChanges(false);
        onSaveSuccess();
        setTimeout(() => setSaveState('idle'), 3000);
      } else {
        setSaveState('error');
      }
    } catch {
      setSaveState('error');
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const navSections = [
    { id: 'identity', label: 'Identity', icon: User },
    { id: 'social', label: 'Social', icon: Globe },
    { id: 'skills', label: 'Skills', icon: Code2 },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'settings', label: 'Settings', icon: Bell },
  ];

  const initials = (user?.name || 'EA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-[#080c14] border-l border-white/[0.06] shadow-2xl"
        style={{ width: 'clamp(100vw, 420px, 420px)', maxWidth: '100vw' }}
      >
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <h2 className="text-sm font-black text-white">Edit Profile</h2>
              {hasChanges && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 border border-amber-500/30 text-amber-400 uppercase tracking-wide"
                >
                  Unsaved
                </motion.span>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Completion Ring */}
          <CompletionRing form={form} />

          {/* Nav Pills */}
          <div className="flex gap-1 mt-4 overflow-x-auto pb-0.5 scrollbar-none">
            {navSections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all flex-shrink-0
                  ${activeSection === s.id
                    ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                  }`}
              >
                <s.icon className="w-3 h-3" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 scrollbar-none">
          <AnimatePresence mode="wait">
            {/* ── IDENTITY ── */}
            {activeSection === 'identity' && (
              <motion.div key="identity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">

                {/* Cover Banner Upload */}
                <div>
                  <SectionLabel>Cover Banner</SectionLabel>
                  <div
                    className="relative h-24 rounded-2xl overflow-hidden cursor-pointer group border border-white/[0.06] hover:border-indigo-500/30 transition-all"
                    onClick={() => bannerImgRef.current?.click()}
                    style={{
                      background: bannerPreview || form.coverBanner
                        ? `url(${bannerPreview || form.coverBanner}) center/cover`
                        : 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                    }}
                  >
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <div className="flex items-center gap-2 text-xs text-white/70 group-hover:text-white transition-all">
                        <Upload className="w-4 h-4" />
                        <span className="font-bold">Upload Cover</span>
                      </div>
                    </div>
                    <input ref={bannerImgRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'coverBanner')} />
                  </div>
                </div>

                {/* Profile Image Upload */}
                <div>
                  <SectionLabel>Profile Photo</SectionLabel>
                  <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => profileImgRef.current?.click()}>
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                        {imagePreview || form.profileImage
                          ? <img src={imagePreview || form.profileImage} className="w-full h-full object-cover" alt="Profile" />
                          : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-black text-white">{initials}</div>
                        }
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <Upload className="w-4 h-4 text-white" />
                      </div>
                      <input ref={profileImgRef} type="file" accept="image/*" className="hidden"
                        onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'profileImage')} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white">Profile Photo</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">JPG, PNG or WebP · Max 2MB</p>
                      <button onClick={() => profileImgRef.current?.click()} className="mt-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Change Photo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Admin-controlled fields */}
                <div>
                  <SectionLabel>Managed by Admin</SectionLabel>
                  <div className="p-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.03] flex items-start gap-2 mb-3">
                    <Shield className="w-3.5 h-3.5 text-amber-500/70 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Role, Designation, Team, Roll Number, Email & Branch are managed by admins and cannot be changed here.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Email" value={user?.email || ''} disabled />
                    <Field label="Roll Number" value={user?.rollNumber || ''} disabled />
                    <Field label="Role" value={user?.role || ''} disabled />
                    <Field label="Team" value={user?.team || ''} disabled />
                    <Field label="Designation" value={user?.designation || ''} disabled />
                    <Field label="Member ID" value={user?.memberId || user?._id?.slice(-6).toUpperCase() || ''} disabled />
                  </div>
                </div>

                <div>
                  <SectionLabel>Personal Info</SectionLabel>
                  <div className="space-y-3">
                    <Field label="Full Name" value={form.name} onChange={v => set('name', v)} placeholder="Your full name" />
                    <TextareaField label="Bio" value={form.bio} onChange={v => set('bio', v)} placeholder="Tell the club about yourself — your background, what you build, what drives you..." rows={4} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} placeholder="+91 9876543210" type="tel" />
                      <Field label="Location" value={form.location} onChange={v => set('location', v)} placeholder="City, State" />
                    </div>
                  </div>
                </div>

                <div>
                  <SectionLabel>Portfolio & Resume</SectionLabel>
                  <div className="space-y-3">
                    <Field label="Portfolio Website" value={form.portfolio} onChange={v => set('portfolio', v)} placeholder="https://yourportfolio.dev" />
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">Resume URL</label>
                      <input
                        value={form.resume}
                        onChange={e => set('resume', e.target.value)}
                        placeholder="Paste Google Drive / Notion link"
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-medium border bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-600 focus:border-indigo-500/50 outline-none transition-all"
                      />
                      {form.resume && (
                        <a href={form.resume} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Preview resume
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <SectionLabel>Availability</SectionLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {['available', 'busy', 'away'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => set('availability', opt)}
                        className={`py-2 rounded-xl text-[11px] font-black uppercase tracking-wide border transition-all
                          ${form.availability === opt
                            ? opt === 'available' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                              : opt === 'busy' ? 'bg-red-500/20 border-red-500/30 text-red-400'
                              : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                            : 'bg-white/[0.02] border-white/[0.06] text-slate-500 hover:border-white/[0.12]'
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SOCIAL ── */}
            {activeSection === 'social' && (
              <motion.div key="social" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                <SectionLabel>Social Links</SectionLabel>
                <div className="space-y-3">
                  {[
                    { key: 'github', label: 'GitHub', icon: FaGithub, color: 'text-slate-300', placeholder: 'https://github.com/username' },
                    { key: 'linkedin', label: 'LinkedIn', icon: FaLinkedin, color: 'text-blue-400', placeholder: 'https://linkedin.com/in/username' },
                    { key: 'twitter', label: 'Twitter / X', icon: FaTwitter, color: 'text-sky-400', placeholder: 'https://x.com/username' },
                    { key: 'instagram', label: 'Instagram', icon: FaInstagram, color: 'text-pink-400', placeholder: 'https://instagram.com/username' },
                    { key: 'portfolio', label: 'Portfolio / Website', icon: Globe, color: 'text-emerald-400', placeholder: 'https://yoursite.dev' },
                  ].map(({ key, label, icon: Icon, color, placeholder }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                        <Icon className={`w-3 h-3 ${color}`} /> {label}
                      </label>
                      <input
                        value={(form as any)[key] || ''}
                        onChange={e => set(key, e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-medium border bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-600 focus:border-indigo-500/50 outline-none transition-all"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── SKILLS ── */}
            {activeSection === 'skills' && (
              <motion.div key="skills" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                <TagInput label="Skills" tags={form.skills} onChange={v => set('skills', v)} placeholder="e.g. React, Python, UI/UX" />
                <TagInput label="Interests" tags={form.interests} onChange={v => set('interests', v)} placeholder="e.g. Open Source, AI, Web3" />
                <TagInput label="Languages" tags={form.languages} onChange={v => set('languages', v)} placeholder="e.g. English, Hindi" />
                <TagInput label="Preferred Domains" tags={form.preferredDomains} onChange={v => set('preferredDomains', v)} placeholder="e.g. Frontend, Backend, ML" />

                <div>
                  <SectionLabel>Collaboration</SectionLabel>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 divide-y divide-white/[0.04]">
                    <Toggle
                      label="Open to Collaboration"
                      description="Let members know you're available to collaborate on projects"
                      value={form.openToCollaboration}
                      onChange={v => set('openToCollaboration', v)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ACADEMIC ── */}
            {activeSection === 'academic' && (
              <motion.div key="academic" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                <SectionLabel>Academic Details</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Branch" value={user?.branch || ''} disabled hint="Set by admin" />
                  <Field label="Current Semester" value={form.currentSemester} onChange={v => set('currentSemester', v)} placeholder="e.g. 5" type="number" />
                  <Field label="CGPA (optional)" value={form.cgpa} onChange={v => set('cgpa', v)} placeholder="e.g. 8.5" />
                  <Field label="Club Join Date" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''} disabled />
                </div>
              </motion.div>
            )}

            {/* ── SETTINGS ── */}
            {activeSection === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                <div>
                  <SectionLabel>Theme</SectionLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {['dark', 'midnight', 'dim'].map(t => (
                      <button key={t} onClick={() => set('theme', t)}
                        className={`py-2.5 rounded-xl text-[11px] font-black capitalize border transition-all
                          ${form.theme === t ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-white/[0.02] border-white/[0.06] text-slate-500 hover:border-white/[0.12]'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <SectionLabel>Notifications & Privacy</SectionLabel>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 divide-y divide-white/[0.04]">
                    <Toggle label="Email Notifications" description="Receive updates about events, blogs and club news" value={form.emailNotifications} onChange={v => set('emailNotifications', v)} />
                  </div>
                </div>

                <div>
                  <SectionLabel>Verification Status</SectionLabel>
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${user?.isVerified ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                    {user?.isVerified
                      ? <><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /><div><p className="text-xs font-bold text-emerald-400">Verified Member</p><p className="text-[10px] text-slate-500">Your account has been verified by admin</p></div></>
                      : <><AlertCircle className="w-4 h-4 text-slate-600 shrink-0" /><div><p className="text-xs font-bold text-slate-400">Not Verified</p><p className="text-[10px] text-slate-600">Contact admin to verify your account</p></div></>
                    }
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-white/[0.06] space-y-2">
          {saveState === 'success' && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-emerald-400 text-xs font-bold p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Profile saved successfully
            </motion.div>
          )}
          {saveState === 'error' && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-400 text-xs font-bold p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-3.5 h-3.5" /> Failed to save. Try again.
            </motion.div>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-black text-slate-400 border border-white/[0.06] hover:bg-white/[0.04] transition-all">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all
                ${saving || !hasChanges
                  ? 'bg-white/[0.04] text-slate-600 cursor-not-allowed border border-white/[0.06]'
                  : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                }`}
            >
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}