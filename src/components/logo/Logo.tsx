// src/components/logo/Logo.tsx

import { TESLA_BLUE, TESLA_GOLD, MARK, VECTOR_FONT } from './teslaMark';

interface LogoProps {
  variant?: 'sidebar' | 'navbar';
  className?: string;
}

// Reusable static vector text upgraded for premium readability on dark backgrounds.
function VectorSubtitle({ text }: { text: string }) {
  let currentX = 0;
  return (
    // strokeWidth increased to 1.4 for a SemiBold (600) appearance.
    <g stroke="url(#tesla-blue-grad)" fill="none" strokeWidth={1.4} strokeLinecap="square" strokeLinejoin="miter">
      {text.toUpperCase().split('').map((char, i) => {
        if (char === ' ') {
          currentX += 4.5; // Space between words
          return null;
        }
        const pathData = VECTOR_FONT[char];
        const xPos = currentX;
        currentX += 6.4; // Adjusted tracking/letter-spacing for the thicker stroke
        
        if (!pathData) return null;
        return <path key={i} d={pathData} transform={`translate(${xPos}, 0)`} />;
      })}
    </g>
  );
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
        <path d={MARK.screws[0]} strokeWidth="5.5" />
        <path d={MARK.screws[1]} strokeWidth="5.5" />
        <path d={MARK.screws[2]} strokeWidth="5.5" />
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
  const subtitleText = compact
    ? 'NATIONAL INSTITUTE OF TECHNOLOGY PATNA'
    : 'NIT PATNA';
  const subtitleViewBox = compact ? '0 -3 245 12' : '0 -3 56 12';

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
        
        {/* Upgraded Subtitle: ~35% larger, SemiBold (thicker stroke), bright gradient, and specific blue glow */}
        <svg 
          style={{ 
            width: '100%', 
            maxWidth: subtitleWidthDesktop, 
            filter: 'drop-shadow(0 0 6px rgba(110,210,255,.6))' 
          }}
          // Viewbox adjusted to comfortably fit the thicker stroke and drop-shadow without clipping
          viewBox={subtitleViewBox}
          fill="none"
          aria-label={compact ? 'National Institute of Technology Patna' : 'NIT Patna'}
          className="flex-shrink-0"
        >
          <defs>
            <linearGradient id="tesla-blue-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A7E8FF" />
              <stop offset="50%" stopColor="#6ED2FF" />
              <stop offset="100%" stopColor="#1E95D7" />
            </linearGradient>
          </defs>
          <VectorSubtitle text={subtitleText} />
        </svg>
      </div>
      
    </div>
  );
}