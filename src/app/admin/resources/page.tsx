'use client';

import { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  BookOpen, Plus, FileText, Search, ChevronDown, FolderPlus,
  Layers, Download, GraduationCap, AlertCircle, Loader2, Link2,
  FileCheck, FileSpreadsheet, RefreshCw, BarChart3, Settings,
  Eye, TrendingUp, X, ExternalLink
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface ResourceFile {
  _id: string;
  title: string;
  fileUrl: string;
  type: 'Note' | 'PYQ';
  views: number;
  downloads: number;
  createdAt: string;
}

interface SubjectResource {
  _id: string;
  department: string;
  semester: number;
  subjectName: string;
  subjectCode?: string;
  files: ResourceFile[];
}

interface ChartItem {
  name: string;
  Notes: number;
  PYQs: number;
  Total: number;
}

interface TimelineItem {
  name: string;
  Views: number;
  Downloads: number;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const AnimatedNumber = memo(({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return setDisplay(end);
    const totalMiliseconds = 500;
    const increment = Math.ceil(end / (totalMiliseconds / 16));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { clearInterval(timer); setDisplay(end); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}</>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<SubjectResource[]>([]);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [trafficTimeline, setTrafficTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Live File Preview State
  const [previewFile, setPreviewFile] = useState<ResourceFile | null>(null);

  // Custom Departments state logs
  const [departments, setDepartments] = useState<string[]>([
    'Electrical', 'Computer Science', 'Mechanical', 'Civil', 'Electronics', 'Data Science'
  ]);
  const [newDeptName, setNewDeptName] = useState('');
  const [showDeptModal, setShowDeptModal] = useState(false);

  // Filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [semFilter, setSemFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    department: 'Electrical', semester: '1', subjectName: '',
    subjectCode: '', fileTitle: '', fileUrl: '', fileType: 'Note' as 'Note' | 'PYQ'
  });
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');

  // Connected DB Analytics Counters
  const [dbTraffic, setDbTraffic] = useState({ views: 0, downloads: 0 });
  const prefersReducedMotion = useReducedMotion();

  const fetchResources = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const url = `/api/admin/resources?department=${deptFilter}&semester=${semFilter}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setResources(data.resources);
        if (data.chartData) setChartData(data.chartData);
        if (data.traffic) {
          setDbTraffic({ views: data.traffic.views, downloads: data.traffic.downloads });
          setTrafficTimeline(data.traffic.timeline);
        }
        setError('');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync content analytics catalogs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deptFilter, semFilter]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Telemetry handler + Preview Launcher
  const handleViewFile = async (file: ResourceFile) => {
    setPreviewFile(file); // Open Document Previewer UI Modal Immediately
    try {
      await fetch('/api/admin/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file._id, actionType: 'views' })
      });
      fetchResources(); // Silent refresh sync
    } catch (err) {
      console.error('Telemetry reporting failure', err);
    }
  };

  const handleDownloadTrack = async (fileId: string) => {
    try {
      await fetch('/api/admin/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, actionType: 'downloads' })
      });
      fetchResources();
    } catch (err) {
      console.error(err);
    }
  };

  const liveStats = useMemo(() => {
    let fileCount = 0;
    let notesCount = 0;
    let pyqsCount = 0;
    resources.forEach(subj => {
      fileCount += subj.files?.length || 0;
      subj.files?.forEach(f => {
        if (f.type === 'Note') notesCount++;
        if (f.type === 'PYQ') pyqsCount++;
      });
    });
    return { totalSubjects: resources.length, totalFiles: fileCount, totalNotes: notesCount, totalPYQs: pyqsCount };
  }, [resources]);

  const handleAddDepartment = () => {
    if (!newDeptName.trim()) return;
    if (departments.includes(newDeptName.trim())) { alert('Department already exists.'); return; }
    setDepartments([...departments, newDeptName.trim()]);
    setUploadForm(f => ({ ...f, department: newDeptName.trim() }));
    setNewDeptName('');
    setShowDeptModal(false);
  };

  const handleUploadSubmit = async () => {
    const { subjectName, fileTitle, fileUrl } = uploadForm;
    if (!subjectName || !fileTitle || !fileUrl) {
      setFormError('Please complete all compulsory parameters.'); return;
    }
    setUploading(true); setFormError('');
    try {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowUploadModal(false);
        setUploadForm(f => ({ ...f, fileTitle: '', fileUrl: '' }));
        await fetchResources(true);
      } else {
        setFormError(data.error || 'Repository validation breakdown.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Execution error');
    } finally {
      setUploading(false);
    }
  };

  const filteredResources = useMemo(() => {
    const q = search.toLowerCase();
    return resources.filter(res => !q || res.subjectName.toLowerCase().includes(q) || (res.subjectCode || '').toLowerCase().includes(q));
  }, [resources, search]);

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="animate-pulse bg-white/5 h-32 rounded-2xl w-full" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="animate-pulse bg-white/5 h-20 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-5 max-w-7xl mx-auto text-gray-100">
      
      {/* ── Modals Overlay View Mount System ── */}
      <AnimatePresence>
        {/* Document Live Previewer Lightbox */}
        {previewFile && (
          <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={() => setPreviewFile(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-5 w-full max-w-4xl h-[85vh] flex flex-col justify-between shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-white max-w-md truncate">{previewFile.title}</h3>
                  </div>
                  <button onClick={() => setPreviewFile(null)} className="text-gray-400 hover:text-white p-1 bg-white/5 rounded-lg">✕</button>
                </div>

                {/* Cloud Embedded Viewer Frame Layer */}
                <div className="flex-1 w-full bg-black/40 rounded-xl my-3 overflow-hidden border border-white/5 relative">
                  <iframe 
                    src={previewFile.fileUrl.replace('/view', '/preview')} 
                    className="w-full h-full border-none"
                    title={previewFile.title}
                    allow="autoplay"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Type: {previewFile.type} Log</span>
                  <div className="flex gap-2">
                    <a 
                      href={previewFile.fileUrl} target="_blank" rel="noreferrer" onClick={() => handleDownloadTrack(previewFile._id)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                    >
                      Open Link Source <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {showDeptModal && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowDeptModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Settings className="w-4 h-4 text-purple-400" /> Append Custom Branch</h3>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-500" placeholder="e.g. Chemical Engineering" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} />
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowDeptModal(false)} className="text-xs text-gray-400 font-medium px-3 py-1.5">Cancel</button>
                  <button onClick={handleAddDepartment} className="text-xs font-bold bg-purple-600 px-4 py-1.5 rounded-xl text-white">Save Department</button>
                </div>
              </motion.div>
            </div>
          </>
        )}

        {showUploadModal && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowUploadModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5"><FolderPlus className="w-4 h-4 text-emerald-400" /><h2 className="text-sm font-bold text-white">Upload Syllabus Materials</h2></div>
                  <button onClick={() => setShowUploadModal(false)} className="text-gray-400 text-sm hover:text-white">✕</button>
                </div>
                <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                  {formError && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">{formError}</div>}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1 font-medium">Department Branch</label>
                      <select className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white px-3 py-2 outline-none" value={uploadForm.department} onChange={e => setUploadForm({ ...uploadForm, department: e.target.value })}>
                        {departments.map(d => <option key={d} value={d} className="bg-gray-900">{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1 font-medium">Semester Slot</label>
                      <select className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white px-3 py-2 outline-none" value={uploadForm.semester} onChange={e => setUploadForm({ ...uploadForm, semester: e.target.value })}>
                        {SEMESTERS.map(s => <option key={s} value={s} className="bg-gray-900">Sem {s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[11px] text-gray-400 mb-1 font-medium">Subject Name *</label>
                      <input className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white px-3 py-2 outline-none" placeholder="e.g. Network Analysis" value={uploadForm.subjectName} onChange={e => setUploadForm({ ...uploadForm, subjectName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1 font-medium">Subject Code</label>
                      <input className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white px-3 py-2 outline-none" placeholder="e.g. EE-202" value={uploadForm.subjectCode} onChange={e => setUploadForm({ ...uploadForm, subjectCode: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1 font-medium">Document Title *</label>
                    <input className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white px-3 py-2 outline-none" placeholder="e.g. Midsem Papers Booklet" value={uploadForm.fileTitle} onChange={e => setUploadForm({ ...uploadForm, fileTitle: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[11px] text-gray-400 mb-1 font-medium">Document Storage URL *</label>
                      <input className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white px-3 py-2 outline-none" placeholder="https://drive.google.com/..." value={uploadForm.fileUrl} onChange={e => setUploadForm({ ...uploadForm, fileUrl: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1 font-medium">Resource Type</label>
                      <select className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white px-3 py-2 outline-none" value={uploadForm.fileType} onChange={e => setUploadForm({ ...uploadForm, fileType: e.target.value as any })}>
                        <option value="Note">Lecture Notes</option>
                        <option value="PYQ">PYQ File</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] bg-white/[0.01]">
                  <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400">Cancel</button>
                  <button onClick={handleUploadSubmit} disabled={uploading} className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white disabled:opacity-40">Confirm Matrix Upload</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Top Header Section ── */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5"><BookOpen className="w-5 h-5 text-emerald-400" /><h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">Academic Resources Matrix</h1></div>
            <p className="text-xs text-gray-400">Track structural metrics across all technical departments, branches and academic folders.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowDeptModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-purple-400 hover:bg-purple-500/10">
              <Settings className="w-3.5 h-3.5" /> Add Department
            </button>
            <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/25">
              <Plus className="w-3.5 h-3.5" /> Upload File
            </button>
          </div>
        </div>
      </div>

      {/* Premium Split Charts Row Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white/[0.015] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4 text-indigo-400" /><h3 className="text-xs font-bold text-gray-300">Departmental Assets Distribution</h3></div>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={9} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} allowDecimals={false} tickLine={false} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="bg-gray-950 border border-white/10 p-2 text-[10px] rounded-lg">
                    <p className="text-white font-bold mb-0.5">{label}</p>
                    {payload.map((p: any) => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
                  </div>
                ) : null} />
                <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />
                <Bar dataKey="Notes" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="PYQs" fill="#fb923c" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-emerald-400" /><h3 className="text-xs font-bold text-gray-300">Traffic Stream Hits Overview (DB Live)</h3></div>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficTimeline} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <defs><linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={9} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div className="bg-gray-950 border border-white/10 p-2 text-[10px] rounded-lg">{payload.map((p: any) => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>)}</div>
                ) : null} />
                <Area type="monotone" dataKey="Views" stroke="#10b981" fillOpacity={1} fill="url(#colorViews)" strokeWidth={2} />
                <Area type="monotone" dataKey="Downloads" stroke="#3b82f6" fillOpacity={0} strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Technical Subjects', value: liveStats.totalSubjects, color: '#6366f1', Icon: Layers },
          { label: 'Total Files Indexed', value: liveStats.totalFiles, color: '#34d399', Icon: FileCheck },
          { label: 'Lecture Notes Logs', value: liveStats.totalNotes, color: '#06b6d4', Icon: FileText },
          { label: 'PYQs Stack', value: liveStats.totalPYQs, color: '#fb923c', Icon: FileSpreadsheet },
          { label: 'Resource Views (DB)', value: dbTraffic.views, color: '#10b981', Icon: Eye },
          { label: 'Downloads Served (DB)', value: dbTraffic.downloads, color: '#3b82f6', Icon: Download },
        ].map((s) => (
          <div key={s.label} className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border mb-2" style={{ background: `${s.color}15`, borderColor: `${s.color}30` }}><s.Icon style={{ color: s.color, width: 14, height: 14 }} /></div>
            <p className="text-xl font-black text-white leading-none tracking-tight"><AnimatedNumber value={s.value} /></p>
            <p className="text-[10px] text-gray-500 font-medium mt-1.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          <select className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-gray-300 px-3 py-2 outline-none cursor-pointer" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d} value={d} className="bg-gray-900">{d}</option>)}
          </select>
          <select className="bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-gray-300 px-3 py-2 outline-none cursor-pointer" value={semFilter} onChange={e => setSemFilter(e.target.value)}>
            <option value="All">All Semesters</option>
            {SEMESTERS.map(s => <option key={s} value={s} className="bg-gray-900">Semester {s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 w-full sm:w-56">
          <Search className="w-3 h-3 text-gray-600" />
          <input className="bg-transparent text-gray-200 text-xs outline-none w-full" placeholder="Search parameters..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Card Layout */}
      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-4">{error}</div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-12 border border-white/[0.05] rounded-xl text-xs text-gray-500">No resources matched current view parameters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((subject) => (
            <div key={subject._id} className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between border-b border-white/[0.05] pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{subject.subjectName}</h3>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide font-semibold">{subject.department} · Sem {subject.semester} {subject.subjectCode ? `· [${subject.subjectCode}]` : ''}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">{subject.files?.length || 0} Assets</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {subject.files?.map((file) => (
                  <div key={file._id} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${file.type === 'PYQ' ? 'text-amber-400' : 'text-cyan-400'}`} />
                      <div className="truncate">
                        <p className="text-gray-200 font-medium truncate">{file.title}</p>
                        <span className="text-[9px] text-gray-500 flex items-center gap-2 mt-0.5">
                          <span>{file.type}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Eye className="w-2 h-2" /> {file.views || 0}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><Download className="w-2 h-2" /> {file.downloads || 0}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleViewFile(file)}
                        className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-indigo-500/10 transition-all"
                        title="View Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <a 
                        href={file.fileUrl} target="_blank" rel="noreferrer" onClick={() => handleDownloadTrack(file._id)}
                        className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-emerald-500/10 transition-all"
                        title="Download Asset"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}