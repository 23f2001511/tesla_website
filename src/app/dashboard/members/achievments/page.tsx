'use client';

import { Trophy, Plus, CheckCircle2, ShieldCheck, Eye, RefreshCw, X, Calendar, Users, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-black/20 ${className}`}>{children}</div>;
}

export default function MemberClubAchievementsView() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const loadAchievementsPipeline = async () => {
    try {
      const userRes = await fetch('/api/user/me');
      const userData = await userRes.json();
      if (userData.success) setCurrentUser(userData.user);

      const res = await fetch('/api/admin/achievements');
      const data = await res.json();
      if (data.success) {
        // Enforce boundary logic criteria rule condition: members list filters
        setItems(data.achievements || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAchievementsPipeline(); }, []);

  // Requirement 8 Permission Check Logic
  const hasManagerGrant = currentUser?.permissions?.includes('achievements:manage') || 
                          ['Admin', 'President', 'OfficeBearer'].includes(currentUser?.role);

  // Filter out pending logs array from standard public member view profiles
  const visibleItems = hasManagerGrant 
    ? items 
    : items.filter(i => i.status === 'Published' || !i.status);

  if (loading) return (
    <div className="flex justify-center items-center h-screen text-xs font-mono text-slate-500 gap-2 bg-[#0d1117]">
      <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Mapping Global Club Trophies...
    </div>
  );

  return (
    <div className="min-h-screen pb-16 bg-[#0d1117] text-gray-100 space-y-6 p-4 md:p-0">
      
      {/* HEADER SECTION */}
      <GlassCard className="p-6 border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Club Accomplishments Roll</h1>
            <p className="text-xs text-slate-400 mt-1">Explore placements milestones, certifications tracks, and elite wins accumulated globally.</p>
          </div>
          
          {hasManagerGrant && (
            <button onClick={() => router.push('/admin/achievements')} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl uppercase tracking-wider shadow-lg">
              <Plus className="w-4 h-4" /> Upload Milestone (Manager Mode)
            </button>
          )}
        </div>
      </GlassCard>

      {/* MATRIX DISPLAYS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleItems.map((ach, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] hover:border-white/10 overflow-hidden flex flex-col justify-between group cursor-pointer" onClick={() => setSelectedItem(ach)}>
            <div className="h-32 bg-black/40 border-b border-white/[0.05] relative overflow-hidden flex items-center justify-center">
              {ach.poster ? <img src={ach.poster} className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500" /> : <Trophy className="w-6 h-6 text-slate-700" />}
              <span className="absolute top-3 left-3 text-[9px] font-black bg-black/60 px-2 py-0.5 rounded border border-white/10 text-primary tracking-wider uppercase font-mono">{ach.category}</span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-black text-white group-hover:text-primary transition-colors leading-snug line-clamp-1">{ach.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium mt-1 line-clamp-2">{ach.description}</p>
              </div>
              <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Team: {Array.isArray(ach.teamMembers) ? ach.teamMembers[0] : ach.teamMembers?.split(',')[0]}...</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ach.year}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {visibleItems.length === 0 && (
        <div className="p-8 text-center text-slate-600 font-mono text-xs max-w-sm mx-auto"><AlertCircle className="w-5 h-5 mx-auto mb-1.5 opacity-40" /> Zero published accomplishments available inside database models registry.</div>
      )}

      {/* DETAILED OVERLAY MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-[#0f141c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative text-xs text-slate-300">
              <div className="relative h-40 bg-slate-950 flex items-center justify-center">
                {selectedItem.poster ? <img src={selectedItem.poster} className="w-full h-full object-cover opacity-40" /> : <Trophy className="w-6 h-6 text-primary" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f141c] to-transparent" />
                <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 p-1.5 bg-black/50 text-white rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[9px] font-black text-primary font-mono uppercase">{selectedItem.category}</span>
                  <h3 className="text-sm font-black text-white mt-1.5">{selectedItem.title}</h3>
                </div>
                <p className="text-slate-400 leading-relaxed font-medium">{selectedItem.description}</p>
                <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Members: {Array.isArray(selectedItem.teamMembers) ? selectedItem.teamMembers.join(', ') : selectedItem.teamMembers}</div>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED TRACK</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}