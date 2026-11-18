import { requerirUsuario } from '@/lib/auth';
import { modoDemo } from '@/lib/config';
import { json, manejar } from '@/lib/http';

export const runtime = 'nodejs';

/** Quién soy según la sesión verificada. La interfaz lo usa para saludar y saber si es modo demostración. */
export const GET = manejar(async (peticion) => {
  const usuario = await requerirUsuario(peticion);
  return json({ ...usuario, demo: modoDemo() });
});
