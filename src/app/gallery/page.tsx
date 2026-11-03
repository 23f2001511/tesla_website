'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useApi } from '@/lib/api';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ScrollReveal, StaggerGroup, StaggerItem } from '@/components/ui/ScrollReveal';

// Bento spans cycle for visual variety regardless of how many items exist.
const SPANS = [
  'col-span-12 md:col-span-8 row-span-2',
  'col-span-12 md:col-span-4 row-span-1',
  'col-span-12 md:col-span-4 row-span-1',
  'col-span-12 md:col-span-4 row-span-1',
  'col-span-12 md:col-span-8 row-span-1',
];

interface GalleryItem {
  id: string;
  _id?: string;
  title: string;
  imageUrl?: string;
  mediaUrl?: string;
  album: string;
  caption?: string;
  mediaType: string;
  views?: number;
}

export default function GalleryPage() {
  const [album, setAlbum] = useState('all');
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  const { data, error, isLoading, mutate } = useApi<{ items: GalleryItem[]; albums: string[] }>(
    `/api/gallery?album=${encodeURIComponent(album)}`
  );

  const items = data?.items || [];
  const albums = useMemo(() => data?.albums || [], [data]);

  return (
    <div className="bg-ink overflow-x-hidden">
      <section className="bg-ink pt-20 sm:pt-28 pb-12">
        <ScrollReveal className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="tag-mono-acid mb-3">{'// GALLERY'}</div>
          <h1 className="display text-5xl sm:text-7xl lg:text-8xl">
            Glimpses of our <span className="text-acid">journey</span>
          </h1>
          <p className="mt-4 text-ivory-2 text-base sm:text-lg">
            Memories from workshops, hackathons, and fun events — live from the club database.
          </p>
        </ScrollReveal>
      </section>

      <section className="bg-ink pb-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {albums.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-8">
              <button
                onClick={() => setAlbum('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.12em] border transition-colors ${
                  album === 'all' ? 'bg-acid text-acid-ink border-acid font-bold' : 'border-line text-ivory-2 hover:border-acid hover:text-acid'
                }`}
              >
                All albums
              </button>
              {albums.map((a) => (
                <button
                  key={a}
                  onClick={() => setAlbum(a)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-[0.12em] border transition-colors ${
                    album === a ? 'bg-acid text-acid-ink border-acid font-bold' : 'border-line text-ivory-2 hover:border-acid hover:text-acid'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-12 gap-3 auto-rows-[220px]">
              {SPANS.map((s, i) => (
                <div key={i} className={`${s} rounded-xl border border-line bg-ink-3 animate-pulse`} />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={(error as Error).message} onRetry={() => mutate()} />
          ) : items.length === 0 ? (
            <EmptyState title="Gallery is empty" hint="Photos and videos added by admins will appear here." />
          ) : (
            <StaggerGroup className="grid grid-cols-12 gap-3 auto-rows-[220px]">
              {items.map((item, i) => (
                <StaggerItem
                  key={item.id}
                  onClick={() => setLightbox(item)}
                  className={`relative rounded-xl overflow-hidden group cursor-pointer border border-line hover:border-acid transition-colors ${SPANS[i % SPANS.length]}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-ink/40 group-hover:bg-transparent transition-colors" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
                    <span className="display text-lg text-ivory">{item.title}</span>
                    <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-acid">
                      {item.album}{item.mediaType === 'Video' ? ' · video' : ''}
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-ink/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-md border border-line flex items-center justify-center text-ivory hover:border-acid hover:text-acid transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <figure className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {lightbox.mediaType === 'Video' && lightbox.mediaUrl ? (
              <video src={lightbox.mediaUrl} controls className="w-full rounded-xl border border-line max-h-[75vh]" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lightbox.imageUrl} alt={lightbox.title} className="w-full rounded-xl border border-line max-h-[75vh] object-contain" />
            )}
            <figcaption className="mt-4 flex items-baseline justify-between gap-4">
              <span className="display text-xl text-ivory">{lightbox.title}</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-acid">{lightbox.album}</span>
            </figcaption>
            {lightbox.caption && <p className="text-sm text-ivory-2 mt-1">{lightbox.caption}</p>}
          </figure>
        </div>
      )}
    </div>
  );
}