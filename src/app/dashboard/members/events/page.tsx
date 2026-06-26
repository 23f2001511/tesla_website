'use client';

import {
  Calendar, Download, Bell, BellOff, MapPin, Clock, Users,
  CheckCircle2, Award, ChevronRight, ArrowUpRight, Eye,
  AlertCircle, GalleryHorizontal, CalendarDays, History, Search,
  Mail, Smartphone, RefreshCw, Ticket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FaLinkedin } from 'react-icons/fa';

type Category = 'Web Dev' | 'AI/ML' | 'Robotics' | 'Hackathon' | 'Cybersecurity' | 'Design';

const categoryColors: Record<Category, string> = {
  'Web Dev':       'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'AI/ML':         'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'Robotics':      'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Hackathon':     'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Cybersecurity':'bg-red-500/20 text-red-400 border-red-500/30',
  'Design':       'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = (d = 0.08) => ({ hidden: {}, show: { transition: { staggerChildren: d } } });

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Badge({ text, className = '' }: { text: string; className?: string }) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}>{text}</span>;
}

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${on ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : 'bg-white/10 border border-white/10'}`}
    >
      <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 35 }} className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md ${on ? 'bg-white left-[22px]' : 'bg-slate-500 left-0.5'}`} />
    </motion.button>
  );
}

