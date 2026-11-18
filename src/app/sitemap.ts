import type { MetadataRoute } from 'next';
import { SITE_URL } from './sitio';

export default function sitemap(): MetadataRoute.Sitemap {
  const rutas = [
    { ruta: '', prioridad: 1 },
    { ruta: '/acerca', prioridad: 0.6 },
  ];
  return rutas.map(({ ruta, prioridad }) => ({
    url: `${SITE_URL}${ruta}`,
    changeFrequency: 'monthly',
    priority: prioridad,
  }));
}
