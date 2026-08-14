'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, RefreshCw, X } from 'lucide-react';

interface GalleryItem {
  _id?: string;
  caption: string;
  imageUrl: string;
  category?: string;
  colSpan: 'md:col-span-4' | 'md:col-span-8' | 'md:col-span-6' | 'md:col-span-12';
  order: number;
}

const defaultGallery: GalleryItem = {
  caption: '',
  imageUrl: '',
  category: 'General',
  colSpan: 'md:col-span-4',
  order: 0,
};

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<GalleryItem>(defaultGallery);
  const [saving, setSaving] = useState(false);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/gallery');
      const data = await res.json();
      if (data.success) {
        setItems(data.images || []);
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(defaultGallery);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: GalleryItem) => {
    setEditingId(item._id || null);
    setFormData(item);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caption || !formData.imageUrl) {
      alert('Caption and Image URL are required.');
      return;
    }

    try {
      setSaving(true);
      const url = editingId ? `/api/admin/gallery/${editingId}` : '/api/admin/gallery';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchGallery();
      } else {
        alert('Save failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error saving image: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, caption: string) => {
    if (!confirm(`Are you sure you want to delete image "${caption}"?`)) return;

    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i._id !== id));
      } else {
        alert('Delete failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error deleting image: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="tag-mono-acid mb-1">// FIELD RECORDINGS</div>
          <h1 className="display text-3xl sm:text-4xl text-ivory">GALLERY MANAGEMENT</h1>
          <p className="text-xs sm:text-sm text-ivory-2 mt-1">
            Manage photos from hack nights, workshops, and demo days shown on /gallery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchGallery} className="btn-brut text-xs py-2 px-3">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleOpenAdd} className="btn-acid text-xs py-2.5 px-4">
            <Plus className="w-4 h-4" /> Add Image
          </button>
        </div>
      </div>

      {/* Grid of Images */}
      {loading ? (
        <div className="py-20 text-center tag-mono">LOADING GALLERY…</div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center tag-mono border border-line bg-ink-2">
          NO IMAGES IN GALLERY YET
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((img) => (
            <div
              key={img._id}
              className="border border-line bg-ink-2 group hover:border-acid transition-all flex flex-col overflow-hidden"
            >
              <div className="relative aspect-[16/10] bg-ink overflow-hidden border-b border-line">
                <img
                  src={img.imageUrl}
                  alt={img.caption}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                />
                <span className="absolute top-2 right-2 bg-ink/90 border border-line px-2 py-0.5 text-[9px] font-mono text-acid">
                  {img.colSpan.replace('md:', '')}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="tag-mono text-[10px] text-muted">{img.category || 'General'}</div>
                  <h3 className="font-bold text-sm text-ivory mt-1 line-clamp-2">{img.caption}</h3>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-line mt-4">
                  <span className="tag-mono text-[10px]">ORDER: {img.order}</span>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleOpenEdit(img)}
                      className="p-1.5 border border-line text-ivory-2 hover:text-acid hover:border-acid transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => img._id && handleDelete(img._id, img.caption)}
                      className="p-1.5 border border-line text-ivory-2 hover:text-red-400 hover:border-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-ink-2 border border-line corner-marks w-full max-w-lg p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <div className="tag-mono-acid">// {editingId ? 'EDIT IMAGE' : 'NEW IMAGE ENTRY'}</div>
                <h2 className="display text-2xl text-ivory mt-1">
                  {editingId ? 'UPDATE GALLERY ITEM' : 'ADD GALLERY PHOTO'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-muted hover:text-ivory"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="tag-mono block mb-1.5">CAPTION / TITLE *</label>
                <input
                  type="text"
                  required
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="e.g. HACK-TESLA 2025 — FINALS"
                  className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="tag-mono block mb-1.5">IMAGE URL *</label>
                <input
                  type="url"
                  required
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                />
              </div>

              {formData.imageUrl && (
                <div className="aspect-[16/9] w-full bg-ink border border-line overflow-hidden">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => ((e.target as any).style.display = 'none')}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="tag-mono block mb-1.5">GRID WIDTH SPAN</label>
                  <select
                    value={formData.colSpan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        colSpan: e.target.value as any,
                      })
                    }
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none appearance-none"
                  >
                    <option value="md:col-span-4">Regular (1/3 width)</option>
                    <option value="md:col-span-6">Half (1/2 width)</option>
                    <option value="md:col-span-8">Wide (2/3 width)</option>
                    <option value="md:col-span-12">Full width</option>
                  </select>
                </div>

                <div>
                  <label className="tag-mono block mb-1.5">CATEGORY</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Hackathons, Workshops"
                    className="w-full bg-ink border border-line focus:border-acid px-3 py-2 text-sm text-ivory font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-line">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-acid flex-1 justify-center"
                >
                  {saving ? 'SAVING…' : editingId ? 'UPDATE IMAGE' : 'SAVE IMAGE'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-brut"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