export default function DashboardEventsPage() {
  const [serverData, setServerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [notifToggles, setNotifToggles] = useState({ push: true, email: true, whatsapp: false });
  const [activeFilter, setActiveFilter] = useState<'All' | 'Registered' | 'Open'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadEventsPipeline = async () => {
    try {
      const res = await fetch('/api/dashboard/events');
      const data = await res.json();
      if (data.success) setServerData(data);
    } catch (err) { console.error('Failed hooking into endpoint:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadEventsPipeline();
  }, []);

  const handleRegistrationToggle = async (eventId: string) => {
    try {
      const res = await fetch('/api/dashboard/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.registered ? 'Successfully Registered for Event!' : 'Registration Cancelled.');
        loadEventsPipeline();
      } else {
        alert(data.error || 'Operation execution failure.');
      }
    } catch { alert('Network pipeline execution dropped.'); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen text-xs font-mono text-slate-500 gap-2 bg-[#0d1117]">
      <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Synchronizing Live Events Registry Stream...
    </div>
  );

  const summaryStats = [
    { label: 'Total Registered', value: serverData?.stats?.totalRegistered || '0', icon: Ticket,        color: 'from-blue-500/20 to-blue-600/10',     accent: '#3b82f6' },
    { label: 'Upcoming',         value: serverData?.stats?.upcomingCount || '0',    icon: Calendar,      color: 'from-violet-500/20 to-violet-600/10', accent: '#8b5cf6' },
    { label: 'Completed',        value: serverData?.stats?.completedCount || '0',   icon: CheckCircle2,  color: 'from-emerald-500/20 to-emerald-600/10', accent: '#10b981' },
    { label: 'Certificates',     value: serverData?.stats?.certificatesCount || '0',icon: Award,         color: 'from-amber-500/20 to-amber-600/10',  accent: '#f59e0b' },
  ];

  const filteredUpcoming = (serverData?.upcoming || []).filter((ev: any) => {
    const matchFilter = activeFilter === 'All' || (activeFilter === 'Registered' ? ev.registered : !ev.registered);
    const matchSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen pb-16 space-y-6 bg-[#0d1117] text-gray-100">

      {/* ── HEADER ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <GlassCard className="relative overflow-hidden">
          <div className="absolute -top-20 -left-16 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-12 w-56 h-56 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-7 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">My Events</h1>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]" />
                  <span className="text-[11px] text-emerald-400 font-semibold">Live Connections</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm ml-1">Manage registrations, reminders, attendance and certificates.</p>
            </div>
            <div className="relative shrink-0 w-full md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search events…" className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors" />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ── NUMERICAL METRICS BAR ── */}
      <motion.div variants={stagger()} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryStats.map(s => (
          <motion.div key={s.label} variants={fadeUp}>
            <GlassCard className="p-5 hover:border-white/10 transition-all duration-300 h-full">
              <div className={`inline-flex w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} items-center justify-center mb-3`}><s.icon className="w-5 h-5" style={{ color: s.accent }} /></div>
              <p className="text-2xl font-bold text-white font-mono">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── INTERACTIVE SCHEDULES SHEET ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <GlassCard className="p-7">
          <SectionTitle title="Upcoming Events" subtitle="Events you're registered for or can still join" action={
            <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1">
              {([ 'All', 'Registered', 'Open' ] as const).map(f => (
                <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeFilter === f ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>{f}</button>
              ))}
            </div>
          } />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredUpcoming.map((ev: any, i: number) => (
                <motion.div key={ev.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ delay: 0.04 * i }} className="flex flex-col rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10] transition-all group">
                  <div className={`relative h-28 bg-gradient-to-br ${ev.gradient} flex items-center justify-center overflow-hidden`}>
                    <span className="text-5xl">{ev.icon}</span>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-3 left-3"><Badge text="Upcoming" className="bg-blue-500/30 text-blue-300 border-blue-400/30 backdrop-blur-sm" /></div>
                    <div className="absolute top-3 right-3"><Badge text={ev.category} className={`${categoryColors[ev.category as Category] || 'bg-white/10'} backdrop-blur-sm`} /></div>
                    <button onClick={() => setReminders(prev => ({ ...prev, [ev.id]: !prev[ev.id] }))} className="absolute bottom-3 right-3 w-8 h-8 rounded-xl bg-black/30 border border-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors">
                      {reminders[ev.id] ? <Bell className="w-3.5 h-3.5 text-amber-400" /> : <BellOff className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                  <div className="flex flex-col flex-1 p-4 p-4 gap-3 bg-white/[0.01]">
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors leading-snug">{ev.title}</h3>
                      <div className="space-y-1 mt-2 text-xs text-slate-400">
                        <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{ev.date}</p>
                        <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{ev.venue}</p>
                        <p className="flex items-center gap-1.5"><Users className="w-3 h-3" />{ev.seats} seats remaining</p>
                      </div>
                    </div>
                    <div className="mt-auto pt-3 border-t border-white/[0.06] flex gap-2">
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-slate-300 flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3" /> Details
                      </motion.button>
                      <button type="button" onClick={() => handleRegistrationToggle(ev.id)} className={`flex-1 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all ${ev.registered ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'}`}>
                        {ev.registered ? 'Registered' : 'Register'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>
      </motion.div>

      {/* ── COMPLETED EVENTS HISTORICAL SHEET ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <GlassCard className="p-7">
          <SectionTitle title="Completed Events" subtitle="Your event history with certificates" />
          <div className="grid md:grid-cols-2 gap-4">
            {(serverData?.completed || []).map((ev: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] transition-all group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ev.attended ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-red-500/15 border border-red-500/25'}`}>
                  {ev.attended ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate group-hover:text-slate-300 transition-colors">{ev.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ev.date}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.venue}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge text="Completed" className="bg-slate-500/15 text-slate-400 border-slate-500/25" />
                  {ev.hasCert && (
                    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 text-xs text-amber-400 font-semibold transition-all">
                      <Download className="w-3 h-3" />Cert
                    </motion.button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* ── NOTIFICATIONS SETTINGS AND TIMELINE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <GlassCard className="p-7 h-full">
            <SectionTitle title="Event Tracking Monitor" subtitle="Recent database registration updates status logs" />
            <div className="space-y-4 text-xs font-mono text-slate-400">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between"><span>Registry Node Trace:</span><span className="text-emerald-400 font-bold">Synced (200)</span></div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between"><span>Certificate Matrix Verifier:</span><span className="text-indigo-400 font-bold">100% Active</span></div>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-2">
          <GlassCard className="p-7 h-full">
            <SectionTitle title="Reminder Settings" subtitle="Manage alert configurations" />
            <div className="space-y-4">
              {[
                { key: 'push' as const,     label: 'Push Notifications', sub: 'In-app alert arrays', icon: Bell,           color: 'text-indigo-400' },
                { key: 'email' as const,    label: 'Email Reminders',    sub: 'Before sessions',     icon: Mail,           color: 'text-blue-400' },
                { key: 'whatsapp' as const, label: 'WhatsApp Alerts',    sub: 'Via system contact',  icon: Smartphone,     color: 'text-emerald-400' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center"><item.icon className={`w-4 h-4 ${item.color}`} /></div>
                    <div>
                      <p className="text-xs font-semibold text-white">{item.label}</p>
                      <p className="text-[10px] text-slate-500">{item.sub}</p>
                    </div>
                  </div>
                  <ToggleSwitch on={notifToggles[item.key]} onToggle={() => setNotifToggles(prev => ({ ...prev, [item.key]: !prev[item.key] }))} />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── CREDENTIALS CERTIFICATES GRID MATRIX ── */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-7">
          <SectionTitle title="My Certificates" subtitle="Download verified credentials index" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {(serverData?.certificates || []).map((cert: any, i: number) => (
              <div key={i} className="flex flex-col rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
                <div className={`relative h-24 bg-gradient-to-br ${cert.gradient} flex flex-col items-center justify-center gap-1`}>
                  <span className="text-4xl">{cert.icon}</span>
                  <p className="text-[9px] text-white/50 font-mono tracking-widest mt-1">{cert.id}</p>
                </div>
                <div className="p-4 flex flex-col gap-2 bg-black/10">
                  <p className="text-xs font-bold text-white truncate">{cert.event}</p>
                  <motion.button whileHover={{ scale: 1.04 }} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                    <Download className="w-3 h-3" /> PDF Export Link
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}