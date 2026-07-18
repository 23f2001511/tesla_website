'use client';

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ImageIcon, Plus, Search, Trash2, Film, RefreshCw, Loader2,
  FolderHeart, Eye, Settings, Camera, X, ArrowLeft, Download, Star, Pencil, Play
} from 'lucide-react';

type MediaType = 'Photo' | 'Video';
type UploadSource = 'Direct' | 'GoogleDrive';

interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  mediaUrl?: string;
  album: string;
  caption?: string;
  mediaType: MediaType;
  uploadSource: UploadSource;
  views: number;
  createdAt: string;
}

interface GalleryResponse {
  success: boolean;
  media?: GalleryItem[];
  stats?: {
    total: number;
    photos: number;
    videos: number;
    views: number;
  };
}

const ALBUM_COVERS_STORAGE_KEY = 'tesla_gallery_album_covers';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extract Google Drive file-id from any Drive share / view URL */
function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

// ── Animated counter ──────────────────────────────────────────────────────────
const AnimatedNumber = memo(({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return setDisplay(end);
    const timer = setInterval(() => {
      start += Math.ceil((end - start) / 10);
      if (start >= end) { clearInterval(timer); setDisplay(end); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}</>;
});
AnimatedNumber.displayName = 'AnimatedNumber';

// ── Video player component (auto-detects Drive vs Direct from the URL itself) ─
function VideoPlayer({ item, className = '' }: { item: GalleryItem; className?: string }) {
  if (!item.mediaUrl) {
    return (
      <div className={`flex items-center justify-center bg-black/60 rounded-lg text-gray-500 text-xs ${className}`}>
        No video URL provided
      </div>
    );
  }

  // Detect Drive links from the URL itself instead of trusting the stored
  // uploadSource field — prevents mismatched/mistagged entries from breaking.
  const driveId = extractDriveFileId(item.mediaUrl);

  if (driveId) {
    const embedUrl = `https://drive.google.com/file/d/${driveId}/preview`;
    return (
      <iframe
        src={embedUrl}
        className={`w-full aspect-video rounded-lg bg-black border border-white/5 ${className}`}
        allow="autoplay; fullscreen"
        allowFullScreen
        title={item.title}
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
    );
  }

  // Direct hosted video
  return (
    <video
      src={item.mediaUrl}
      poster={item.imageUrl || undefined}
      controls
      autoPlay
      playsInline
      className={`max-h-[65vh] w-full rounded-lg shadow-md object-contain ${className}`}
      onError={(e) => {
        const target = e.currentTarget;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent && !parent.querySelector('.video-fallback')) {
          const fallback = document.createElement('div');
          fallback.className = 'video-fallback flex flex-col items-center justify-center gap-2 py-10 text-center';
          fallback.innerHTML = `
            <p class="text-red-400 text-xs font-bold">Video failed to load.</p>
            <a href="${item.mediaUrl}" target="_blank" rel="noopener noreferrer"
               class="text-blue-400 text-xs underline">Open directly</a>
          `;
          parent.appendChild(fallback);
        }
      }}
    >
      Your browser does not support this video format.
    </video>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminGalleryPage() {
  const [media, setMedia] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [albums, setAlbums] = useState<string[]>([]);
  const [albumCovers, setAlbumCovers] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = window.localStorage.getItem(ALBUM_COVERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) as Record<string, string> : {};
    } catch { return {}; }
  });
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [newAlbumInput, setNewAlbumInput] = useState('');
  const [newAlbumCoverInput, setNewAlbumCoverInput] = useState('');

  const [coverPickerAlbum, setCoverPickerAlbum] = useState<string | null>(null);
  const [coverPickerUrlInput, setCoverPickerUrlInput] = useState('');

  const [activeLightboxImage, setActiveLightboxImage] = useState<GalleryItem | null>(null);

  const [innerPipeline, setInnerPipeline] = useState<MediaType>('Photo');
  const [search, setSearch] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    mediaUrl: '',
    album: '',
    caption: '',
    mediaType: 'Photo' as MediaType,
    uploadSource: 'Direct' as UploadSource,
    setAsCover: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [liveCounters, setLiveCounters] = useState({ total: 0, photos: 0, videos: 0, views: 0 });
  const prefersReducedMotion = useReducedMotion();

  // ── Album cover helpers ───────────────────────────────────────────────────
  const setCover = useCallback((albumName: string, url: string) => {
    if (!albumName) return;
    setAlbumCovers(prev => {
      const next = { ...prev, [albumName]: url };
      try { localStorage.setItem(ALBUM_COVERS_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearCover = useCallback((albumName: string) => {
    setAlbumCovers(prev => {
      if (!(albumName in prev)) return prev;
      const next = { ...prev };
      delete next[albumName];
      try { localStorage.setItem(ALBUM_COVERS_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchGallery = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/gallery?album=All&mediaType=All`, { cache: 'no-store' });
      const data = await res.json() as GalleryResponse;
      if (data.success) {
        const galleryMedia = data.media ?? [];
        setMedia(galleryMedia);
        if (data.stats) setLiveCounters(data.stats);

        const dbAlbums = Array.from(new Set(galleryMedia.map(m => m.album)));
        if (dbAlbums.length > 0) {
          setAlbums(prev => {
            const merged = Array.from(new Set([...prev, ...dbAlbums]));
            return merged.length === prev.length ? prev : merged;
          });
        }
        setError('');
      } else {
        setError('Failed to load gallery data.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  // ── Album actions ─────────────────────────────────────────────────────────
  const handleAddAlbum = () => {
    const clean = newAlbumInput.trim();
    if (!clean) return;
    if (albums.includes(clean)) { alert('An album with this name already exists.'); return; }
    setAlbums(prev => [...prev, clean]);
    if (newAlbumCoverInput.trim()) setCover(clean, newAlbumCoverInput.trim());
    setForm(f => ({ ...f, album: clean }));
    setNewAlbumInput('');
    setNewAlbumCoverInput('');
  };

  const handleDeleteAlbumFolder = (albumName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const count = media.filter(m => m.album === albumName).length;
    if (count > 0) { alert('Delete all assets inside this album before removing it.'); return; }
    if (!confirm(`Permanently remove album "${albumName}"?`)) return;
    setAlbums(prev => prev.filter(a => a !== albumName));
    clearCover(albumName);
    if (selectedAlbum === albumName) setSelectedAlbum(null);
  };

  const openUploadModal = () => {
    if (albums.length === 0) { setShowAlbumModal(true); return; }
    setForm(f => ({ ...f, album: selectedAlbum || albums[0] }));
    setFormError('');
    setShowUploadModal(true);
  };

  // ── Submit (auto-corrects Drive URLs mistagged as Direct) ─────────────────
  const handleSubmit = async () => {
    setFormError('');

    if (!form.title.trim()) { setFormError('Please enter an asset name.'); return; }
    if (!form.imageUrl.trim()) { setFormError('Please enter a thumbnail image URL.'); return; }
    if (!form.album) { setFormError('Please select a destination album.'); return; }

    let finalUploadSource = form.uploadSource;

    // Video-specific validation
    if (form.mediaType === 'Video') {
      if (!form.mediaUrl.trim()) {
        setFormError('A video URL is required for video assets.');
        return;
      }

      const driveId = extractDriveFileId(form.mediaUrl.trim());

      // Auto-correct: if the URL is clearly a Drive link but "Direct" was
      // left selected, fix the source so VideoPlayer renders it correctly.
      if (driveId && form.uploadSource === 'Direct') {
        finalUploadSource = 'GoogleDrive';
        setForm(f => ({ ...f, uploadSource: 'GoogleDrive' }));
      }

      if (finalUploadSource === 'GoogleDrive' && !driveId) {
        setFormError(
          'Invalid Google Drive URL. Please use a share link like: https://drive.google.com/file/d/FILE_ID/view'
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        uploadSource: finalUploadSource,
        title: form.title.trim(),
        imageUrl: form.imageUrl.trim(),
        mediaUrl: form.mediaUrl.trim() || undefined,
        caption: form.caption.trim() || undefined,
      };

      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (form.setAsCover) setCover(form.album, form.imageUrl.trim());
        setShowUploadModal(false);
        setForm(f => ({
          ...f,
          title: '', imageUrl: '', mediaUrl: '', caption: '',
          mediaType: 'Photo', uploadSource: 'Direct', setAsCover: false,
        }));
        await fetchGallery(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        setFormError(errData?.message || `Server error (${res.status}). Please try again.`);
      }
    } catch {
      setFormError('Network error — please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete asset ──────────────────────────────────────────────────────────
  const handleDelete = async (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Permanently delete "${item.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/gallery?id=${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData?.message || 'You are not allowed to delete this asset.');
        return;
      }
      await fetchGallery(true);
    } catch { alert('Failed to delete asset. Please try again.'); }
  };

  // ── Download (use window.open for external/Drive videos to avoid CORS) ────
  const handleDownload = async (url: string, filename: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!url) return;

    const isExternal =
      url.includes('drive.google.com') ||
      url.includes('youtube.com') ||
      url.includes('vimeo.com');

    if (isExternal) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'media-asset';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // ── Filtered media ─────────────────────────────────────────────────────────
  const handleSelectAlbum = useCallback((albumName: string) => {
    setSelectedAlbum(albumName);
    setInnerPipeline('Photo');
    setSearch('');
  }, []);

  const filteredMedia = useMemo(() => {
    const q = search.toLowerCase();
    return media.filter(m => {
      const matchSearch = !q || m.title.toLowerCase().includes(q) || (m.caption || '').toLowerCase().includes(q);
      const matchPipeline = m.mediaType === innerPipeline;
      const matchAlbum = selectedAlbum ? m.album === selectedAlbum : true;
      return matchSearch && matchPipeline && matchAlbum;
    });
  }, [media, search, innerPipeline, selectedAlbum]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const albumStats = useMemo(() => {
    const statsMap: Record<string, { count: number; cover: string }> = {};
    albums.forEach(a => {
      const items = media.filter(m => m.album === a);
      const manualCover = albumCovers[a];
      const fallbackPreview = items.find(m => m.mediaType === 'Photo')?.imageUrl || items[0]?.imageUrl || '';
      statsMap[a] = { count: items.length, cover: manualCover || fallbackPreview };
    });
    return statsMap;
  }, [media, albums, albumCovers]);

  const statCards = [
    { label: 'Total Assets', value: liveCounters.total, color: '#10b981', Icon: ImageIcon },
    { label: 'Albums', value: albums.length, color: '#a78bfa', Icon: FolderHeart },
    { label: 'Photos', value: liveCounters.photos, color: '#06b6d4', Icon: Camera },
    { label: 'Videos', value: liveCounters.videos, color: '#fb923c', Icon: Film },
    { label: 'Total Views', value: liveCounters.views, color: '#facc15', Icon: Eye },
  ];

  const fadeProps = prefersReducedMotion
    ? {}
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 text-gray-500 gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      <p className="text-xs font-semibold tracking-wider text-gray-400">Loading gallery...</p>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto text-gray-100 min-w-0 font-sans">

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeLightboxImage && (
          <>
            <div
              className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100]"
              onClick={() => setActiveLightboxImage(null)}
            />
            <motion.div
              {...fadeProps}
              className="fixed inset-0 z-[101] flex flex-col items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto max-w-4xl w-full bg-gray-950/90 border border-white/10 rounded-2xl p-4 space-y-4 shadow-2xl relative">
                <button
                  onClick={() => setActiveLightboxImage(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="w-full flex justify-center bg-black/60 rounded-xl overflow-hidden p-2 min-h-[40vh] items-center">
                  {activeLightboxImage.mediaType === 'Video' ? (
                    <VideoPlayer item={activeLightboxImage} className="max-h-[65vh]" />
                  ) : (
                    <img
                      src={activeLightboxImage.imageUrl}
                      alt={activeLightboxImage.title}
                      className="max-h-[65vh] w-auto object-contain rounded-lg shadow-md"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{activeLightboxImage.title}</h3>
                    {activeLightboxImage.caption && (
                      <p className="text-xs text-gray-400 mt-1">{activeLightboxImage.caption}</p>
                    )}
                    <p className="text-[10px] font-mono text-gray-600 mt-1">
                      {activeLightboxImage.mediaType} · {activeLightboxImage.uploadSource} · {activeLightboxImage.album}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setCover(activeLightboxImage.album, activeLightboxImage.imageUrl)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                        albumCovers[activeLightboxImage.album] === activeLightboxImage.imageUrl
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/5 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      <Star
                        className="w-3.5 h-3.5"
                        fill={albumCovers[activeLightboxImage.album] === activeLightboxImage.imageUrl ? 'currentColor' : 'none'}
                      />
                      Set Cover
                    </button>
                    <button
                      onClick={(e) =>
                        handleDownload(
                          activeLightboxImage.mediaUrl || activeLightboxImage.imageUrl,
                          activeLightboxImage.title,
                          e
                        )
                      }
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Album Manager Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showAlbumModal && (
          <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40" onClick={() => setShowAlbumModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-gray-900 border border-white/15 rounded-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-emerald-400" /> Album & Cover Manager
                  </h3>
                  <button onClick={() => setShowAlbumModal(false)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                  {albums.length === 0 && (
                    <p className="text-xs text-gray-500 py-4 text-center">No albums yet. Create one below.</p>
                  )}
                  {albums.map(a => {
                    const stat = albumStats[a] || { count: 0, cover: '' };
                    return (
                      <div key={a} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl p-2.5">
                        <div className="w-12 h-12 rounded-lg bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {stat.cover
                            ? <img src={stat.cover} alt={a} className="w-full h-full object-cover" />
                            : <ImageIcon className="w-5 h-5 text-gray-600" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{a}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{stat.count} items</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { setCoverPickerAlbum(a); setCoverPickerUrlInput(albumCovers[a] || ''); }}
                            className="p-2 rounded-xl bg-white/5 text-gray-300 hover:text-emerald-400 transition-colors"
                            title="Edit Cover URL"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {albumCovers[a] && (
                            <button
                              onClick={() => clearCover(a)}
                              className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] font-bold"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAlbumFolder(a)}
                            disabled={stat.count > 0}
                            title={stat.count > 0 ? 'Remove all assets first' : 'Delete album'}
                            className={`p-2 rounded-xl transition-colors ${stat.count > 0 ? 'text-gray-700 cursor-not-allowed' : 'bg-white/5 text-gray-400 hover:text-red-400'}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Create New Album</p>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    placeholder="Album name..."
                    value={newAlbumInput}
                    onChange={e => setNewAlbumInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddAlbum()}
                  />
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    placeholder="Cover image URL (optional)..."
                    value={newAlbumCoverInput}
                    onChange={e => setNewAlbumCoverInput(e.target.value)}
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleAddAlbum}
                      disabled={!newAlbumInput.trim()}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 rounded-xl text-white transition-all"
                    >
                      Create Album
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Cover Picker Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {coverPickerAlbum && (
          <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" onClick={() => setCoverPickerAlbum(null)} />
            <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-gray-900 border border-white/15 rounded-2xl p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="text-xs font-bold text-white truncate">Set Cover: &quot;{coverPickerAlbum}&quot;</h3>
                  <button onClick={() => setCoverPickerAlbum(null)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 outline-none focus:border-emerald-500"
                  placeholder="https://domain.com/cover.jpg"
                  value={coverPickerUrlInput}
                  onChange={e => setCoverPickerUrlInput(e.target.value)}
                />
                {coverPickerUrlInput && (
                  <div className="w-full h-24 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                    <img
                      src={coverPickerUrlInput}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setCoverPickerAlbum(null)} className="text-xs font-semibold px-3 py-1.5 text-gray-400 hover:text-white">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (coverPickerUrlInput.trim()) {
                        setCover(coverPickerAlbum, coverPickerUrlInput.trim());
                        setCoverPickerAlbum(null);
                      }
                    }}
                    disabled={!coverPickerUrlInput.trim()}
                    className="text-xs font-bold bg-emerald-600 disabled:opacity-50 px-4 py-1.5 rounded-xl text-white transition-all"
                  >
                    Save Cover
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Upload Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showUploadModal && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowUploadModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-xl bg-gray-900 border border-white/15 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" /> Add New Media Asset
                </h2>

                {formError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5 text-xs text-red-400 font-mono flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">⚠</span>
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, mediaType: 'Photo' }))}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${form.mediaType === 'Photo' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Camera className="w-3.5 h-3.5" /> Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, mediaType: 'Video' }))}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${form.mediaType === 'Video' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Film className="w-3.5 h-3.5" /> Video
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">Asset Title *</label>
                    <input
                      className="w-full bg-black/20 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 outline-none focus:border-emerald-500"
                      placeholder="e.g., Annual Tech Fest Inauguration"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1">Album *</label>
                      <select
                        className="w-full bg-gray-950 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 outline-none focus:border-emerald-500"
                        value={form.album}
                        onChange={e => setForm(f => ({ ...f, album: e.target.value }))}
                      >
                        {albums.map(a => <option key={a} value={a} className="bg-gray-900">{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1">Source Type</label>
                      <select
                        className="w-full bg-gray-950 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 outline-none focus:border-emerald-500"
                        value={form.uploadSource}
                        onChange={e => setForm(f => ({ ...f, uploadSource: e.target.value as UploadSource }))}
                      >
                        <option value="Direct">Direct URL</option>
                        <option value="GoogleDrive">Google Drive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">
                      Thumbnail / Cover Image URL *
                    </label>
                    <input
                      className="w-full bg-black/20 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 font-mono text-blue-400 outline-none focus:border-emerald-500"
                      placeholder="https://domain.com/thumbnail.jpg"
                      value={form.imageUrl}
                      onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    />
                  </div>

                  {form.mediaType === 'Video' && (
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1">
                        Video URL *
                        {form.uploadSource === 'GoogleDrive' && (
                          <span className="ml-1 text-indigo-400">
                            (share link: drive.google.com/file/d/…/view)
                          </span>
                        )}
                      </label>
                      <input
                        className="w-full bg-black/20 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 font-mono text-indigo-400 outline-none focus:border-indigo-500"
                        placeholder={
                          form.uploadSource === 'GoogleDrive'
                            ? 'https://drive.google.com/file/d/FILE_ID/view'
                            : 'https://domain.com/video.mp4'
                        }
                        value={form.mediaUrl}
                        onChange={e => setForm(f => ({ ...f, mediaUrl: e.target.value }))}
                      />
                      {form.uploadSource === 'GoogleDrive' && form.mediaUrl && (
                        <p className="text-[10px] mt-1 font-mono">
                          {extractDriveFileId(form.mediaUrl)
                            ? <span className="text-emerald-400">✓ Drive ID detected: {extractDriveFileId(form.mediaUrl)}</span>
                            : <span className="text-red-400">⚠ Could not extract Drive file ID from this URL</span>
                          }
                        </p>
                      )}
                      {form.uploadSource === 'Direct' && extractDriveFileId(form.mediaUrl) && (
                        <p className="text-[10px] mt-1 font-mono text-amber-400">
                          ⚠ This looks like a Google Drive link — it will be auto-switched to "Google Drive" source on save.
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">Caption (optional)</label>
                    <input
                      className="w-full bg-black/20 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 outline-none focus:border-emerald-500"
                      placeholder="Brief description..."
                      value={form.caption}
                      onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-emerald-400 cursor-pointer select-none bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl">
                    <input
                      type="checkbox"
                      checked={form.setAsCover}
                      onChange={e => setForm(f => ({ ...f, setAsCover: e.target.checked }))}
                      className="accent-emerald-500"
                    />
                    Use this image as the album cover
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => { setShowUploadModal(false); setFormError(''); }}
                    className="text-xs font-semibold px-4 py-2 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white flex items-center gap-1.5 transition-all"
                  >
                    {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    {submitting ? 'Saving...' : 'Upload Asset'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-950 border border-white/10 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <FolderHeart className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">TESLA Gallery</h1>
            </div>
            <p className="text-xs text-gray-400">
              Manage albums, upload photos & videos, and customise album covers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchGallery(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={() => setShowAlbumModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 text-purple-400 border border-purple-500/20 text-xs font-bold transition-all hover:bg-white/10"
            >
              <Settings className="w-3.5 h-3.5" /> Manage Albums
            </button>
            <button
              onClick={openUploadModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Add Media
            </button>
          </div>
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-4 shadow-sm hover:border-white/10 transition-all">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border mb-3"
              style={{ background: `${s.color}12`, borderColor: `${s.color}25` }}
            >
              <s.Icon style={{ color: s.color, width: 14, height: 14 }} />
            </div>
            <p className="text-xl font-black text-white leading-none font-mono tracking-tight">
              <AnimatedNumber value={s.value} />
            </p>
            <p className="text-[10px] text-gray-400 font-semibold mt-2 uppercase tracking-wider leading-tight">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!selectedAlbum ? (
          <motion.div key="root-albums" {...fadeProps} className="space-y-4">
            <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Albums</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {albums.map((alb) => {
                const stat = albumStats[alb] || { count: 0, cover: '' };
                return (
                  <div
                    key={alb}
                    onClick={() => handleSelectAlbum(alb)}
                    className="group bg-white/[0.01] border border-white/[0.06] rounded-2xl p-3.5 space-y-3 cursor-pointer hover:bg-white/[0.03] hover:border-white/15 transition-all shadow-md relative overflow-hidden"
                  >
                    <div className="w-full h-36 rounded-xl relative overflow-hidden bg-gray-950 border border-white/5 flex items-center justify-center">
                      {stat.cover ? (
                        <img
                          src={stat.cover}
                          alt={alb}
                          className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-300"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-700" />
                      )}
                      <span className="absolute bottom-2.5 left-2.5 text-[10px] font-mono font-bold px-2 py-0.5 bg-black/80 rounded border border-white/10 text-emerald-400 shadow">
                        {stat.count} Assets
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCoverPickerAlbum(alb); setCoverPickerUrlInput(albumCovers[alb] || ''); }}
                        className="absolute top-2.5 right-9 w-7 h-7 rounded-lg bg-black/60 text-gray-400 hover:text-emerald-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                        title="Edit Cover"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteAlbumFolder(alb, e)}
                        className="absolute top-2.5 right-2 w-7 h-7 rounded-lg bg-black/60 text-gray-400 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                        title="Delete Album"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between min-w-0">
                      <h4 className="text-xs font-bold text-gray-200 truncate pr-2 group-hover:text-emerald-400 transition-colors">
                        {alb}
                      </h4>
                      <FolderHeart className="w-3.5 h-3.5 text-gray-600 group-hover:text-purple-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>

            {albums.length === 0 && (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.005]">
                <FolderHeart className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-3">No albums yet.</p>
                <button
                  onClick={() => setShowAlbumModal(true)}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                >
                  Create your first album
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="inside-album" {...fadeProps} className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectedAlbum(null); setSearch(''); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs border border-white/5 font-bold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Albums
                </button>
                <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Current Album</p>
                  <h3 className="text-xs font-black text-emerald-400 mt-0.5">{selectedAlbum}</h3>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <div className="bg-black/40 p-1 rounded-xl flex border border-white/5 w-full sm:w-64">
                  <button
                    onClick={() => setInnerPipeline('Photo')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${innerPipeline === 'Photo' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Camera className="w-3 h-3" /> Photos
                  </button>
                  <button
                    onClick={() => setInnerPipeline('Video')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${innerPipeline === 'Video' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Film className="w-3 h-3" /> Videos
                  </button>
                </div>
                <div className="flex items-center gap-1.5 bg-black/30 border border-white/10 rounded-xl px-2 py-1.5 w-full sm:w-44">
                  <Search className="w-3 h-3 text-gray-600" />
                  <input
                    className="bg-transparent text-gray-300 text-[11px] outline-none w-full placeholder-gray-600"
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="text-gray-600 hover:text-gray-400">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveLightboxImage(item)}
                  className="group bg-white/[0.01] border border-white/[0.07] rounded-2xl p-3.5 space-y-3 cursor-zoom-in hover:bg-white/[0.03] hover:border-white/15 transition-all shadow-md relative"
                >
                  <div className="w-full aspect-[4/3] rounded-xl relative overflow-hidden bg-gray-950 border border-white/5 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                        onError={e => { (e.target as HTMLImageElement).src = ''; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        {item.mediaType === 'Video' ? <Film className="w-10 h-10 text-gray-600" /> : <ImageIcon className="w-10 h-10 text-gray-600" />}
                      </div>
                    )}

                    {item.mediaType === 'Video' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow border border-white/20 group-hover:bg-indigo-500 group-hover:scale-110 transition-all">
                          <Play className="w-4 h-4 ml-0.5" />
                        </div>
                      </div>
                    )}

                    {item.uploadSource === 'GoogleDrive' && (
                      <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 bg-blue-600/80 text-white rounded border border-white/10">
                        Drive
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-start gap-2 min-w-0 pt-0.5">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      {item.caption && (
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.caption}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDelete(item, e)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredMedia.length === 0 && (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.005]">
                {innerPipeline === 'Video' ? (
                  <Film className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                )}
                <p className="text-xs text-gray-500 mb-3">
                  No {innerPipeline.toLowerCase()}s found
                  {search ? ` matching "${search}"` : ` in this album`}.
                </p>
                <button
                  onClick={openUploadModal}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                >
                  Upload {innerPipeline === 'Video' ? 'a video' : 'a photo'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}