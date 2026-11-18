import type { DecodedIdToken } from 'firebase-admin/auth';
import { modoDemo } from './config';
import { NOMBRE_COOKIE, UID_DEMO } from './constantes';
import { ErrorHttp } from './errores';
import { obtenerAuth } from './firebase-admin';

export type Rol = 'estudiante' | 'admin';

export interface Usuario {
  uid: string;
  correo: string | null;
  rol: Rol;
}

export { NOMBRE_COOKIE };
/** Entre 5 minutos y 2 semanas (límite de Firebase): unos 5 días. */
export const DURACION_SESION_MS = 5 * 24 * 60 * 60 * 1000;
export const USUARIO_DEMO: Usuario = { uid: UID_DEMO, correo: null, rol: 'estudiante' };

export function leerCookie(peticion: Request, nombre: string): string | null {
  const encabezado = peticion.headers.get('cookie') ?? '';
  for (const trozo of encabezado.split(';')) {
    const [clave, ...resto] = trozo.trim().split('=');
    if (clave === nombre) return resto.join('=') || null;
  }
  return null;
}

/** El rol viene de un *custom claim* asignado con el Admin SDK; si falta, es estudiante. */
export function aUsuario(decodificado: DecodedIdToken): Usuario {
  return {
    uid: decodificado.uid,
    correo: decodificado.email ?? null,
    rol: decodificado['rol'] === 'admin' ? 'admin' : 'estudiante',
  };
}

/**
 * Cada Route Handler que toque datos privados la llama. Acepta la cookie de sesión (navegador) o
 * `Authorization: Bearer <idToken>` (Bruno, Postman). Se verifica contra Firebase y se comprueba
 * que no esté revocada: `proxy.ts` solo redirige, **no** es la seguridad real.
 */
export async function requerirUsuario(peticion: Request): Promise<Usuario> {
  if (modoDemo()) return USUARIO_DEMO;
  const auth = obtenerAuth();
  const autorizacion = peticion.headers.get('authorization');
  const cookie = leerCookie(peticion, NOMBRE_COOKIE);
  try {
    if (autorizacion?.startsWith('Bearer ')) {
      return aUsuario(await auth.verifyIdToken(autorizacion.slice(7), true));
    }
    if (cookie) return aUsuario(await auth.verifySessionCookie(cookie, true));
  } catch {
    // Token inválido, vencido o revocado: se trata igual que no haber iniciado sesión.
  }
  throw new ErrorHttp(401, 'Necesitas iniciar sesión.');
}

/** Autorización por rol: un estudiante que intenta algo de administración recibe 403 (no 404). */
export function requerirRol(usuario: Usuario, rol: Rol): void {
  if (usuario.rol !== rol) throw new ErrorHttp(403, 'No tienes permiso para hacer esto.');
}
