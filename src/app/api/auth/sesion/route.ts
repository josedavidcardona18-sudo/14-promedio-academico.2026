import { leerCookie, NOMBRE_COOKIE, DURACION_SESION_MS } from '@/lib/auth';
import { modoDemo } from '@/lib/config';
import { LIMITE_SESION } from '@/lib/constantes';
import { leerCuerpo, manejar, sinContenido } from '@/lib/http';
import { cabeceraDeCookie, crearSesion, revocarSesion } from '@/lib/sesion';
import { cuerpoSesionSchema } from '@/schemas/semestre';

export const runtime = 'nodejs';

/**
 * Cambia el `idToken` de Firebase (recién emitido en el navegador) por una cookie de sesión
 * HttpOnly. Responde `204` sin cuerpo: la cookie es lo único que se entrega. En modo demostración
 * no hay cuentas: también `204`, pero sin cookie.
 */
export const POST = manejar(
  async (peticion) => {
    const respuesta = sinContenido();
    if (modoDemo()) return respuesta;
    const { idToken } = await leerCuerpo(peticion, cuerpoSesionSchema);
    const { cookie } = await crearSesion(idToken);
    respuesta.headers.append(
      'Set-Cookie',
      cabeceraDeCookie(cookie, Math.floor(DURACION_SESION_MS / 1000)),
    );
    return respuesta;
  },
  { limite: LIMITE_SESION },
);

/** Cerrar sesión: revoca los tokens y borra la cookie. Es idempotente. */
export const DELETE = manejar(
  async (peticion) => {
    await revocarSesion(leerCookie(peticion, NOMBRE_COOKIE));
    const respuesta = sinContenido();
    respuesta.headers.append('Set-Cookie', cabeceraDeCookie('', 0));
    return respuesta;
  },
  { limite: LIMITE_SESION },
);
