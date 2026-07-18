'use client';

import { 
  Trophy, Plus, Trash2, Edit2, Eye, Search, Filter, CheckCircle2, 
  Clock, AlertCircle, RefreshCw, X, Save, Image as ImageIcon, Link2, 
  ExternalLink, Users, Calendar, MapPin, Building, Tag, Check, Ban, Star
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-black/20 ${className}`}>{children}</div>;
}

// Smart URL Extractor
const parseImageLink = (url: string) => {
  if (!url) return '';
  const match = url.trim().match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.trim().match(/id=([a-zA-Z0-9_-]+)/);
  return match ? `https://docs.google.com/uc?export=view&id=${match[1]}` : url.trim();
};

export default function AdminClubAchievements() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [featuredFilter, setFeaturedFilter] = useState('All');

  const blankForm = {
    title: '', description: '', category: 'Hackathon', teamMembers: '', coverImage: '',
    gallery: '', venue: '', achievementDate: '', organizer: '', tags: '', eventLink: '', isFeatured: false
  };
  const [form, setForm] = useState(blankForm);

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/user/me');
      const userData = await userRes.json();
      if (userData.success) setCurrentUser(userData.user);

      const res = await fetch('/api/admin/achievements');
      const data = await res.json();
      if (data.success) setAchievements(data.achievements || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const isSuperManager = ['Admin', 'President', 'OfficeBearer'].includes(currentUser?.role);

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.teamMembers || !form.coverImage || !form.achievementDate) {
      return alert('Missing required fields: Title, Description, Team, Cover Image, Date.');
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        coverImage: parseImageLink(form.coverImage),
        gallery: form.gallery.split(',').map(parseImageLink).join(',')
      };

      const url = editingItem ? `/api/admin/achievements` : '/api/admin/achievements';
      const method = editingItem ? 'PUT' : 'POST';
      if (editingItem) (payload as any).id = editingItem.id;

      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowFormModal(false); setEditingItem(null); fetchData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Submission failed.');
      }
    } catch { alert('Network error.'); } 
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/achievements`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status })
      });
      fetchData();
    } catch { alert('Failed to update status.'); }
  };

  const handleDelete = async (item: any) => {
    if (!isSuperManager && (item.uploadedBy !== currentUser?._id || item.status !== 'Pending')) {
      return alert('You can only delete your own pending achievements.');
    }
    if (!confirm('Permanently delete this achievement?')) return;
    await fetch(`/api/admin/achievements?id=${item.id}`, { method: 'DELETE' });
    fetchData();
  };

  const openEdit = (item: any) => {
    if (!isSuperManager && (item.uploadedBy !== currentUser?._id || item.status !== 'Pending')) {
      return alert('You can only edit your own pending achievements.');
    }
    setForm({
      title: item.title, description: item.description, category: item.category,
      teamMembers: item.teamMembers?.join(', ') || '', coverImage: item.coverImage || '',
      gallery: item.gallery?.join(', ') || '', venue: item.venue || '',
      achievementDate: new Date(item.achievementDate).toISOString().split('T')[0],
      organizer: item.organizer || '', tags: item.tags?.join(', ') || '',
      eventLink: item.eventLink || '', isFeatured: item.isFeatured || false
    });
    setEditingItem(item);
    setShowFormModal(true);
  };

  const filteredItems = useMemo(() => {
    return achievements.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchSearch = item.title?.toLowerCase().includes(q) || item.teamMembers?.join(' ').toLowerCase().includes(q);
      const matchCat = catFilter === 'All' || item.category === catFilter;
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchFeat = featuredFilter === 'All' || (featuredFilter === 'Featured' ? item.isFeatured : !item.isFeatured);
      return matchSearch && matchCat && matchStatus && matchFeat;
    });
  }, [achievements, searchQuery, catFilter, statusFilter, featuredFilter]);

  if (loading) return <div className="flex items-center justify-center h-screen"><RefreshCw className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen pb-16 space-y-6 bg-[#0d1117] text-gray-100 p-4 md:p-6 select-none">
      
      {/* HEADER */}
      <GlassCard className="p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" /> Club Achievements
            </h1>
            <p className="text-xs text-slate-400 mt-1">Manage global club milestones, hackathon wins, and open source records.</p>
          </div>
          <button onClick={() => { setForm(blankForm); setEditingItem(null); setShowFormModal(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-lg">
            <Plus className="w-4 h-4" /> Add Achievement
          </button>
        </div>
      </GlassCard>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-white/[0.01] border border-white/[0.05] rounded-2xl text-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search title or team..." className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 outline-none focus:border-primary" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-300 outline-none">
          <option value="All">All Categories</option>
          <option value="Hackathon">Hackathon</option>
          <option value="Open Source">Open Source</option>
          <option value="Project Milestone">Project Milestone</option>
          <option value="Research Paper">Research Paper</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-300 outline-none">
          <option value="All">All Statuses</option>
          <option value="Published">Published</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select value={featuredFilter} onChange={e => setFeaturedFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-300 outline-none">
          <option value="All">All Features</option>
          <option value="Featured">Featured Only</option>
        </select>
      </div>

      {/* TABLE */}
      <GlassCard className="overflow-hidden p-2">
        <div className="overflow-x-auto rounded-2xl border border-white/[0.04]">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/[0.06] text-slate-500">
                <th className="p-4 font-bold">Achievement</th>
                <th className="p-4 font-bold">Team</th>
                <th className="p-4 font-bold">Uploaded By</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-all">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 bg-black/40 rounded-lg overflow-hidden border border-white/5 shrink-0">
                        {item.coverImage ? <img src={item.coverImage} className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-slate-500 m-auto mt-3" />}
                      </div>
                      <div>
                        <span className="font-bold text-white block truncate max-w-[180px] flex items-center gap-1.5">
                          {item.title} {item.isFeatured && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase mt-0.5 block">{item.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400 truncate max-w-[150px]">{item.teamMembers?.join(', ')}</td>
                  <td className="p-4 text-slate-500">{item.uploaderName}</td>
                  <td className="p-4 text-slate-500 font-mono">{new Date(item.achievementDate).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                      item.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      item.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>{item.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedItem(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5"><Eye className="w-3.5 h-3.5" /></button>
                      
                      {isSuperManager && item.status === 'Pending' && (
                        <>
                          <button onClick={() => updateStatus(item.id, 'Published')} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 bg-white/5"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => updateStatus(item.id, 'Rejected')} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 bg-white/5"><Ban className="w-3.5 h-3.5" /></button>
                        </>
                      )}

                      {(isSuperManager || (item.uploadedBy === currentUser?._id && item.status === 'Pending')) && (
                        <>
                          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 bg-white/5"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 bg-white/5"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && <div className="p-10 text-center text-slate-500 text-xs">No records found.</div>}
        </div>
      </GlassCard>

      {/* ── DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-[#0f141c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative text-xs text-slate-300 max-h-[90vh] overflow-y-auto scrollbar-none">
              <div className="relative h-56 bg-slate-950">
                {selectedItem.coverImage && <img src={selectedItem.coverImage} className="w-full h-full object-cover opacity-60" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f141c] to-transparent" />
                <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 p-1.5 bg-black/50 text-white rounded-lg"><X className="w-4 h-4" /></button>
                {selectedItem.isFeatured && <span className="absolute top-4 left-4 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400" /> Featured</span>}
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <h3 className="text-xl font-black text-white">{selectedItem.title}</h3>
                  <p className="text-[10px] text-primary font-mono uppercase tracking-wider mt-1">{selectedItem.category}</p>
                </div>
                <p className="text-slate-400 leading-relaxed text-sm">{selectedItem.description}</p>
                
                <div className="grid grid-cols-2 gap-4 font-mono bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                  <div className="flex items-start gap-2"><Users className="w-4 h-4 shrink-0 text-slate-500" /> <div><span className="block text-slate-500 mb-1">Team</span><span className="text-white">{selectedItem.teamMembers?.join(', ')}</span></div></div>
                  <div className="flex items-start gap-2"><Calendar className="w-4 h-4 shrink-0 text-slate-500" /> <div><span className="block text-slate-500 mb-1">Date</span><span className="text-white">{new Date(selectedItem.achievementDate).toLocaleDateString()}</span></div></div>
                  {selectedItem.venue && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 shrink-0 text-slate-500" /> <div><span className="block text-slate-500 mb-1">Venue</span><span className="text-white">{selectedItem.venue}</span></div></div>}
                  {selectedItem.organizer && <div className="flex items-start gap-2"><Building className="w-4 h-4 shrink-0 text-slate-500" /> <div><span className="block text-slate-500 mb-1">Organizer</span><span className="text-white">{selectedItem.organizer}</span></div></div>}
                </div>

                {selectedItem.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Tag className="w-4 h-4 text-slate-500" /> {selectedItem.tags.map((t: string, i: number) => <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-[10px]">{t}</span>)}
                  </div>
                )}
                
                {selectedItem.gallery?.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-bold text-slate-500 uppercase tracking-widest">Gallery</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {selectedItem.gallery.map((g: string, i: number) => <img key={i} src={g} className="w-24 h-24 object-cover rounded-xl border border-white/10 shrink-0" />)}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-slate-500 font-mono">Uploaded by {selectedItem.uploaderName}</span>
                  {selectedItem.eventLink && <a href={selectedItem.eventLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 bg-blue-500/10 px-4 py-2 rounded-xl font-bold"><ExternalLink className="w-3.5 h-3.5" /> Reference Link</a>}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CREATE / EDIT MODAL ── */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl bg-[#0f141c] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto scrollbar-none">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> {editingItem ? 'Edit Achievement' : 'Add New Achievement'}</h3>
                <button onClick={() => setShowFormModal(false)} className="text-slate-500"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-slate-400 mb-1">Title *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl outline-none" /></div>
                  <div>
                    <label className="block text-slate-400 mb-1">Category *</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl outline-none bg-[#0f141c]">
                      <option>Hackathon</option><option>Open Source</option><option>Project Milestone</option><option>Research Paper</option><option>Other</option>
                    </select>
                  </div>
                </div>

                <div><label className="block text-slate-400 mb-1">Description *</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl outline-none resize-none" /></div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-slate-400 mb-1">Cover Image URL *</label><input value={form.coverImage} onChange={e => setForm({...form, coverImage: e.target.value})} className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl outline-none text-blue-400 font-mono" placeholder="Drive / Image Link" /></div>
                  <div><label className="block text-slate-400 mb-1">Achievement Date *</label><input type="date" value={form.achievementDate} onChange={e => setForm({...form, achievementDate: e.target.value})} className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl outline-none" style={{ colorScheme: 'dark' }} /></div>
                </div>

                <div><label className="block text-slate-400 mb-1">Team Members (Comma separated) *</label><input value={form.teamMembers} onChange={e => setForm({...form, teamMembers: e.target.value})} className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl outline-none" /></div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-slate-400 mb-1">Venue</label><input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl outline-none" /></div>
                  <div><label className="block text-slate-400 mb-1">Organizer</label><input value={form.organizer} onChange={e => setForm({...form, organizer: e.target.value})} className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl outline-none" /></div>
                </div>

                <div><label className="block text-slate-400 mb-1">Gallery Images (Comma separated URLs)</label><input value={form.gallery} onChange={e => setForm({...form, gallery: e.target.value})} className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl outline-none font-mono" /></div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-slate-400 mb-1">Tags (Comma separated)</label><input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl outline-none" /></div>
                  <div><label className="block text-slate-400 mb-1">External Link</label><input value={form.eventLink} onChange={e => setForm({...form, eventLink: e.target.value})} className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl outline-none text-blue-400" /></div>
                </div>

                {isSuperManager && (
                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({...form, isFeatured: e.target.checked})} className="w-4 h-4 accent-amber-500 cursor-pointer" />
                    <label className="text-amber-400 font-bold">Mark as Featured Achievement</label>
                  </div>
                )}

                <button disabled={saving} onClick={handleSubmit} className="w-full bg-primary py-3 rounded-xl font-bold text-white transition-all mt-4 flex items-center justify-center gap-2">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editingItem ? 'Update Record' : 'Submit Achievement'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}