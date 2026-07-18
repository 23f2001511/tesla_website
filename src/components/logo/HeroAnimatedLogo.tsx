// src/components/logo/HeroAnimatedLogo.tsx

'use client';

import { motion } from 'framer-motion';
import { MARK, VECTOR_FONT } from './teslaMark';

interface HeroAnimatedLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
  showPlatform?: boolean;
  showWordmark?: boolean;
}

// Deterministic rich particle field. Expanded for a premium energy core feel.
const PARTICLES = [
  { x: 18, y: 120, r: 1.6, d: 5.2, delay: 0.0, c: '#57c4ff' },
  { x: 34, y: 52, r: 1.2, d: 6.1, delay: 1.1, c: '#ffe45c' },
  { x: 58, y: 160, r: 1.8, d: 4.6, delay: 0.5, c: '#57c4ff' },
  { x: 146, y: 150, r: 1.4, d: 5.8, delay: 1.7, c: '#ffe45c' },
  { x: 168, y: 96, r: 1.8, d: 4.9, delay: 0.3, c: '#57c4ff' },
  { x: 182, y: 44, r: 1.2, d: 6.4, delay: 2.1, c: '#8fd8ff' },
  { x: 12, y: 80, r: 1.3, d: 5.5, delay: 2.6, c: '#ffffff' },
  { x: 150, y: 22, r: 1.5, d: 5.0, delay: 0.8, c: '#ffe45c' },
  // Additional energy dust
  { x: 80, y: 130, r: 1.0, d: 4.0, delay: 1.5, c: '#8fd8ff' },
  { x: 120, y: 145, r: 1.5, d: 5.5, delay: 0.2, c: '#57c4ff' },
  { x: 70, y: 25, r: 1.2, d: 4.8, delay: 1.9, c: '#ffffff' },
  { x: 130, y: 35, r: 1.8, d: 6.0, delay: 0.7, c: '#ffe45c' },
  { x: 45, y: 90, r: 1.4, d: 5.2, delay: 3.1, c: '#57c4ff' },
];

// Enhanced lightning arcs and plasma strikes
const LIGHTNING = [
  { path: 'M60 44 l-4 7 h5 l-4 7', delay: 0.4, dur: 0.9, color: '#7fd4ff' },
  { path: 'M148 60 l-4 7 h5 l-4 7', delay: 2.2, dur: 1.1, color: '#55C8FF' },
  { path: 'M128 132 l-4 7 h5 l-4 7', delay: 3.6, dur: 1.0, color: '#7fd4ff' },
  // Jagged interior arcs
  { path: 'M85 50 l7 9 l-4 6 l9 12', delay: 1.5, dur: 1.4, color: '#ffffff' },
  { path: 'M115 105 l-6 -8 l5 -7 l-8 -10', delay: 4.2, dur: 1.2, color: '#3FAEFF' },
];

// Reusable component to render strict vector text (no CSS/fonts used).
function VectorSubtitle({ text }: { text: string }) {
  let currentX = 0;
  return (
    <g stroke="currentColor" fill="none" strokeWidth={0.6} strokeLinecap="round" strokeLinejoin="round">
      {text.toUpperCase().split('').map((char, i) => {
        if (char === ' ') {
          currentX += 3.5;
          return null;
        }
        const pathData = VECTOR_FONT[char];
        const xPos = currentX;
        currentX += 5.2; // Fixed advance width
        
        if (!pathData) return null;
        return <path key={i} d={pathData} transform={`translate(${xPos}, 0)`} />;
      })}
    </g>
  );
}

