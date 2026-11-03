'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ACID = '#d8ff3d';

// Deterministic jagged arcs radiating from the logo centre (coords in a
// -60..60 box centred on 0,0). Pure SVG — no runtime randomness, no layout cost.
const ARCS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 + 0.35;
  const r1 = 12;
  const r2 = 48;
  const mid = 28 + (i % 2 ? 4 : -4);
  const pt = (r: number, da = 0) =>
    `${(Math.cos(a + da) * r).toFixed(1)} ${(Math.sin(a + da) * r).toFixed(1)}`;
  return `M ${pt(r1)} L ${pt(mid, 0.14)} L ${pt(r2)}`;
});

interface PremiumLogoLinkProps {
  href?: string;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}

/**
 * Wraps a logo link with a brief "charge-up" interaction:
 * the mark spins rapidly and an electric current spreads outward
 * (acid-green sparks + radiating rings) before navigating.
 *
 * Only a plain left-click is intercepted — middle-click, cmd/ctrl-click,
 * shift-click etc. fall through to the browser untouched (new-tab behaviour
 * is preserved because we never preventDefault for those).
 */
export function PremiumLogoLink({
  href = '/',
  className = '',
  ariaLabel,
  children,
}: PremiumLogoLinkProps) {
  const [bursting, setBursting] = useState(false);
  const busy = useRef(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Plain left-click only; every modifier / auxiliary click stays native.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (busy.current) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    busy.current = true;
    setBursting(true);
    // Charge-up flash, then proceed. Effect total: ~650ms.
    window.setTimeout(() => router.push(href), 660);
  };

  const handleBurstEnd = () => {
    setBursting(false);
    busy.current = false;
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`relative inline-flex ${className}`}
      aria-label={ariaLabel}
    >
      {/* Spreading current overlay */}
      <span
        aria-hidden
        className={`absolute inset-0 z-20 flex items-center justify-center pointer-events-none ${
          bursting ? '' : 'invisible'
        }`}
      >
        <svg
          viewBox="-60 -60 120 120"
          className="w-[220%] h-[220%] overflow-visible"
          fill="none"
        >
          {ARCS.map((d, i) => (
            <path
              key={i}
              d={d}
              stroke={ACID}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeDasharray="60"
              className={bursting ? 'spark-arc' : ''}
              style={{ animationDelay: `${i * 16}ms`, filter: `drop-shadow(0 0 4px ${ACID})` }}
            />
          ))}
          <circle
            r="16"
            stroke={ACID}
            strokeWidth="2"
            className={bursting ? 'current-ring' : ''}
          />
          <circle
            r="30"
            stroke={ACID}
            strokeWidth="1"
            className={bursting ? 'current-ring' : ''}
            style={{ animationDelay: '90ms' }}
          />
        </svg>
      </span>

      {/* The mark itself: idle electric hum, rapid spin burst on click */}
      <span
        className={`relative z-10 inline-flex items-center ${
          bursting ? 'logo-spin-burst' : 'logo-hum'
        }`}
        onAnimationEnd={handleBurstEnd}
      >
        {children}
      </span>
    </Link>
  );
}