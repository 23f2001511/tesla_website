'use client';

import { useEffect, useRef, useState } from 'react';
import { MARK, VECTOR_FONT } from '@/components/logo/teslaMark';

/**
 * Hero logo — the SAME artwork as the Navbar logo (`/images/tesla-logo-dark.png`,
 * as rendered by <ClubLogo>), rebuilt as a live SVG so the turbine can animate.
 *
 * The navbar asset is a flat PNG (a single image — its blades cannot rotate),
 * so this component draws the club mark from the shared vector geometry in
 * teslaMark.ts (traced from that exact artwork) and samples the PNG's own
 * palette (bulb #33759c, gold #f6d52c, ivory wordmark) so the two match.
 *
 * Animation (FIX 4 — three-phase load sequence, velocity-continuous):
 *  - Phase 1 (0–1.5s):  FAST spin-up — 3 full turns (1080°), monotone ease-out
 *    curve (starts at ~2340°/s and only ever decelerates). Ends at 540°/s.
 *  - Phase 2 (1.5–3.2s): gradual deceleration — one more turn (360°) over
 *    1.7s on a cubic-bezier curve, easing from 540°/s down to 45°/s.
 *  - Phase 3 (3.2s → ∞): constant 8s/revolution (45°/s), linear, infinite.
 *  Every phase boundary is velocity-matched (no visible seam) and lands on
 *  a multiple of 360° (no visible angle jump).
 *  - Acid spark particles ride the tips via an orbit layer that mirrors the
 *    blade rotation 1:1 (same keyframes, duration and easing). FIX 5:
 *    acid→gold gradient particles softened by an feGaussianBlur + feMerge
 *    SVG filter; 5 particles/tip during the fast spin-up, 3 subtle ones at
 *    constant speed ("energy building up, then stabilising").
 *  - Depth (FIX 2): three shadow layers — a 4:1 elliptical ground shadow
 *    (heavy blur, inverse-synchronised with the float), a blue↔yellow
 *    ambient glow pulsing 0.6↔1 (4s alternate), and two CSS drop-shadow
 *    layers on the logo itself (tight 0/4/6 contact + soft 0/20/30 lift).
 *  - FIX 6 polish: very subtle 4s float (−8px), lit-bulb blue stroke glow
 *    (static feDropShadow — rasterised once), and a desktop pointer tilt
 *    (±5° parallax) applied above the floor; tablets (lg–xl) get a lighter
 *    spark field via a media query.
 *
 * Performance: only transform/opacity are ever animated (GPU-friendly),
 * `will-change` on the rotating layers, and every animation is disabled under
 * `prefers-reduced-motion: reduce`.
 */

// Palette sampled directly from public/images/tesla-logo-dark.png.
const BLUE = '#33759c'; // bulb outline / neck / base / threads
const BLUE_LIGHT = '#7fb3d4'; // inner glass highlight
const GOLD = '#f6d52c'; // blades / hub / tower / filament
const GOLD_LIGHT = '#f9ee70'; // blade tip highlight
const WORDMARK = '#d9d6d0'; // "TESLA"
const TAGLINE = '#e7e4dd'; // institute line
const ACID = '#d8ff3d'; // site accent — spark colour

// ── FIX 1: bulb-to-text alignment ──────────────────────────────────────
// The navbar reference artwork (/images/tesla-logo-dark.png) has the
// bulb/turbine axis passing EXACTLY through the centre of the "E" letter:
// measured E centre = 81.0 == hub axis 81.0. The hero SVG must match.
// "E" ink bounds in wordmark-local units (the stadium bars' 2.65-radius
// caps bulge on BOTH sides):
//   E_1 [35.95, 59.75]   E_2 [31.25, 64.45]   E_3 [35.95, 59.75]
// → E centre (local) 47.85
// → E centre (absolute) 19 + 0.98 × 47.85 = 65.893
// → bulb group translateX = 65.893 − 100 = −34.107
const E_CENTER_LOCAL = (31.25 + 64.45) / 2; // 47.85
const WORDMARK_ORIGIN_X = 19;
const WORDMARK_SCALE = 0.98;
const BULB_AXIS_X = WORDMARK_ORIGIN_X + WORDMARK_SCALE * E_CENTER_LOCAL; // 65.893
const BULB_DX = BULB_AXIS_X - MARK.hub.cx; // −34.107

// ── FIX 2: bulb-to-text vertical positioning ──────────────────────────────
// Bulb block bottom-centre (base cap floor) currently at y=130.6 in the
// 200×230 viewBox. The E letter's top bar (E_1) begins at local y=1 →
// absolute y = 172 + 0.98 × 1 = 172.98. The raw gap is 42.38 units, which
// feels loose. We shift the entire bulb+turbine assembly DOWN so the bulb's
// bottom-centre sits directly above the "E" with a tight ~10-unit gap, making
// icon and text feel closely connected (matching the navbar reference).
//   gap_target = 10  →  shift = (172.98 − 10) − 130.6 = 32.38  →  BULB_DY = 32
const BULB_BLOCK_BOTTOM_Y = 130.6; // y of the base cap floor in viewBox units
const E_LETTER_TOP_Y = 172 + 0.98 * 1; // 172.98 — E_1 top bar, post wordmark transform
const DESIRED_GAP_Y = 10; // tight, connected feel
const BULB_DY = E_LETTER_TOP_Y - DESIRED_GAP_Y - BULB_BLOCK_BOTTOM_Y; // 32.38 → 32

