'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FaGithub, FaLinkedin,
  FaTwitter, FaInstagram} from 'react-icons/fa'
import {
  ArrowLeft, CheckCircle2, Copy, Share2, Globe,FileText, Calendar, BookOpen, Trophy, Eye,
  Star, Code2, MapPin, Phone, Mail, Briefcase, GraduationCap,
  Award, Users, ExternalLink, Download, Shield, Clock, Layers,
  RefreshCw, AlertCircle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileData {
  user: any;
  stats: {
    blogsWritten: number;
    approvedEvents: number;
    resourcesUploaded: number;
    achievementsCount: number;
    skillsCount: number;
    profileViews: number;
  };
  blogs: any[];
  events: any[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, accent,
}: {
  icon: any; label: string; value: number | string; accent: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex flex-col gap-2"
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <p className="text-2xl font-black text-white font-mono leading-none">{value}</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide leading-tight">{label}</p>
    </motion.div>
  );
}

function InfoRow({ icon: Icon, label, value, mono = false }: { icon: any; label: string; value: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <Icon className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">{label}</p>
        <p className={`text-xs text-slate-200 mt-0.5 ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
      </div>
    </div>
  );
}

function SocialButton({
  icon: Icon, href, label, color,
}: {
  icon: any; href?: string; label: string; color: string;
}) {
  if (!href) return null;
  return (
    <motion.a
      href={href} target="_blank" rel="noopener noreferrer"
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all group"
      style={{ '--accent': color } as any}
    >
      <Icon className="w-3.5 h-3.5 transition-colors" style={{ color }} />
      <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors">{label}</span>
      <ExternalLink className="w-3 h-3 text-slate-700 group-hover:text-slate-400 transition-colors ml-auto" />
    </motion.a>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MemberProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'blogs'>('overview');

  useEffect(() => {
    fetch('/api/user/member-profile')
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${data?.user?.name}'s Profile`, url: window.location.href });
    } else handleCopy();
  };

  // ─── Loading ───
  if (loading) return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center gap-3 text-xs font-mono text-slate-500">
      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
      Loading profile...
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-sm text-slate-400">Failed to load profile</p>
      <button onClick={() => router.back()} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Go back
      </button>
    </div>
  );

  const { user, stats, blogs, events } = data;

  const initials = (user?.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  // Profile completion
  const completionChecks = [
    !!user?.name, !!user?.bio, !!user?.profileImage, !!user?.phone,
    !!user?.portfolio, !!user?.socialLinks?.github, !!user?.socialLinks?.linkedin,
    (user?.skills?.length || 0) > 0, !!user?.location,
  ];
  const completionPct = Math.round((completionChecks.filter(Boolean).length / completionChecks.length) * 100);
  const r = 18;
  const circ = 2 * Math.PI * r;
  const ringOffset = circ - (completionPct / 100) * circ;
  const ringColor = completionPct >= 80 ? '#10b981' : completionPct >= 50 ? '#f59e0b' : '#ef4444';

  const statItems = [
    { icon: FileText, label: 'Blogs Written', value: stats.blogsWritten, accent: '#3b82f6' },
    { icon: Calendar, label: 'Events', value: stats.approvedEvents, accent: '#8b5cf6' },
    { icon: BookOpen, label: 'Resources', value: stats.resourcesUploaded, accent: '#6366f1' },
    { icon: Trophy, label: 'Achievements', value: stats.achievementsCount, accent: '#f59e0b' },
    { icon: Star, label: 'Skills', value: stats.skillsCount, accent: '#10b981' },
    { icon: Eye, label: 'Profile Views', value: stats.profileViews, accent: '#ec4899' },
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-white">

      {/* ── Cover Banner ── */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        {user?.preferences?.coverBanner
          ? <img src={user.preferences.coverBanner} className="w-full h-full object-cover" alt="Cover" />
          : (
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, #0a0f1e 0%, #1a1040 30%, #0f1628 60%, #0a0f1e 100%)',
            }}>
              {/* Ambient orbs */}
              <div className="absolute top-8 left-1/4 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl" />
              <div className="absolute bottom-0 right-1/3 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl" />
              <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-blue-500/8 blur-2xl" />
            </div>
          )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/20 to-transparent" />

        {/* Back button */}
        <div className="absolute top-5 left-4 md:left-8">
          <motion.button
            onClick={() => router.back()}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-white backdrop-blur-md hover:bg-black/60 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </motion.button>
        </div>

        {/* Share actions */}
        <div className="absolute top-5 right-4 md:right-8 flex items-center gap-2">
          <motion.button onClick={handleCopy} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-white backdrop-blur-md hover:bg-black/60 transition-all">
            {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
          </motion.button>
          <motion.button onClick={handleShare} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/80 border border-indigo-400/30 text-xs font-bold text-white backdrop-blur-md hover:bg-indigo-500 transition-all">
            <Share2 className="w-3.5 h-3.5" /> Share
          </motion.button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-20 relative z-10 pb-20">

        {/* ── Profile Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex items-end gap-5">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="relative"
            >
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl md:rounded-3xl border-2 border-white/10 overflow-hidden shadow-2xl ring-4 ring-[#080c14]">
                {user?.profileImage
                  ? <img src={user.profileImage} className="w-full h-full object-cover" alt={user.name} />
                  : <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center text-3xl font-black text-white">{initials}</div>
                }
              </div>
              {user?.isVerified && (
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-indigo-500 border-2 border-[#080c14] flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </motion.div>

            {/* Name & meta */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{user?.name}</h1>
                {user?.isVerified && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {user?.designation && (
                  <span className="text-xs text-slate-400 font-medium">{user.designation}</span>
                )}
                {user?.team && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-white/[0.05] border border-white/[0.08] text-slate-300 uppercase tracking-wide">{user.team}</span>
                  </>
                )}
                {user?.role && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-wide">{user.role}</span>
                )}
              </div>
              {(user?.location || user?.availability) && (
                <div className="flex items-center gap-3 mt-1.5">
                  {user?.location && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3" /> {user.location}
                    </span>
                  )}
                  {user?.availability && (
                    <span className={`flex items-center gap-1 text-[11px] font-bold
                      ${user.availability === 'available' ? 'text-emerald-400' : user.availability === 'busy' ? 'text-red-400' : 'text-amber-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full 
                        ${user.availability === 'available' ? 'bg-emerald-400' : user.availability === 'busy' ? 'bg-red-400' : 'bg-amber-400'}`} />
                      {user.availability}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Completion Ring */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] self-end md:self-auto">
            <div className="relative">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                <circle cx="24" cy="24" r={r} fill="none" stroke={ringColor} strokeWidth="3.5"
                  strokeDasharray={circ} strokeDashoffset={ringOffset}
                  strokeLinecap="round" transform="rotate(-90 24 24)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">{completionPct}%</span>
            </div>
            <div>
              <p className="text-xs font-black text-white">Profile</p>
              <p className="text-[10px] text-slate-500">Completion</p>
            </div>
          </motion.div>
        </div>

        {/* ── Stats Grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8"
        >
          {statItems.map((s, i) => (
            <StatCard key={i} icon={s.icon} label={s.label} value={s.value} accent={s.accent} />
          ))}
        </motion.div>

        {/* ── Content Grid ── */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* ── Left Column (Sidebar info) ── */}
          <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="space-y-5">

            {/* About */}
            <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-3">About</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {user?.bio || <span className="text-slate-600 italic">No bio written yet.</span>}
              </p>
            </div>

            {/* Details */}
            <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2">Details</p>
              <InfoRow icon={Mail} label="Email" value={user?.email} mono />
              <InfoRow icon={Phone} label="Phone" value={user?.phone} mono />
              <InfoRow icon={GraduationCap} label="Branch" value={user?.branch} />
              <InfoRow icon={Briefcase} label="Roll Number" value={user?.rollNumber} mono />
              <InfoRow icon={Layers} label="Semester" value={user?.currentSemester ? `Semester ${user.currentSemester}` : ''} />
              <InfoRow icon={Clock} label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : ''} />
              {user?.cgpa && <InfoRow icon={Award} label="CGPA" value={user.cgpa} />}
            </div>

            {/* Social Links */}
            {(user?.socialLinks?.github || user?.socialLinks?.linkedin || user?.socialLinks?.twitter || user?.socialLinks?.instagram || user?.portfolio) && (
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-3">Social Links</p>
                <div className="space-y-2">
                  <SocialButton icon={FaGithub} href={user?.socialLinks?.github} label="GitHub" color="#e2e8f0" />
                  <SocialButton icon={FaLinkedin} href={user?.socialLinks?.linkedin} label="LinkedIn" color="#60a5fa" />
                  <SocialButton icon={FaTwitter} href={user?.socialLinks?.twitter} label="Twitter / X" color="#38bdf8" />
                  <SocialButton icon={FaInstagram} href={user?.socialLinks?.instagram} label="Instagram" color="#f472b6" />
                  <SocialButton icon={Globe} href={user?.portfolio} label="Portfolio" color="#34d399" />
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-3">Quick Actions</p>
              <div className="space-y-2">
                {user?.resume && (
                  <a href={user.resume} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-xs font-bold text-slate-300 hover:text-white transition-all">
                    <Download className="w-3.5 h-3.5 text-indigo-400" /> Download Resume
                  </a>
                )}
                {user?.portfolio && (
                  <a href={user.portfolio} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-xs font-bold text-slate-300 hover:text-white transition-all">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" /> View Portfolio
                  </a>
                )}
                <button onClick={handleCopy}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-xs font-bold text-slate-300 hover:text-white transition-all">
                  <Copy className="w-3.5 h-3.5 text-slate-500" /> Copy Profile Link
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── Right Column (Main content) ── */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="md:col-span-2 space-y-5">

            {/* Skills */}
            {user?.skills?.length > 0 && (
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-3 flex items-center gap-2">
                  <Code2 className="w-3 h-3" /> Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((skill: string, i: number) => (
                    <motion.span key={i} whileHover={{ scale: 1.05 }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-indigo-500/30 hover:text-indigo-300 hover:bg-indigo-500/5 transition-all cursor-default">
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {user?.achievements?.length > 0 && (
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-3 flex items-center gap-2">
                  <Trophy className="w-3 h-3 text-amber-400" /> Achievements
                </p>
                <div className="space-y-2">
                  {user.achievements.map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-amber-500/20 transition-all">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{a.title || a}</p>
                        {a.description && <p className="text-[10px] text-slate-500 mt-0.5">{a.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex gap-1 mb-5 bg-white/[0.02] border border-white/[0.04] p-1 rounded-xl w-fit">
                {(['overview', 'activity', 'blogs'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                      ${activeTab === tab ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {/* Interests */}
                    {user?.interests?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-2">Interests</p>
                        <div className="flex flex-wrap gap-1.5">
                          {user.interests.map((interest: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-purple-500/20 bg-purple-500/5 text-purple-300">{interest}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Preferred Domains */}
                    {user?.preferredDomains?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-2">Preferred Domains</p>
                        <div className="flex flex-wrap gap-1.5">
                          {user.preferredDomains.map((d: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-emerald-500/20 bg-emerald-500/5 text-emerald-300">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Languages */}
                    {user?.languages?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-2">Languages</p>
                        <div className="flex flex-wrap gap-1.5">
                          {user.languages.map((l: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-white/[0.08] bg-white/[0.03] text-slate-300">{l}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Open to Collab */}
                    {(user?.preferences?.openToCollaboration || user?.openToCollaboration) && (
                      <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <p className="text-xs font-bold text-emerald-400">Open to Collaboration</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'blogs' && (
                  <motion.div key="blogs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    {blogs?.length > 0 ? blogs.map((b: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl border border-white/[0.05] bg-white/[0.01] flex justify-between items-start gap-3 hover:border-white/[0.10] transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{b.title}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{b.category} · {new Date(b.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
                          <Eye className="w-3 h-3" /> {b.views || 0}
                        </div>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-600 italic text-center py-6">No blogs published yet.</p>
                    )}
                  </motion.div>
                )}

                {activeTab === 'activity' && (
                  <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {events?.length > 0 ? events.map((e: any, i: number) => (
                      <div key={i} className="flex gap-3 items-start p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] transition-all">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{e.title}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(e.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-600 italic text-center py-6">No events participated yet.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}