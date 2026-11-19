import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /name-entry stays crawlable so crawlers can see its noindex tag
      disallow: ['/game/', '/lobbies/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
