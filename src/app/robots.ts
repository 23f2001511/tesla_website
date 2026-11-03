import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Dashboards, admin tools and APIs are private — keep them out of search.
      disallow: ['/dashboard', '/dashboard/', '/admin', '/admin/', '/api/', '/set-password'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
