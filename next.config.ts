import type { NextConfig } from 'next';

const esProduccion = process.env.NODE_ENV === 'production';

// Next inserta scripts y estilos en línea para hidratar: por eso 'unsafe-inline'. En desarrollo el CSP
// se omite porque React necesita eval para las herramientas de depuración.
const politicaDeContenido = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  // Firebase Auth (correo y contraseña) solo necesita hablar con estos dos servicios de Google.
  "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const cabeceras = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  ...(esProduccion ? [{ key: 'Content-Security-Policy', value: politicaDeContenido }] : []),
];

const configuracion: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: cabeceras }];
  },
};

export default configuracion;
