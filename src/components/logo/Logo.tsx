// src/components/logo/Logo.tsx

import { TESLA_BLUE, TESLA_GOLD, MARK, VECTOR_FONT } from './teslaMark';

interface LogoProps {
  variant?: 'sidebar' | 'navbar';
  className?: string;
}

// Pure module-level glyph layout for the strict-vector font (space 4.5,
// advance 6.4 — matches the original render algorithm exactly, minus the
// render-time mutation that react-hooks/immutability rejects).
function layoutGlyphs(text: string, space: number, advance: number): { d: string; x: number }[] {
  const glyphs: { d: string; x: number }[] = [];
  let x = 0;
  for (const ch of text.toUpperCase()) {
    if (ch === ' ') {
      x += space;
      continue;
    }
    const d = VECTOR_FONT[ch];
    if (d) glyphs.push({ d, x });
    x += advance;
  }
  return glyphs;
}

// Static rigid SVG mark for navigation.
function MarkIcon({ size }: { size: number }) {
  const { hub, blade } = MARK;
  return (
    <svg width={size} height={size} viewBox="20 4 160 160" fill="none" aria-hidden className="relative">
      <g stroke={TESLA_BLUE} strokeWidth="7" strokeLinecap="round" fill="none">
        <path d={MARK.bulbOutline} />
        <path d={MARK.highlightArc} strokeWidth="5" opacity="0.85" />
        <path d={MARK.neckLeft} />
        <path d={MARK.neckRight} />
        <path d={MARK.base} strokeWidth="6" strokeLinejoin="round" />
      </g>
      <rect {...MARK.filament} fill={TESLA_GOLD} />
      <path d={MARK.tower} fill={TESLA_GOLD} />
      
      {/* Grouped Rigid Turbine for static rendering */}
      <g>
        <circle cx={hub.cx} cy={hub.cy} r={hub.r} fill={TESLA_GOLD} />
        <path d={blade} fill={TESLA_GOLD} />
        <path d={blade} fill={TESLA_GOLD} transform={`rotate(120 ${hub.cx} ${hub.cy})`} />
        <path d={blade} fill={TESLA_GOLD} transform={`rotate(240 ${hub.cx} ${hub.cy})`} />
        <circle cx={hub.cx} cy={hub.cy} r="3.5" fill="#ffffff" />
      </g>
    </svg>
  );
}

// Minimal, premium lockup. Single line, precise alignment, vibrant gradient.
export function Logo({ variant = 'sidebar', className = '' }: LogoProps) {
  const compact = variant === 'navbar';
  
  // Navbar variant runs ~20% smaller so the lockup sits lighter in the bar.
  // Sidebar lockup budget: 24 padding + 40 icon + 12 gap + 72 text = 148px,
  // so the whole thing fits inside 150px without clipping.
  const iconSize = compact ? 26 : 40;
  const wordmarkWidth = compact ? 60 : 72;

  const subtitleWidthDesktop = compact ? 160 : 52;

  // Sidebar shows the short institute name; its viewBox hugs the shorter text
  // so the glyphs scale to fill the width instead of shrinking left-aligned.
  const subtitleText = 'NIT PATNA';
  const subtitleViewBox = '0 -3 56 12';

  return (
    // Reduced outer padding (px-3 py-2) to tighten empty space while keeping heights unchanged.
    <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-3 glass rounded-2xl px-3 py-2 border border-white/10'} ${className}`}>
      
      <div className="relative flex-shrink-0 flex items-center justify-center">
        {/* Soft background glow matching the brand core */}
        <div aria-hidden className={`absolute inset-0 rounded-full bg-primary/30 blur-md pointer-events-none ${compact ? 'opacity-60 group-hover:opacity-100 transition-opacity' : 'opacity-70'}`} />
        <MarkIcon size={iconSize} />
      </div>

      <div className="flex flex-col min-w-0 justify-center pb-0.5">
        {/* T≡SLA Wordmark purely in SVG; tighter gap to the subtitle in the navbar */}
        <svg width={wordmarkWidth} viewBox="0 0 162 30" fill="none" className={compact ? 'mb-[3px]' : 'mb-[6px]'} aria-label="TESLA">
          <g fill="#ffffff">
            <path d={MARK.wordmark.T_1} />
            <path d={MARK.wordmark.T_2} />
            <path d={MARK.wordmark.E_1} />
            <path d={MARK.wordmark.E_2} />
            <path d={MARK.wordmark.E_3} />
            <path d={MARK.wordmark.S} />
            <path d={MARK.wordmark.L_1} />
            <path d={MARK.wordmark.L_2} />
            <path d={MARK.wordmark.A_1} />
            <path d={MARK.wordmark.A_2} />
          </g>
        </svg>
        
        {/* Institute subtitle in neutral muted tone — matches hero's palette
            (blue bulb + gold turbine) instead of a clashing blue gradient. */}
        <svg
          style={{ width: '100%', maxWidth: compact ? 52 : subtitleWidthDesktop }}
          viewBox={subtitleViewBox}
          fill="none"
          aria-label="NIT Patna"
          className="flex-shrink-0"
        >
          <g className={compact ? 'text-muted' : 'text-ivory-2'} stroke="currentColor" fill="none" strokeWidth={1.4} strokeLinecap="square" strokeLinejoin="miter">
            {layoutGlyphs(subtitleText, 4.5, 6.4).map((glyph, i) => (
              <path key={i} d={glyph.d} transform={`translate(${glyph.x}, 0)`} />
            ))}
          </g>
        </svg>
      </div>
      
    </div>
  );
}