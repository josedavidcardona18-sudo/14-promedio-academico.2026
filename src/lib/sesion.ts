import { aUsuario, DURACION_SESION_MS, NOMBRE_COOKIE, type Usuario } from './auth';
import { ErrorHttp } from './errores';
import { obtenerAuth } from './firebase-admin';

/** Firebase recomienda cambiar un token por cookie solo si la persona acaba de iniciar sesión. */
const FRESCURA_MAXIMA_S = 5 * 60;

export interface SesionCreada {
  cookie: string;
  usuario: Usuario;
}

export async function crearSesion(idToken: string, ahoraMs = Date.now()): Promise<SesionCreada> {
  const auth = obtenerAuth();
  let decodificado;
  try {
    decodificado = await auth.verifyIdToken(idToken, true);
  } catch {
    throw new ErrorHttp(401, 'No pudimos verificar tu inicio de sesión. Inténtalo de nuevo.');
  }
  if (ahoraMs / 1000 - decodificado.auth_time > FRESCURA_MAXIMA_S) {
    throw new ErrorHttp(401, 'Tu inicio de sesión es muy antiguo. Vuelve a ingresar.');
  }
  const cookie = await auth.createSessionCookie(idToken, { expiresIn: DURACION_SESION_MS });
  return { cookie, usuario: aUsuario(decodificado) };
}

/** Revoca los tokens de la persona (cierra la sesión en todos sus dispositivos). Nunca falla hacia afuera. */
export async function revocarSesion(cookie: string | null): Promise<void> {
  if (!cookie) return;
  try {
    const auth = obtenerAuth();
    const decodificado = await auth.verifySessionCookie(cookie);
    await auth.revokeRefreshTokens(decodificado.uid);
  } catch {
    // Una cookie inválida o vencida ya no sirve: basta con borrarla en el navegador.
  }
}

/**
 * `HttpOnly` (JavaScript no la lee), `Secure` en producción (solo HTTPS) y `SameSite=Lax` (no viaja
 * en peticiones POST de otros sitios). `maxAgeS = 0` la borra.
 */
export function cabeceraDeCookie(
  valor: string,
  maxAgeS: number,
  seguro = process.env.NODE_ENV === 'production',
): string {
  const partes = [
    `${NOMBRE_COOKIE}=${valor}`,
    'Path=/',
    `Max-Age=${maxAgeS}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (seguro) partes.push('Secure');
  return partes.join('; ');
}
