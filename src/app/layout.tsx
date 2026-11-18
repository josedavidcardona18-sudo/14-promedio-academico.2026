import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Encabezado } from '@/components/Encabezado';
import { PieDePagina } from '@/components/PieDePagina';
import { DESCRIPCION, NOMBRE_SITIO, SITE_URL, TITULO_INICIO } from './sitio';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITULO_INICIO, template: `%s · ${NOMBRE_SITIO}` },
  description: DESCRIPCION,
  applicationName: NOMBRE_SITIO,
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: NOMBRE_SITIO,
    title: TITULO_INICIO,
    description: DESCRIPCION,
  },
  twitter: { card: 'summary_large_image', title: TITULO_INICIO, description: DESCRIPCION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f6f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1218' },
  ],
};

const datosEstructurados = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Calculadora de promedio académico',
  description: DESCRIPCION,
  url: SITE_URL,
  inLanguage: 'es',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Cualquiera con navegador web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'COP' },
};

export default function RaizLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a className="saltar" href="#contenido">
          Saltar al contenido
        </a>
        <Encabezado />
        <main id="contenido" tabIndex={-1}>
          {children}
        </main>
        <PieDePagina />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(datosEstructurados).replace(/</g, '\\u003c'),
          }}
        />
      </body>
    </html>
  );
}
