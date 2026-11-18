import { requerirUsuario } from '@/lib/auth';
import { modoDemo } from '@/lib/config';
import { json, manejar } from '@/lib/http';

export const runtime = 'nodejs';

/**
 * Quién soy según la sesión verificada: `{ usuario: { uid, correo, rol } }` o `401`. `demo` avisa a
 * la interfaz de que no hay cuentas reales (modo demostración).
 */
export const GET = manejar(async (peticion) => {
  const usuario = await requerirUsuario(peticion);
  return json({ usuario, demo: modoDemo() });
});
