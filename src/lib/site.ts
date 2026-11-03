/**
 * Canonical site URL, used for absolute links in metadata, robots.txt and the
 * sitemap. Set NEXT_PUBLIC_SITE_URL in the deployment environment (no trailing
 * slash needed — it is normalised away here).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/+$/,
  ''
);

export const SITE_NAME = 'TESLA Technical Club';

export const SITE_DESCRIPTION =
  'TESLA Technical Club — engineers, coders, designers, and builders shipping real-world work on campus.';

/** Public (indexable) routes — kept in sync with src/app/robots.ts. */
export const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/events',
  '/team',
  '/blogs',
  '/resources',
  '/alumni',
  '/gallery',
  '/achievements',
  '/contact',
];