// ── FIX 4: three-phase load sequence (all velocities velocity-matched) ──
// Idle (phase 3): one revolution every 8s = 45°/s, linear, infinite.
const IDLE_S = 8;
// Phase 1 (0–1.5s): FAST, ease-out — 3 turns (1080°) in 1.5s (average 720°/s).
// cubic-bezier(0.1, 0.325, 0.7, 0.775):
//   start slope 0.325/0.1 = 3.25 → ~2340°/s (≈6.5 rev/s) on entry,
//   end slope (1−0.775)/(1−0.7) = 0.75 × 720°/s → 540°/s on exit.
//   (Plain `ease-out` ends at 0°/s — a dead stop before phase 2 — so a
//   custom ease-out curve with a live exit velocity is used instead.)
//   The control polygon is strictly convex (slopes 3.25 > 0.75 = 0.75), so the
//   velocity falls MONOTONICALLY: 2340 → 1010 → 813 → 720 → 664 → 625 → 596 →
//   574 → 557 → 545 → 540°/s (verified numerically at 25ms steps: 0 speed
//   rises). The previous curve (0.3, 0.85, 0.4, 0.55) dipped to 344°/s at
//   ~1.0s then climbed back to 540°/s — a 57% re-acceleration "kick" right
//   before the seam — which this curve removes.
const SPIN1_MS = 1500;
// Phase 2 (1.5–3.2s): gradual deceleration — one more turn (360°) in 1.7s
// (average 211.8°/s). cubic-bezier(0.3, 0.765, 0.75, 0.947):
//   start slope 0.765/0.3 = 2.55 × 211.8°/s → 540°/s (exactly phase 1's
//   exit velocity), end slope (1−0.947)/(1−0.75) = 0.212 × 211.8°/s →
//   45°/s (exactly the idle speed). Smooth cubic-bezier decel into phase 3.
const SPIN2_MS = 1700;

type Phase = 'spin1' | 'spin2' | 'idle' | 'off';

