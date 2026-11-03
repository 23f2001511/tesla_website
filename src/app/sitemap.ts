import type { MetadataRoute } from 'next';
import { PUBLIC_ROUTES, SITE_URL } from '@/lib/site';

// Auth-gated dashboards never need crawlers; only the public site is listed.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route === '/' ? '' : route}`,
    lastModified,
    changeFrequency: route === '/' || route === '/events' || route === '/blogs' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : route === '/blogs' || route === '/events' ? 0.8 : 0.5,
  }));
}
