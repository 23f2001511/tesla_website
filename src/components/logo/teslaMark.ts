// src/components/logo/teslaMark.ts

// Shared geometry + palette for the official club mark, recreated purely in SVG.
// All paths live in a 200×200 viewBox with the turbine hub at (100, 78).
// Both Logo and HeroAnimatedLogo draw from here so the mark is defined exactly once.
// Geometry traced against public/images/tesla-logo.jpg (bulb centre (81,80), r≈38.4
// in the reference, remapped to (100,78), r=40 here — scale ×1.042).

export const TESLA_BLUE = '#1e95d7';
export const TESLA_GOLD = '#fdd900';

export const MARK = {
  hub: { cx: 100, cy: 78, r: 7.5 },
  bulbRadius: 40,

  // The blade path starts perfectly flush with the hub center to avoid detachment.
  // Oriented perfectly at 12 o'clock; slimmed to the official blade width.
  blade: 'M100 78 L97.2 68 C96.4 45 98 25 100 17 C102 25 103.6 45 102.8 68 Z',

  highlightArc: 'M75 55 A 32 32 0 0 0 68 76',

  // Bulb glass: the official outline is an open arc — it never closes across
  // the neck. Ends 37° below horizontal, exactly where the neck curves begin.
  bulbOutline: 'M68 102 A 40 40 0 1 1 132 102',

  // Neck curves leave the glass tangentially and flare into the lip that
  // slightly overhangs the screw cap.
  neckLeft: 'M68 102 C73 108.7 77.5 113.5 78.7 118.2',
  neckRight: 'M132 102 C127 108.7 122.5 113.5 121.3 118.2',

  // Screw cap: an open, slightly tapered U-cup with a rounded floor — no
  // closed trapezoid in the official mark.
  base: 'M81.8 119.3 L82.7 126.4 Q83.2 130.6 87.3 130.6 L112.7 130.6 Q116.8 130.6 117.3 126.4 L118.2 119.3',

  // Three horizontal thread lines under the cap; the middle one runs longer
  // than the top and bottom ones, as in the official logo.
  screws: [
    'M90.5 137.2 H109.5',
    'M87.5 146.4 H112.5',
    'M90.5 155.6 H109.5',
  ],

  // Tower shaft flaring into the pedestal foot that rests on the cap floor.
  tower: 'M97 80 L103 80 L102.6 111 Q102.6 119.5 106.5 124 L106.5 127.2 L93.5 127.2 L93.5 124 Q97.4 119.5 97.4 111 Z',
  filament: { x: 94.5, y: 115.5, width: 11, height: 9, rx: 3.5 },

  // The official T≡SLA wordmark traced letter by letter (bounds 162×30).
  wordmark: {
    // Sheared top bar + centred stem with a soft swept cut at the bottom left.
    T_1: 'M4 1 L24.6 1 L20.6 7.6 L0 7.6 Z',
    T_2: 'M8.6 7.6 L15.3 7.6 L15.3 28.9 L12.1 28.9 Q8.6 27.7 8.6 24.4 Z',
    // Three stadium bars; the middle bar is the long one.
    E_1: 'M38.6 1 L57.1 1 A2.65 2.65 0 0 1 57.1 6.3 L38.6 6.3 A2.65 2.65 0 0 1 38.6 1 Z',
    E_2: 'M33.9 12.4 L61.8 12.4 A2.65 2.65 0 0 1 61.8 17.7 L33.9 17.7 A2.65 2.65 0 0 1 33.9 12.4 Z',
    E_3: 'M38.6 23.8 L57.1 23.8 A2.65 2.65 0 0 1 57.1 29.1 L38.6 29.1 A2.65 2.65 0 0 1 38.6 23.8 Z',
    // Stencil S: top stroke hooks down at the left, bottom stroke hooks up at
    // the right, floating stadium bar between — split by diagonal channels.
    S: 'M74.4 1 L96.3 1 L96.3 4.1 L91.6 7.9 L78.4 7.9 L71.3 11.2 L71.3 4.1 Q71.3 1 74.4 1 Z M75.3 12.1 L92.1 12.1 A2.9 2.9 0 0 1 92.1 17.9 L75.3 17.9 A2.9 2.9 0 0 1 75.3 12.1 Z M76 22 L89.2 22 L96.3 18.7 L96.3 25.8 Q96.3 28.9 93.2 28.9 L71.3 28.9 L71.3 25.8 Z',
    // Stem with a diagonal top cut, foot with the matching diagonal end cut.
    L_1: 'M114.9 1 L106.2 8.3 L106.2 28.9 L114.9 28.9 Z',
    L_2: 'M106.2 20.9 L125.5 20.9 L125.5 23.6 L120.2 28.9 L106.2 28.9 Z',
    // Open geometric A: full-height right leg plus a detached half-height left
    // leg, separated by a diagonal channel — open at the bottom, no fill body.
    A_1: 'M148.7 0.6 L162 28.9 L152 28.9 L147.4 4.3 Z',
    A_2: 'M143.2 12.9 L146.5 28.9 L136.1 28.9 Z',
  }
};

// Custom SVG path definitions for a tiny strict-vector font (4x5 grid).
// Required to display "NATIONAL INSTITUTE OF TECHNOLOGY PATNA" without any HTML text/fonts.
export const VECTOR_FONT: Record<string, string> = {
  N: 'M 0 5 L 0 0 L 4 5 L 4 0',
  A: 'M 0 5 L 2 0 L 4 5 M 1 2.5 L 3 2.5',
  T: 'M 0 0 L 4 0 M 2 0 L 2 5',
  I: 'M 1 0 L 3 0 M 2 0 L 2 5 M 1 5 L 3 5',
  O: 'M 0 1 L 0 4 L 1 5 L 3 5 L 4 4 L 4 1 L 3 0 L 1 0 Z',
  L: 'M 0 0 L 0 5 L 4 5',
  S: 'M 4 1 L 3 0 L 1 0 L 0 1 L 0 2 L 4 3 L 4 4 L 3 5 L 1 5 L 0 4',
  U: 'M 0 0 L 0 4 L 1 5 L 3 5 L 4 4 L 4 0',
  E: 'M 4 0 L 0 0 L 0 5 L 4 5 M 0 2.5 L 3 2.5',
  F: 'M 4 0 L 0 0 L 0 5 M 0 2.5 L 3 2.5',
  C: 'M 4 1 L 3 0 L 1 0 L 0 1 L 0 4 L 1 5 L 3 5 L 4 4',
  H: 'M 0 0 L 0 5 M 4 0 L 4 5 M 0 2.5 L 4 2.5',
  G: 'M 4 1 L 3 0 L 1 0 L 0 1 L 0 4 L 1 5 L 3 5 L 4 4 L 4 2.5 L 2 2.5',
  Y: 'M 0 0 L 2 2.5 L 4 0 M 2 2.5 L 2 5',
  P: 'M 0 5 L 0 0 L 3 0 L 4 1 L 4 2 L 3 3 L 0 3',
};