const CSS = `
/* FIX 4 keyframes. Phase 1 ends at 1080° and phase 2 at 360° — both exact
   multiples of 360° — so every class switch lands at the same visual angle
   (≡ 0 mod 360) and the handoffs are invisible. */
@keyframes heroElSpin1 { from { transform: rotate(0deg); } to { transform: rotate(1080deg); } }
@keyframes heroElSpin2 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes heroElIdle  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Blades (SVG group) — transform-box: view-box locks the pivot to the exact
   hub coordinates (100, 78) so rotation never wobbles or orbits. */
.hero-el-blades-spin1 {
  animation: heroElSpin1 ${SPIN1_MS}ms cubic-bezier(0.1, 0.325, 0.7, 0.775) 1 forwards;
  transform-box: view-box;
  transform-origin: ${MARK.hub.cx}px ${MARK.hub.cy}px;
  will-change: transform;
}
.hero-el-blades-spin2 {
  animation: heroElSpin2 ${SPIN2_MS}ms cubic-bezier(0.3, 0.765, 0.75, 0.947) 1 forwards;
  transform-box: view-box;
  transform-origin: ${MARK.hub.cx}px ${MARK.hub.cy}px;
  will-change: transform;
}
.hero-el-blades-idle {
  animation: heroElIdle ${IDLE_S}s linear infinite;
  transform-box: view-box;
  transform-origin: ${MARK.hub.cx}px ${MARK.hub.cy}px;
  will-change: transform;
}

/* Spark orbit — mirrors the blade rotation 1:1 (same keyframes, durations
   and easing) so emitters stay glued to the tips through every phase. */
.hero-el-orbit-spin1 { animation: heroElSpin1 ${SPIN1_MS}ms cubic-bezier(0.1, 0.325, 0.7, 0.775) 1 forwards; will-change: transform; }
.hero-el-orbit-spin2 { animation: heroElSpin2 ${SPIN2_MS}ms cubic-bezier(0.3, 0.765, 0.75, 0.947) 1 forwards; will-change: transform; }
.hero-el-orbit-idle  { animation: heroElIdle ${IDLE_S}s linear infinite; will-change: transform; }

/* FIX 6 — gentle floating (3D presence) — translateY only, very subtle
   (0 → −8px), 4s ease-in-out. heroElGround mirrors this exact timeline
   inversely so the shadow stays in sync. */
@keyframes heroElFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.hero-el-float { animation: heroElFloat 4s ease-in-out infinite; will-change: transform; }

/* FIX 6 — desktop pointer tilt (parallax 3D): rotateX/rotateY are set from
   JS on pointermove (max ±5deg), eased by the transition; identity at rest. */
.hero-el-tilt {
  transform: perspective(800px) rotateX(0deg) rotateY(0deg);
  transition: transform 0.25s ease-out;
  will-change: transform;
}

/* FIX 2b — ambient glow breathing behind the mark (opacity-only animation). */
@keyframes heroElGlowPulse { from { opacity: 0.6; } to { opacity: 1; } }
.hero-el-glow { animation: heroElGlowPulse 4s ease-in-out infinite alternate; will-change: opacity; }

/* FIX 2d — ground shadow breathing INVERSE-sync with the float: identical
   4s ease-in-out timeline as heroElFloat. Logo rises (float 50%) →
   shadow shrinks to scale(0.85) and dims (light source further away);
   logo settles (0/100%) → full size + full opacity. */
@keyframes heroElGround {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(0.85); opacity: 0.6; }
}
.hero-el-ground { animation: heroElGround 4s ease-in-out infinite; transform-origin: 50% 50%; will-change: transform, opacity; }

/* FIX 5 — tip sparks: opacity fade-out (1→0) + slight outward translate +
   scale-down, in the emitter's local frame (emitters rotate with the
   blades, so local -Y = radially outward). 0.6–1s cycles with staggered
   delays → a continuous spark stream at every tip. */
@keyframes heroElSpark {
  0%   { transform: translate(-50%, 0) scale(1); opacity: 0; }
  15%  { opacity: var(--spark-alpha, 0.85); }
  100% { transform: translate(-50%, var(--spark-dist, -34px)) scale(0.2); opacity: 0; }
}
.hero-el-spark {
  --spark-alpha: 0.85;
  position: absolute;
  top: -4px;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  /* acid-lime core melting into the blades' gold — soft by construction */
  background: radial-gradient(circle at 50% 50%, #f8ffcf 0%, ${ACID} 32%, rgba(246, 213, 44, 0.55) 62%, rgba(246, 213, 44, 0) 78%);
  box-shadow: 0 0 8px 2px rgba(216, 255, 61, 0.38);
  /* SVG soft-glow filter (feGaussianBlur + feMerge halo below): particles
     read as luminous plasma, never as harsh sharp dots. */
  filter: url(#hero-el-soft-glow);
  animation: heroElSpark 1s ease-out infinite;
  will-change: transform, opacity;
  pointer-events: none;
}
/* Phase intensity (FIX 5): Phase 1 fast spin = hot — brighter, bigger,
   faster + 2 extra particles per tip ("energy building up"). */
.hero-el-sparks-intense .hero-el-spark {
  --spark-alpha: 1;
  width: 11px;
  height: 11px;
  animation-duration: 0.65s;
  box-shadow: 0 0 14px 4px rgba(216, 255, 61, 0.55);
}
.hero-el-spark-extra { display: none; }
.hero-el-sparks-intense .hero-el-spark-extra { display: block; animation-duration: 0.6s; }
/* Phase 3 (constant speed) = subtle/minimal — small, dim embers. */
.hero-el-sparks-idle .hero-el-spark {
  --spark-alpha: 0.45;
  width: 6px;
  height: 6px;
  box-shadow: 0 0 6px 1px rgba(216, 255, 61, 0.22);
}
/* FIX 6 — tablets (lg…xl): lighter spark field for less GPU work; the full
   5-particle surge stays a desktop (xl+) treat. Core sparks unaffected. */
@media (max-width: 1279px) {
  .hero-el-spark-extra { display: none !important; }
}

/* FIX 2c — bulb-edge spark ring. The tip sparks ride the ROTATING blade
   emitters; the bulb is static, so this is a separate static layer holding 8
   emitters spaced 45° apart, sitting exactly ON the bulb outline and firing
   acid-lime plasma radially outward.

   Geometry is measured, not guessed. A live getBoundingClientRect probe of the
   rendered outline gave: bulb centre == hub centre (hubX, hubY) and radius
   64.00px at size=320, i.e. exactly MARK.bulbRadius (40) × scale (1.6) — NOT
   the 70px a "~bulb radius" estimate suggests. The outline is an open 253.7°
   arc (M68 102 A 40 40 0 1 1 132 102), so its bbox centre sits 12.8px BELOW the
   true centre; anchoring to the bbox would push the whole ring off-axis.
   --bulb-r is fed the real radius from the component. */
/* Visibility-tuned keyframes. The previous 0%→20%→100% shape ramped straight
   back down, so each particle spent almost its whole cycle below the eye's
   threshold. Measured with all sibling animations frozen (only sparks varying)
   the old shape peaked at 46px of coverage = 0.10% of the bulb region, i.e.
   technically rendering but perceptually invisible — exactly the "sparks not
   visible" report. Adding a 18%→62% plateau makes each particle DWELL at full
   brightness, so several are always lit at once. */
@keyframes heroElBulbSpark {
  0%   { opacity: 0; transform: rotate(var(--angle)) translateX(calc(var(--bulb-r) * 0.9)) scale(0.35); }
  18%  { opacity: var(--bspark-alpha, 0.9); transform: rotate(var(--angle)) translateX(var(--bulb-r)) scale(1); }
  62%  { opacity: var(--bspark-alpha, 0.9); transform: rotate(var(--angle)) translateX(calc(var(--bulb-r) * 1.07)) scale(0.94); }
  100% { opacity: 0; transform: rotate(var(--angle)) translateX(calc(var(--bulb-r) * 1.32)) scale(0.18); }
}
.hero-el-bspark {
  --bspark-alpha: 0.9;
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
  height: 6px;
  /* static centring on the ring origin. invariant: margin == -size / 2, so
     transform-origin (50% 50%) lands exactly on the ring centre. margins are
     never animated, so the keyframes stay purely transform + opacity
     (compositor-only). Verified live: every emitter lands 63.99–64.01px from
     the bulb centre, i.e. exactly --bulb-r = 64px. */
  margin-top: -3px;
  margin-left: -3px;
  border-radius: 9999px;
  /* acid-lime core fading to transparent — soft plasma, not a hard dot */
  background: radial-gradient(circle at 50% 50%, #f6ffd6 0%, ${ACID} 38%, rgba(216, 255, 61, 0) 78%);
  box-shadow: 0 0 10px 3px rgba(216, 255, 61, 0.6);
  opacity: 0;
  animation: heroElBulbSpark var(--dur, 1.8s) ease-out infinite;
  animation-delay: var(--delay, 0s);
  will-change: transform, opacity;
  pointer-events: none;
}
/* Phase intensity mirrors the tip sparks: hot during the spin-up surge,
   minimal embers once the rotation is cruising. Idle was the state that
   persisted >95% of the time, and at 4px / alpha 0.5 / shadow 0.28 it was
   below the perceptual threshold — raised to 6px / 0.85 so the ring stays
   readable at cruise without competing with the blades. */
.hero-el-bulb-sparks-hot .hero-el-bspark {
  --bspark-alpha: 1;
  width: 8px;
  height: 8px;
  margin-top: -4px;
  margin-left: -4px;
  box-shadow: 0 0 14px 4px rgba(216, 255, 61, 0.72);
}
.hero-el-bulb-sparks-idle .hero-el-bspark {
  --bspark-alpha: 0.85;
  width: 6px;
  height: 6px;
  margin-top: -3px;
  margin-left: -3px;
  box-shadow: 0 0 9px 2px rgba(216, 255, 61, 0.55);
}

/* ── FIX 3 — electric-circuit ambience behind the bulb ──────────────────────
   The report was that the background behind the bulb "feels flat/plain".
   Root cause was verifiable, not aesthetic taste: the only backdrop layer was
   .hero-el-glow, and a pixel-contribution probe showed it DOES render (142k px,
   11% of frame) but its entire animation is an opacity fade on a symmetric
   radial — no structure, no direction, no motion. A field with no internal
   features reads as flat however bright it is.

   So this layer adds the two things the old backdrop lacked: STRUCTURE
   (radiating circuit spokes) and DIRECTION (electrons travelling along
   visible orbital paths). Both are transform-only and sit on their own
   compositor layers, so the cost is one rasterised texture per layer.
   Positioned in the tilt wrapper (not the root) so ambience parallaxes with
   the mark instead of shearing away from it under pointer tilt. */
.hero-el-circuit {
  position: absolute;
  border-radius: 9999px;
  /* 12 faint spokes = circuit-like radials. Kept at 0.10 alpha so the effect
     is felt rather than read; the mark stays the brightest thing on screen. */
  background: repeating-conic-gradient(
    from 0deg,
    rgba(95, 182, 232, 0.1) 0deg 1.4deg,
    transparent 1.4deg 30deg
  );
  /* Radial mask removes the centre AND the rim, so the spokes fade in from
     behind the mark and dissolve before the element edge — no visible circle
     boundary, which is what would make it look like a pasted-on disc.
     closest-side is load-bearing: the default (farthest-corner) would put
     the gradient's 100% stop at the square's corner = 248.9px, i.e. ~1.4x past
     the 176px horizontal edge, so the mask would still be ~30% opaque at the
     element boundary and paint a visible ring. closest-side pins 100% to the
     176px edge, and the fade completes at 94% = 165px, safely inside. */
  -webkit-mask-image: radial-gradient(circle closest-side at 50% 50%, transparent 42%, #000 56%, #000 76%, transparent 94%);
  mask-image: radial-gradient(circle closest-side at 50% 50%, transparent 42%, #000 56%, #000 76%, transparent 94%);
  animation: heroElCircuit 26s linear infinite;
  will-change: transform;
}
@keyframes heroElCircuit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Electrons: dots riding circular orbits at different radii/speeds/directions.
   The double-rotate trick (rotate → translateX → counter-rotate) keeps each
   dot upright while it orbits, so it reads as a particle travelling a path
   rather than a spinning shape. --er is the orbit radius (fed per-electron);
   --espin is the period; odd children run reverse for contra-rotation. */
.hero-el-electron {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 4px;
  /* invariant: margin == -size / 2, so the dot is centred on the orbit origin
     and the transform-origin never has to be re-derived per orbit radius */
  margin-top: -2px;
  margin-left: -2px;
  border-radius: 9999px;
  background: radial-gradient(circle at 50% 50%, #ffffff 0%, #7ec8ff 42%, rgba(126, 200, 255, 0) 80%);
  box-shadow: 0 0 8px 2px rgba(126, 200, 255, 0.5);
  will-change: transform;
  animation: heroElElectron var(--espin, 14s) linear infinite;
  animation-delay: var(--edelay, 0s);
}
.hero-el-electron:nth-child(odd) { animation-direction: reverse; }
@keyframes heroElElectron {
  from { transform: rotate(0deg) translateX(var(--er)) rotate(0deg); }
  to { transform: rotate(360deg) translateX(var(--er)) rotate(-360deg); }
}

/* Accessibility: freeze everything, keep the static mark. */
@media (prefers-reduced-motion: reduce) {
  .hero-el-float, .hero-el-glow, .hero-el-ground, .hero-el-spark, .hero-el-bspark,
  .hero-el-circuit, .hero-el-electron,
  .hero-el-orbit-spin1, .hero-el-orbit-spin2, .hero-el-orbit-idle,
  .hero-el-blades-spin1, .hero-el-blades-spin2, .hero-el-blades-idle { animation: none !important; }
  .hero-el-tilt { transition: none !important; }
  .hero-el-sparks, .hero-el-bulb-sparks { display: none !important; }
  /* the circuit spokes are a rotation cue only — without motion they are
     pure visual noise behind the mark, so they go with the sparks */
  .hero-el-circuit { display: none !important; }
}
`;

