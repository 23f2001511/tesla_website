'use client';

import { AlertCircle, Inbox } from 'lucide-react';

export function ErrorState({
  title = 'Something broke',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card-brut rounded-xl p-8 text-center">
      <AlertCircle className="w-8 h-8 text-acid mx-auto mb-3" />
      <p className="display text-lg text-ivory mb-1">{title}</p>
      <p className="text-sm text-muted mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-brut !py-2 !px-5 text-sm">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card-brut rounded-xl p-8 text-center">
      <Inbox className="w-8 h-8 text-muted mx-auto mb-3" />
      <p className="display text-lg text-ivory mb-1">{title}</p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-brut rounded-xl p-6 animate-pulse">
          <div className="w-16 h-16 rounded-md bg-ink-3 mb-4" />
          <div className="h-4 w-3/4 bg-ink-3 rounded mb-2" />
          <div className="h-3 w-1/2 bg-ink-3 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Avatar with initial-letter fallback when profileImage is missing/broken. */
export function Avatar({
  src,
  name,
  className = 'w-20 h-20 text-xl',
}: {
  src?: string;
  name: string;
  className?: string;
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`${className} rounded-md border border-line bg-ink-3 flex items-center justify-center overflow-hidden shrink-0`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const el = e.currentTarget;
            if (el.dataset.fallback) return;
            el.dataset.fallback = '1';
            el.style.display = 'none';
            const span = document.createElement('span');
            span.className = 'display text-acid';
            span.textContent = initials;
            el.parentElement?.appendChild(span);
          }}
        />
      ) : (
        <span className="display text-acid">{initials}</span>
      )}
    </div>
  );
}