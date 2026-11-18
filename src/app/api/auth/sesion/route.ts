import { leerCookie, NOMBRE_COOKIE, DURACION_SESION_MS, USUARIO_DEMO } from '@/lib/auth';
import { modoDemo } from '@/lib/config';
import { LIMITE_SESION } from '@/lib/constantes';
import { json, leerCuerpo, manejar, sinContenido } from '@/lib/http';
import { cabeceraDeCookie, crearSesion, revocarSesion } from '@/lib/sesion';
import { cuerpoSesionSchema } from '@/schemas/semestre';

export const runtime = 'nodejs';

/** Cambia el `idToken` de Firebase (recién emitido en el navegador) por una cookie de sesión HttpOnly. */
export const POST = manejar(
  async (peticion) => {
    if (modoDemo()) return json({ ...USUARIO_DEMO, demo: true });
    const { idToken } = await leerCuerpo(peticion, cuerpoSesionSchema);
    const { cookie, usuario } = await crearSesion(idToken);
    const respuesta = json(usuario, { status: 201 });
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