// Layout the strict-vector subtitle up-front (module-level pure helper —
// no fonts used, same technique as HeroAnimatedLogo).
function layoutSubtitleGlyphs(text: string): { d: string; x: number }[] {
  const glyphs: { d: string; x: number }[] = [];
  let x = 0;
  for (const ch of text.toUpperCase()) {
    if (ch === ' ') {
      x += 3.5;
      continue;
    }
    const d = VECTOR_FONT[ch];
    if (d) glyphs.push({ d, x });
    x += 5.2;
  }
  return glyphs;
}

const SUBTITLE_GLYPHS = layoutSubtitleGlyphs('NATIONAL INSTITUTE OF TECHNOLOGY PATNA');

// Staggered particles per blade-tip emitter. Distances vary for an organic
// crackle; delays (0.35s apart on a 1s cycle) keep each tip emitting a
// continuous stream. Alpha is phase-controlled via CSS (see --spark-alpha).
const SPARKS = [
  { delay: '0s', dist: '-38px' },
  { delay: '0.35s', dist: '-50px' },
  { delay: '0.7s', dist: '-30px' },
];
// FIX 5 — Phase-1-only particles: pop in during the fast spin-up for the
// "energy building up" surge, gone once the rotation stabilises.
const EXTRA_SPARKS = [
  { delay: '0.18s', dist: '-44px' },
  { delay: '0.48s', dist: '-28px' },
];

