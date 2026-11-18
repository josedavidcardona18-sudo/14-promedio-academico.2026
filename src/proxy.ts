import { NextResponse, type NextRequest } from 'next/server';
import { modoDemo } from '@/lib/config';
import { NOMBRE_COOKIE } from '@/lib/constantes';

/**
 * Comodidad, **no** seguridad: si una página privada se pide sin cookie de sesión, lleva a /login.
 * La seguridad real está en cada Route Handler (`requerirUsuario`), que verifica la cookie con
 * Firebase en cada petición: una cookie falsa pasaría por aquí pero no por la API.
 */
export function proxy(peticion: NextRequest): NextResponse {
  if (modoDemo() || peticion.cookies.has(NOMBRE_COOKIE)) return NextResponse.next();
  const destino = new URL('/login', peticion.url);
  destino.searchParams.set('siguiente', peticion.nextUrl.pathname + peticion.nextUrl.search);
  return NextResponse.redirect(destino);
}

export const config = {
  // Páginas privadas. Quedan fuera la API (responde 401 por sí misma), /login y los archivos públicos.
  matcher: ['/((?!api|login|_next|icon\\.svg|robots\\.txt|sitemap\\.xml|opengraph-image).*)'],
};
