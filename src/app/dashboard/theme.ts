// Shared light/dark theme support for the dashboard.
//
// The whole app is styled dark-first: globals.css hardcodes dark values into
// the Tailwind @theme variables and dashboard pages use literal utilities like
// text-white / bg-white/[0.03] / text-gray-400. Tailwind v4 compiles every
// color utility to `var(--color-*)` (opacity modifiers use color-mix over the
// same variable), so light mode is delivered by re-mapping those variables
// inside a `[data-theme='light']` scope that the dashboard layout places on
// its root element. Only arbitrary-hex utilities (bg-[#080c14], …) bypass the
// variables and need explicit class overrides.

export type ThemeChoice = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_KEY = 'tesla-theme';
export const THEME_CHANGE_EVENT = 'tesla-theme-change';

export function getStoredThemeChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'system' || stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Storage unavailable — fall through to the default.
  }
  return 'system';
}

export function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  if (choice === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }
  return choice;
}

export function setStoredThemeChoice(choice: ThemeChoice) {
  try {
    localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Storage unavailable — the theme still applies for this session.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export const DASHBOARD_THEME_CSS = `
[data-theme='light'] {
  color-scheme: light;

  --color-background: #f1f5f9;
  --color-foreground: #0f172a;
  --color-card: #ffffff;
  --color-card-foreground: #0f172a;
  --color-border: #cbd5e1;
  --color-muted: #e2e8f0;
  --color-muted-foreground: #475569;

  /* text-white becomes ink; the white/[0.0x] overlays become dark tints */
  --color-white: #0f172a;
  --color-black: #ffffff;

  /* gray scale inverted: bright-on-dark text maps to dark-on-light */
  --color-gray-100: #111827;
  --color-gray-200: #1f2937;
  --color-gray-300: #374151;
  --color-gray-400: #4b5563;
  --color-gray-500: #6b7280;
  --color-gray-600: #9ca3af;
  --color-gray-700: #d1d5db;
  --color-gray-800: #e5e7eb;
  --color-gray-900: #ffffff;
  --color-gray-950: #f8fafc;

  --color-slate-200: #1e293b;
  --color-slate-300: #334155;
  --color-slate-400: #475569;
  --color-slate-500: #64748b;
  --color-slate-600: #94a3b8;
  --color-slate-700: #cbd5e1;
  --color-slate-800: #d8e0ea;
  --color-slate-900: #f1f5f9;
  --color-slate-950: #f8fafc;

  /* pale accent text (-300/-400) is unreadable on light — darken to -700/-600 */
  --color-emerald-300: #047857;
  --color-emerald-400: #059669;
  --color-indigo-300: #4338ca;
  --color-indigo-400: #4f46e5;
  --color-red-300: #b91c1c;
  --color-red-400: #dc2626;
  --color-amber-300: #b45309;
  --color-amber-400: #d97706;
  --color-blue-300: #1d4ed8;
  --color-blue-400: #2563eb;
  --color-purple-300: #7e22ce;
  --color-purple-400: #9333ea;
  --color-rose-300: #be123c;
  --color-rose-400: #e11d48;
  --color-pink-300: #be185d;
  --color-pink-400: #db2777;
  --color-sky-300: #0369a1;
  --color-sky-400: #0284c7;
  --color-violet-300: #6d28d9;
  --color-violet-400: #7c3aed;
  --color-orange-300: #c2410c;
  --color-orange-400: #ea580c;
  --color-cyan-300: #0e7490;
  --color-cyan-400: #0891b2;
  --color-green-300: #15803d;
  --color-green-400: #16a34a;
  --color-yellow-300: #a16207;
  --color-yellow-400: #ca8a04;
  --color-teal-300: #0f766e;
  --color-teal-400: #0d9488;
}

/* Arbitrary-hex dark surfaces bypass the theme variables */
[data-theme='light'] .bg-\\[\\#080c14\\],
[data-theme='light'] .bg-\\[\\#0b1220\\],
[data-theme='light'] .bg-\\[\\#0c1018\\],
[data-theme='light'] .bg-\\[\\#0d1117\\],
[data-theme='light'] .bg-\\[\\#0f141c\\],
[data-theme='light'] .bg-\\[\\#0f172a\\],
[data-theme='light'] .bg-\\[\\#111827\\] {
  background-color: #ffffff;
}
[data-theme='light'] .bg-\\[\\#080c14\\]\\/90 {
  background-color: rgba(255, 255, 255, 0.9);
}
[data-theme='light'] .border-\\[\\#080c14\\],
[data-theme='light'] .border-\\[\\#0d1117\\] {
  border-color: #f1f5f9;
}
[data-theme='light'] .ring-\\[\\#080c14\\] {
  --tw-ring-color: #f1f5f9;
}
[data-theme='light'] .from-\\[\\#080c14\\],
[data-theme='light'] .from-\\[\\#0e1420\\],
[data-theme='light'] .from-\\[\\#0f141c\\] {
  --tw-gradient-from: #f1f5f9;
}

[data-theme='light'] .glass {
  background-color: rgba(255, 255, 255, 0.72);
  box-shadow: 0 4px 30px rgba(15, 23, 42, 0.08);
}

[data-theme='light'] .text-primary {
  color: #2563eb;
}

/* Solid accent surfaces keep their color in light mode, so text-white on
   (or inside) them must stay white instead of flipping to ink. */
[data-theme='light']
  :is(
    [class~='bg-primary'],
    [class~='bg-secondary'],
    [class~='bg-accent'],
    [class~='bg-red-500'],
    [class~='bg-red-500/80'],
    [class~='bg-red-600'],
    [class~='bg-rose-500'],
    [class~='bg-emerald-500'],
    [class~='bg-emerald-600'],
    [class~='bg-indigo-500'],
    [class~='bg-indigo-600'],
    [class~='bg-amber-500'],
    [class~='bg-blue-500'],
    [class~='bg-blue-600'],
    [class~='bg-purple-500'],
    [class~='bg-purple-600'],
    [class~='bg-violet-500'],
    [class~='bg-cyan-500'],
    [class~='from-indigo-500'],
    [class~='from-indigo-600'],
    [class~='from-blue-500'],
    [class~='from-blue-600'],
    [class~='from-cyan-500'],
    [class~='from-violet-500'],
    [class~='from-purple-500'],
    [class~='from-pink-500'],
    [class~='from-fuchsia-500'],
    [class~='from-emerald-500'],
    [class~='from-amber-500'],
    [class~='from-red-900']
  ).text-white,
[data-theme='light']
  :is(
    [class~='bg-primary'],
    [class~='bg-secondary'],
    [class~='bg-accent'],
    [class~='bg-red-500'],
    [class~='bg-red-500/80'],
    [class~='bg-red-600'],
    [class~='bg-rose-500'],
    [class~='bg-emerald-500'],
    [class~='bg-emerald-600'],
    [class~='bg-indigo-500'],
    [class~='bg-indigo-600'],
    [class~='bg-amber-500'],
    [class~='bg-blue-500'],
    [class~='bg-blue-600'],
    [class~='bg-purple-500'],
    [class~='bg-purple-600'],
    [class~='bg-violet-500'],
    [class~='bg-cyan-500'],
    [class~='from-indigo-500'],
    [class~='from-indigo-600'],
    [class~='from-blue-500'],
    [class~='from-blue-600'],
    [class~='from-cyan-500'],
    [class~='from-violet-500'],
    [class~='from-purple-500'],
    [class~='from-pink-500'],
    [class~='from-fuchsia-500'],
    [class~='from-emerald-500'],
    [class~='from-amber-500'],
    [class~='from-red-900']
  )
  .text-white {
  color: #ffffff;
}
`;
