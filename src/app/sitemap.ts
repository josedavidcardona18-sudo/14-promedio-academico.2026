import type { MetadataRoute } from 'next';
import { SITE_URL } from './sitio';

/**
 * Solo lo público: `/login`. Las demás páginas son privadas (sin sesión, `proxy.ts` redirige a
 * `/login`), así que listarlas apuntaría a una redirección.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/login`, changeFrequency: 'yearly', priority: 1 }];
}