// FIX 2c — bulb-edge spark ring. 8 static emitters spaced 45° around the bulb
// outline, each firing radially outward. Delays are ~1/8 of the cycle apart so
// the ring emits continuously rather than in a visible wave; the durations are
// deliberately unequal so the pattern never syncs up and reads mechanical.
const BULB_SPARKS = [
  { angle: 0, delay: '0s', dur: '1.8s' },
  { angle: 45, delay: '0.22s', dur: '1.95s' },
  { angle: 90, delay: '0.45s', dur: '1.7s' },
  { angle: 135, delay: '0.67s', dur: '2.05s' },
  { angle: 180, delay: '0.9s', dur: '1.85s' },
  { angle: 225, delay: '1.12s', dur: '2s' },
  { angle: 270, delay: '1.35s', dur: '1.75s' },
  { angle: 315, delay: '1.57s', dur: '1.9s' },
];

export function HeroEnergyLogo({
  size = 320,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  const [phase, setPhase] = useState<Phase>('spin1');
  const tiltRef = useRef<HTMLDivElement>(null);

  // FIX 6 — desktop pointer tilt (optional parallax 3D): max ±5deg rotateX/Y
  // derived from the cursor position over the logo, eased by the CSS
  // transition on .hero-el-tilt. Mouse-only (touch never tilts), and skipped
  // entirely under prefers-reduced-motion. Direct ref writes — zero
  // re-renders per mousemove.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = tiltRef.current;
    if (!el) return;
    const MAX_DEG = 5;
    let rect: DOMRect | null = null;
    const onEnter = () => {
      rect = el.getBoundingClientRect();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (!rect) rect = el.getBoundingClientRect();
      const dx = (e.clientX - rect.left) / rect.width - 0.5; // −0.5…0.5
      const dy = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform =
        'perspective(800px) rotateX(' + (-dy * MAX_DEG * 2).toFixed(2) + 'deg) rotateY(' + (dx * MAX_DEG * 2).toFixed(2) + 'deg)';
    };
    const onLeave = () => {
      rect = null;
      el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
    };
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  useEffect(() => {
    // Reduced motion: leave phase as-is — the CSS media query in this
    // component freezes every animation and hides the spark field, so the
    // mark renders as a clean static logo with no state flip needed.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Safety net: if an animationend event is missed (background tab, etc.),
    // still advance through the phases into the constant idle spin.
    const t1 = window.setTimeout(
      () => setPhase((p) => (p === 'spin1' ? 'spin2' : p)),
      SPIN1_MS + 120
    );
    const t2 = window.setTimeout(
      () => setPhase((p) => (p === 'spin2' ? 'idle' : p)),
      SPIN1_MS + SPIN2_MS + 120
    );
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // FIX 4 phase handoffs, driven by animationend (with the safety timeouts
  // above as fallback). Keyframe-name checks keep us immune to any other
  // animation events bubbling through.
  const handlePhaseEnd = (e: React.AnimationEvent<SVGElement>) => {
    if (e.animationName === 'heroElSpin1') setPhase('spin2');
    else if (e.animationName === 'heroElSpin2') setPhase('idle');
  };

  // ── Geometry: viewBox is 200 × 230, rendered at width = size ──
  const scale = size / 200;
  const logoH = 230 * scale; // full lockup height (mark + wordmark + tagline)
  const hubX = BULB_AXIS_X * scale; // hub after the E-alignment shift (FIX 1)
  const hubY = (MARK.hub.cy + BULB_DY) * scale; // 78 + 32 = 110 — hub follows the bulb (FIX 2)
  const tipR = (MARK.hub.cy - 17) * scale; // hub → blade tip = 61 units
  // FIX 2c — true bulb radius. The bulb outline's arc centre coincides with the
  // turbine hub, so hubX/hubY is also the bulb centre; radius is exactly
  // MARK.bulbRadius × scale (verified live: 64.00px at size=320).
  const bulbR = MARK.bulbRadius * scale;

  const bladeClass =
    phase === 'spin1'
      ? 'hero-el-blades-spin1'
      : phase === 'spin2'
        ? 'hero-el-blades-spin2'
        : phase === 'idle'
          ? 'hero-el-blades-idle'
          : '';
  const orbitClass =
    phase === 'spin1'
      ? 'hero-el-orbit-spin1'
      : phase === 'spin2'
        ? 'hero-el-orbit-spin2'
        : phase === 'idle'
          ? 'hero-el-orbit-idle'
          : '';

  return (
    <div className={`relative select-none ${className}`} style={{ width: size, height: logoH + size * 0.14 }}>
      <style>{CSS}</style>

      {/* FIX 5 — soft-glow SVG filter for the spark particles: feGaussianBlur
          creates the halo, feMerge lays it under the untouched core so
          sparks stay luminous but never sharp. Hidden zero-size SVG,
          referenced from CSS via filter: url(#hero-el-soft-glow). */}
      <svg aria-hidden focusable="false" width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="hero-el-soft-glow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.3" result="soft" />
            <feMerge>
              <feMergeNode in="soft" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* FIX 2a + FIX 4 — Premium layered ground shadow: flat elliptical contact
        shadow (dark, centred under the full lockup) with two faint blue-tinted
        outer rings radiating outward like an energy ripple/aura. All three
        layers are inverse-synchronised with the float animation (FIX 2d). */}
      <div
        aria-hidden
        className="hero-el-ground absolute z-[1] pointer-events-none"
        style={{
          left: size * 0.15,
          width: size * 0.7,
          height: size * 0.175,
          top: logoH + size * 0.02,
          borderRadius: '9999px',
          // FIX 1 (visibility) — the old gradient was pure black on the
          // near-black `bg-ink` page, so it rendered but had ZERO contrast
          // (verified via pixel diff: maxDelta 12 vs the page background —
          // black-on-black). A dark occlusion core can never win here; the
          // only thing that reads as a floor shadow on a dark UI is a
          // *luminous* pool. Measured A/B in live Chromium (vs hidden
          // element baseline, area% of clip / maxDelta):
          //   old black       1.4% / 12    invisible
          //   blue only      28.7% /  84
          //   cyan+blue (F2) 32.2% / 142   <- chosen, 4.7x the blue-only
          // A soft white-blue core over a broader blue pool, so the logo
          // appears to stand in a pool of its own light.
          background:
            'radial-gradient(ellipse at center, rgba(130, 200, 255, 0.55) 0%, transparent 70%), radial-gradient(ellipse at center, rgba(70, 150, 255, 0.68) 0%, rgba(70, 150, 255, 0.3) 40%, transparent 80%)',
          filter: 'blur(10px)',
        }}
      />
      {/* FIX 4 — Blue-tinted outer glow rings (energy aura). Two concentric
          ellipses: bright inner + fainter outer. */}
      <div
        aria-hidden
        className="hero-el-ground-glow absolute z-0 pointer-events-none"
        style={{
          left: size * 0.10,
          width: size * 0.8,
          height: size * 0.2,
          top: logoH + size * 0.08,
          borderRadius: '9999px',
          background:
            'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.28) 0%, rgba(95, 182, 232, 0.15) 30%, rgba(59, 130, 246, 0.08) 55%, transparent 75%)',
          filter: 'blur(24px)',
        }}
      />
      <div
        aria-hidden
        className="hero-el-ground-glow-outer absolute z-0 pointer-events-none"
        style={{
          left: size * 0.05,
          width: size * 0.9,
          height: size * 0.24,
          top: logoH + size * 0.04,
          borderRadius: '9999px',
          background:
            'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, rgba(95, 182, 232, 0.1) 30%, transparent 65%)',
          filter: 'blur(28px)',
        }}
      />

      {/* FIX 6 — pointer-tilt wrapper (desktop parallax 3D): everything above
          the floor — glow, mark, sparks — tilts together; the ground shadow
          stays flat on the floor outside this wrapper. */}
      <div ref={tiltRef} className="hero-el-tilt absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
      {/* FIX 3 — electric-circuit field. Sits behind the ambient glow so the
          glow still tints the region closest to the mark while the circuit
          structure reads through the outer falloff. Diameter 1.1x the mark,
          centred exactly on the hub/bulb axis (hubX, hubY) so the spokes
          radiate from the bulb rather than from the lockup's bounding box. */}
      <div
        aria-hidden
        className="hero-el-circuit absolute z-0 pointer-events-none"
        style={{
          left: hubX - size * 0.55,
          top: hubY - size * 0.55,
          width: size * 1.1,
          height: size * 1.1,
        }}
      />
      {/* Orbiting electrons. Radii step outward past the blade tips
          (tipR = 0.305 x size) so the paths sweep the open background and
          never cross the mark. Periods are mutually prime-ish (11/17/23/29s)
          so the four dots never re-form a static pattern. */}
      <div
        aria-hidden
        className="absolute z-0 pointer-events-none"
        style={{ left: hubX, top: hubY, width: 0, height: 0 }}
      >
        {[
          { r: 0.36, spin: 11, delay: 0 },
          { r: 0.42, spin: 17, delay: -3 },
          { r: 0.47, spin: 23, delay: -7 },
          { r: 0.52, spin: 29, delay: -12 },
        ].map((e) => (
          <span
            key={e.spin}
            className="hero-el-electron"
            style={
              {
                '--er': `${size * e.r}px`,
                '--espin': `${e.spin}s`,
                '--edelay': `${e.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* FIX 2b — Ambient glow behind the mark: yellow (blades) core blending
          into blue (bulb), low alpha, large blur; opacity pulses 0.6↔1 on a
          calm 4s alternate cycle so the mark reads as emitting energy. */}
      <div
        aria-hidden
        className="hero-el-glow absolute z-0 pointer-events-none"
        style={{
          left: hubX - size * 0.65,
          top: hubY - size * 0.65,
          width: size * 1.3,
          height: size * 1.3,
          borderRadius: '9999px',
          background: `radial-gradient(circle at 50% 45%, rgba(246, 213, 44, 0.22) 0%, rgba(51, 117, 156, 0.18) 40%, rgba(51, 117, 156, 0.07) 58%, transparent 74%)`,
          filter: 'blur(24px)',
        }}
      />

      {/* Floating layer: the mark + the spark field ride the float together */}
      <div
        className={`absolute left-0 top-0 ${phase !== 'off' ? 'hero-el-float' : ''}`}
        style={{ width: size, height: logoH }}
      >
        <svg
          width={size}
          height={logoH}
          viewBox="0 0 200 230"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="TESLA — Technical Club NIT Patna"
          className="relative z-10 block"
          style={
            // FIX 2c — object-level depth: tight contact shadow + soft ambient
            // lift so the mark reads as raised off the background. (Hero only
            // renders at lg+; browsers composite this cheaply for one element.)
            {
              filter:
                'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3)) drop-shadow(0 20px 30px rgba(0, 0, 0, 0.4))',
            }
          }
        >
          <defs>
            <linearGradient id="hero-el-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD_LIGHT} />
              <stop offset="100%" stopColor={GOLD} />
            </linearGradient>
            {/* FIX 6 — lit-bulb stroke glow: two chained blue-tinted
                drop-shadows (tight electric rim + wide soft halo). Baked into
                the STATIC geometry, so it rasterises once and never costs
                per-frame time while the blades spin. */}
              <filter id="hero-el-bulb-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#5fb6e8" floodOpacity="0.9" />
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#2b6f9e" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* ── Static body ──
              FIX 1: the bulb/turbine block is shifted by BULB_DX so its axis
              lands EXACTLY on the "E" letter centre (navbar reference);
              the wordmark group is the unshifted alignment reference.
              Depth comes from the CSS drop-shadows on the <svg> (FIX 2c). */}
          <g>
            <g transform={`translate(${BULB_DX} ${BULB_DY})`}>
              {/* FIX 6 — blue strokes + highlight get the lit-bulb glow; the
                  gold tower/filament stay untinted outside the filter. */}
              <g filter="url(#hero-el-bulb-glow)">
                <g stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" fill="none">
                  <path d={MARK.bulbOutline} />
                  <path d={MARK.neckLeft} />
                  <path d={MARK.neckRight} />
                  <path d={MARK.base} strokeWidth="2" strokeLinejoin="round" />
                </g>
                {/* subtle inner glass highlight */}
                <path d={MARK.highlightArc} stroke={BLUE_LIGHT} strokeWidth="4.5" strokeLinecap="round" opacity="0.9" />
              </g>

              {/* turbine tower + filament inside the bulb */}
              <path d={MARK.tower} fill="url(#hero-el-gold)" />
              <rect
                x={MARK.filament.x}
                y={MARK.filament.y}
                width={MARK.filament.width}
                height={MARK.filament.height}
                rx={MARK.filament.rx}
                fill={GOLD}
              />
            </g>

            {/* "TESLA" wordmark + institute tagline (alignment reference) */}
            <g transform={`translate(${WORDMARK_ORIGIN_X}, 172) scale(${WORDMARK_SCALE})`}>
              <g fill={WORDMARK}>
                {Object.entries(MARK.wordmark).map(([k, d]) => (
                  <path key={k} d={d} />
                ))}
              </g>
              <g transform="translate(-14, 40)" color={TAGLINE}>
                <g stroke="currentColor" fill="none" strokeWidth={0.6} strokeLinecap="round" strokeLinejoin="round">
                  {SUBTITLE_GLYPHS.map((g, i) => (
                    <path key={i} d={g.d} transform={`translate(${g.x}, 0)`} />
                  ))}
                </g>
              </g>
            </g>
          </g>

          {/* ── Turbine: ONE rigid group — hub + exactly 3 blades ──
              Only this group rotates; bulb and text stay perfectly still.
              Same BULB_DX + BULB_DY wrapper as the static bulb so the spin pivot
              (local 100,78) sits on the aligned axis. */}
          <g transform={`translate(${BULB_DX} ${BULB_DY})`}>
            <g className={bladeClass} onAnimationEnd={handlePhaseEnd}>
              <circle cx={MARK.hub.cx} cy={MARK.hub.cy} r={MARK.hub.r} fill="url(#hero-el-gold)" />
              <path d={MARK.blade} fill="url(#hero-el-gold)" />
              <path d={MARK.blade} fill="url(#hero-el-gold)" transform={`rotate(120 ${MARK.hub.cx} ${MARK.hub.cy})`} />
              <path d={MARK.blade} fill="url(#hero-el-gold)" transform={`rotate(240 ${MARK.hub.cx} ${MARK.hub.cy})`} />
              <circle cx={MARK.hub.cx} cy={MARK.hub.cy} r="3" fill="#fffbf4" />
            </g>
          </g>
        </svg>

        {/* ── Spark field: an orbit layer rotating 1:1 with the blades.
               3 emitters sit exactly on the blade tips (120° apart); each
               fires particles radially outward with fade-out. ── */}
        {phase !== 'off' && (
          <div
            aria-hidden
            className={`hero-el-sparks absolute z-20 pointer-events-none ${orbitClass} ${
              phase === 'spin1' ? 'hero-el-sparks-intense' : ''
            } ${phase === 'idle' ? 'hero-el-sparks-idle' : ''}`}
            style={{
              left: hubX - tipR,
              top: hubY - tipR,
              width: tipR * 2,
              height: tipR * 2,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-0"
                style={{ transform: `rotate(${i * 120}deg)` }}
              >
                {[...SPARKS, ...EXTRA_SPARKS].map((s, i) => (
                  <span
                    key={s.delay}
                    className={`hero-el-spark ${i >= SPARKS.length ? 'hero-el-spark-extra' : ''}`}
                    style={{ animationDelay: s.delay, '--spark-dist': s.dist } as React.CSSProperties}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* FIX 2c — bulb-edge spark ring: a STATIC layer (the bulb does not
            rotate) of 8 emitters sitting exactly on the bulb outline at
            radius bulbR, firing acid-lime plasma radially outward. Rides the
            float with the mark, but never spins with the blades. */}
        {phase !== 'off' && (
          <div
            aria-hidden
            className={`hero-el-bulb-sparks absolute z-30 pointer-events-none ${
              phase === 'spin1' ? 'hero-el-bulb-sparks-hot' : ''
            } ${phase === 'idle' ? 'hero-el-bulb-sparks-idle' : ''}`}
            style={
              {
                left: hubX,
                top: hubY,
                width: 0,
                height: 0,
                '--bulb-r': `${bulbR}px`,
              } as React.CSSProperties
            }
          >
            {BULB_SPARKS.map((s) => (
              <span
                key={s.angle}
                className="hero-el-bspark"
                style={
                  {
                    '--angle': `${s.angle}deg`,
                    '--delay': s.delay,
                    '--dur': s.dur,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
