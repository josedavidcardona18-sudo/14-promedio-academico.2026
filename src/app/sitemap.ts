import type { MetadataRoute } from 'next';
import { SITE_URL } from './sitio';

export default function sitemap(): MetadataRoute.Sitemap {
  const rutas = [
    { ruta: '', prioridad: 1 },
    { ruta: '/simulador', prioridad: 0.8 },
  ];
  return rutas.map(({ ruta, prioridad }) => ({
    url: `${SITE_URL}${ruta}`,
    changeFrequency: 'monthly',
    priority: prioridad,
  }));
}
