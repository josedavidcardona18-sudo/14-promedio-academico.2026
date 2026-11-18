import { requerirUsuario, type Usuario } from '@/lib/auth';
import { obtenerRepositorio } from '@/repositories';
import type { RepositorioSemestres } from '@/repositories/semestres';

/**
 * Todo Route Handler de datos privados empieza aquí: la persona sale de la sesión **verificada**
 * (jamás del cuerpo ni de la URL) y el repositorio se resuelve ya (Firestore o demostración).
 */
export async function contextoAutenticado(
  peticion: Request,
): Promise<{ usuario: Usuario; repositorio: RepositorioSemestres }> {
  const usuario = await requerirUsuario(peticion);
  return { usuario, repositorio: await obtenerRepositorio() };
}
