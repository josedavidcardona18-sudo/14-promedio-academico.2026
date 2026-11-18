import { noEncontrado } from '@/lib/errores';
import type { RepositorioSemestres } from '@/repositories/semestres';
import type { SemestreConMaterias } from '@/schemas/semestre';
import { resumirSemestre, type ResumenSemestre } from './semestre';

export async function obtenerSemestre(
  repositorio: RepositorioSemestres,
  id: string,
): Promise<SemestreConMaterias> {
  const semestre = await repositorio.obtener(id);
  if (!semestre) throw noEncontrado('Semestre no encontrado.');
  return semestre;
}

export interface ResumenDeSemestre extends ResumenSemestre {
  semestreId: string;
  nombre: string;
}

/** Los promedios se calculan aquí, en el servidor, con aritmética en enteros. */
export async function obtenerResumen(
  repositorio: RepositorioSemestres,
  id: string,
  meta?: number,
): Promise<ResumenDeSemestre> {
  const semestre = await obtenerSemestre(repositorio, id);
  const resumen = resumirSemestre(semestre.materias, meta ?? semestre.meta);
  return { semestreId: semestre.id, nombre: semestre.nombre, ...resumen };
}
