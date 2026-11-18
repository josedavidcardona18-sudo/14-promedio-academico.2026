import type { MetadataRoute } from 'next';
import { SITE_URL } from './sitio';

export default function robots(): MetadataRoute.Robots {
  return {
    // La API es privada (responde 401 sin sesión): no hay nada que rastrear en ella.
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
