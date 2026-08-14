'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const fallbackImages = [
  { id: '1', imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop', caption: 'HACK-TESLA 2025 — FINALS', colSpan: 'md:col-span-8' },
  { id: '2', imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800&auto=format&fit=crop', caption: 'WEB BOOTCAMP, WK 3', colSpan: 'md:col-span-4' },
  { id: '3', imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop', caption: 'CORE TEAM SYNC', colSpan: 'md:col-span-4' },
  { id: '4', imageUrl: 'https://images.unsplash.com/photo-1523908511403-7fc7b25592f4?q=80&w=800&auto=format&fit=crop', caption: 'ROBOTICS LAB NIGHT', colSpan: 'md:col-span-4' },
  { id: '5', imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop', caption: 'AI RESEARCH GROUP', colSpan: 'md:col-span-8' },
];

export default function GalleryPage() {
  const [images, setImages] = useState<any[]>(fallbackImages);

  useEffect(() => {
    fetch('/api/gallery')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.images && data.images.length > 0) {
          setImages(data.images);
        }
      })
      .catch((err) => console.warn('Using fallback gallery images:', err));
  }, []);

  return (
    <div className="bg-ink min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24">
        {/* Header */}
        <div className="pb-10 mb-10 border-b border-line">
          <div className="tag-mono-acid mb-3">// FIELD RECORDINGS</div>
          <h1 className="display text-5xl sm:text-7xl text-ivory">GALLERY</h1>
          <p className="text-ivory-2 mt-4 max-w-md text-sm leading-relaxed">
            Screenshots from the process — hack nights, workshops, demo days.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-line border border-line">
          {images.map((img, i) => (
            <motion.div
              key={img._id || img.id || i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className={`relative group overflow-hidden bg-ink aspect-[4/3] ${img.colSpan || 'md:col-span-4'}`}
            >
              <img
                src={img.imageUrl}
                alt={img.caption}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 bg-ink border-t border-line px-4 py-2.5 flex items-center justify-between translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <span className="tag-mono-acid truncate mr-2">{img.caption}</span>
                <span className="tag-mono shrink-0">IMG_{String(i + 1).padStart(3, '0')}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