export function HeroAnimatedLogo({
  size = 320,
  className = '',
  animated = true,
  showPlatform = true,
  showWordmark = true
}: HeroAnimatedLogoProps) {
  
  const heightMultiplier = showWordmark ? 1.25 : 0.85;
  const viewBoxHeight = showWordmark ? 230 : 170;

  return (
    <div className={`relative flex flex-col items-center ${className}`} style={{ width: size }}>
      
      {animated && (
        <style>{`
          /* 
            TURBINE PHYSICS FIX:
            1. transform-box: view-box is REQUIRED. If fill-box is used, the browser calculates the bounding 
               box of the rotating paths, which constantly shifts causing a severe "wobble" or "orbit" effect.
               view-box forces the transform-origin (100px 78px) to lock perfectly to the absolute SVG coordinates.
            2. Smooth Acceleration: Accelerates over 3 seconds using cubic-bezier, then perfectly matches the 
               velocity of a 1.5s linear infinite loop.
          */
          @keyframes turbine-startup {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes turbine-loop {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-turbine {
            animation: 
              turbine-startup 3s cubic-bezier(0.5, 0, 1, 1) forwards,
              turbine-loop 1.5s linear infinite 3s;
            transform-origin: 100px 78px;
            transform-box: view-box;
          }
        `}</style>
      )}

      {/* Outer Atmospheric Glow Rings */}
      {animated && (
        <>
          <motion.div
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{ 
              width: size * 1.1, height: size * 1.1, top: -size * 0.05,
              background: 'radial-gradient(circle, rgba(30,149,215,0.15) 0%, rgba(30,149,215,0) 70%)',
              filter: 'blur(20px)'
            }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="absolute rounded-full border border-cyan-400/20 pointer-events-none"
            style={{ width: size * 0.95, height: size * 0.95, top: size * 0.02, boxShadow: '0 0 30px rgba(85,200,255,0.1) inset' }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.1, 0.35] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="absolute rounded-full border border-primary/30 pointer-events-none"
            style={{ width: size * 0.72, height: size * 0.72, top: size * 0.13, boxShadow: '0 0 20px rgba(30,149,215,0.2)' }}
            animate={{ scale: [1.08, 1, 1.08], opacity: [0.15, 0.4, 0.15] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.6 }}
          />
        </>
      )}

      <motion.div
        className="relative z-10"
        animate={animated ? { y: [-6, 6, -6] } : undefined}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        style={{ filter: 'drop-shadow(0 25px 35px rgba(0,0,0,0.55)) drop-shadow(0 0 25px rgba(85,200,255,0.35))' }}
      >
        <svg
          width={size}
          height={size * heightMultiplier}
          viewBox={`0 0 200 ${viewBoxHeight}`}
          fill="none"
          role="img"
          aria-label="TESLA Technical Club Energy Core"
        >
          <defs>
            <linearGradient id="tesla-blade" x1="60" y1="17" x2="140" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fff3a6" />
              <stop offset="35%" stopColor="#ffe45c" />
              <stop offset="70%" stopColor="#fdd900" />
              <stop offset="100%" stopColor="#e3b607" />
            </linearGradient>
            <linearGradient id="tesla-tower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fdd900" />
              <stop offset="100%" stopColor="#f0c419" />
            </linearGradient>
            <linearGradient id="tesla-electric" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1e95d7" stopOpacity="0" />
              <stop offset="30%" stopColor="#3FAEFF" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#3FAEFF" />
              <stop offset="100%" stopColor="#1e95d7" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="tesla-bulb-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#55C8FF" stopOpacity="0.45" />
              <stop offset="40%" stopColor="#1e95d7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1e95d7" stopOpacity="0" />
            </radialGradient>
            <filter id="bloom" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Deep Core Glow */}
          <circle cx="100" cy="78" r="58" fill="url(#tesla-bulb-glow)" />

          {/* Bulb Vector Architecture */}
          <g stroke="#1e95d7" strokeWidth="6.5" strokeLinecap="round" fill="none">
            <path d={MARK.bulbOutline} />
            <path d={MARK.highlightArc} strokeWidth="4.5" opacity="0.9" stroke="#55C8FF" filter="url(#bloom)" />
            <path d={MARK.neckLeft} />
            <path d={MARK.neckRight} />
            <path d={MARK.base} strokeWidth="5.5" strokeLinejoin="round" />
            <path d={MARK.screws[0]} strokeWidth="5" />
            <path d={MARK.screws[1]} strokeWidth="5" />
            <path d={MARK.screws[2]} strokeWidth="5" />
          </g>

          <motion.rect
            x={MARK.filament.x} y={MARK.filament.y} 
            width={MARK.filament.width} height={MARK.filament.height} 
            rx={MARK.filament.rx} fill="#fdd900"
            animate={animated ? { opacity: [0.6, 1, 0.6], fill: ['#fdd900', '#fff3a6', '#fdd900'] } : undefined}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            filter="url(#bloom)"
          />

          <path d={MARK.tower} fill="url(#tesla-tower)" />

          {/* Multi-layered High-Energy Flow */}
          {animated && (
            <>
              {/* Outer fast plasma trail */}
              <motion.circle
                cx="100" cy="78" r="46"
                stroke="url(#tesla-electric)" strokeWidth="2.5" strokeLinecap="round" fill="none"
                strokeDasharray="60 229"
                animate={{ strokeDashoffset: [0, -289] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                filter="url(#bloom)"
              />
              {/* Inner slow dense energy */}
              <motion.circle
                cx="100" cy="78" r="50"
                stroke="url(#tesla-electric)" strokeWidth="1.5" strokeLinecap="round" fill="none"
                strokeDasharray="30 284" opacity="0.8"
                animate={{ strokeDashoffset: [0, 314] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                style={{ filter: 'drop-shadow(0 0 5px rgba(85,200,255,1))' }}
              />
              {/* Micro reverse-orbiting ring */}
              <motion.circle
                cx="100" cy="78" r="34"
                stroke="#55C8FF" strokeWidth="1" strokeLinecap="round" fill="none"
                strokeDasharray="15 200" opacity="0.5"
                animate={{ strokeDashoffset: [215, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              />
            </>
          )}

          {/* 
            RIGID TURBINE ASSEMBLY 
            This entire group rotates as a single rigid body around the precise center (100, 78).
            Using <g> ensures the hub, 3 blades, and cap never separate or wobble.
          */}
          <g className={animated ? "animate-turbine" : ""}>
            {/* Base Hub */}
            <circle cx={MARK.hub.cx} cy={MARK.hub.cy} r={MARK.hub.r} fill="url(#tesla-blade)" />
            
            {/* Blade 1 (12 o'clock) */}
            <path d={MARK.blade} fill="url(#tesla-blade)" />
            
            {/* Blade 2 (120 degrees) */}
            <path d={MARK.blade} fill="url(#tesla-blade)" transform="rotate(120 100 78)" />
            
            {/* Blade 3 (240 degrees) */}
            <path d={MARK.blade} fill="url(#tesla-blade)" transform="rotate(240 100 78)" />
            
            {/* Center Cap */}
            <circle cx={MARK.hub.cx} cy={MARK.hub.cy} r="3.5" fill="#ffffff" filter="url(#bloom)" />
          </g>

          {/* Lightning Discharges */}
          {animated &&
            LIGHTNING.map((s, i) => (
              <motion.path
                key={`spark-${i}`}
                d={s.path}
                stroke={s.color}
                strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0, 0.8, 0] }}
                transition={{ repeat: Infinity, duration: s.dur, delay: s.delay, repeatDelay: 2.5 }}
                filter="url(#bloom)"
              />
            ))}

          {/* Ambient Energy Particles */}
          {animated &&
            PARTICLES.map((p, i) => (
              <motion.circle
                key={`particle-${i}`}
                cx={p.x} cy={p.y} r={p.r} fill={p.c}
                animate={{ y: [0, -18, 0], opacity: [0, 0.9, 0], scale: [0.8, 1.2, 0.8] }}
                transition={{ repeat: Infinity, duration: p.d, delay: p.delay, ease: 'easeInOut' }}
                style={{ filter: `drop-shadow(0 0 3px ${p.c})` }}
              />
            ))}

          {showWordmark && (
            <g transform="translate(19, 172)">
              <g fill="#f3f4f6">
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

              {/* Strict SVG Subtitle - NO FONTS */}
              <g transform="translate(-14, 40) scale(0.98)" stroke="#1e95d7">
                <VectorSubtitle text="NATIONAL INSTITUTE OF TECHNOLOGY PATNA" />
              </g>
            </g>
          )}
        </svg>
      </motion.div>

      {/* Emitting Power Platform */}
      {showPlatform && (
        <div aria-hidden className="relative flex justify-center items-center pointer-events-none" style={{ width: size, height: size * 0.16, marginTop: -size * 0.08 }}>
          <div
            className="absolute bg-primary/15 rounded-[100%] blur-xl"
            style={{ width: size * 0.85, height: size * 0.18 }}
          />
          {/* Inner solid ring */}
          <motion.div
            className="absolute border-2 border-primary/50 rounded-[100%]"
            style={{ width: size * 0.55, height: size * 0.08 }}
            animate={animated ? { 
              opacity: [0.4, 0.9, 0.4], 
              boxShadow: ['0 0 15px rgba(59,130,246,0.4)', '0 0 30px rgba(85,200,255,0.8)', '0 0 15px rgba(59,130,246,0.4)'] 
            } : undefined}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          />
          {/* Expanding sonic energy pulse */}
          {animated && (
            <motion.div
              className="absolute border border-cyan-400/80 rounded-[100%]"
              style={{ width: size * 0.55, height: size * 0.08 }}
              animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut', delay: 1 }}
            />
          )}
        </div>
      )}
    </div>
  );
}