import { ErrorHttp, noEncontrado, peticionInvalida } from '@/lib/errores';
import type { PaginaDeSemestres, RepositorioSemestres } from '@/repositories/semestres';
import {
  LIMITES,
  type Materia,
  type MateriaEntrada,
  type SemestreConMaterias,
  type SemestreEntrada,
} from '@/schemas/semestre';
import { resumirSemestre, type ResumenSemestre } from './semestre';

const SEMESTRE_NO_ENCONTRADO = 'Semestre no encontrado.';
const MATERIA_NO_ENCONTRADA = 'Materia no encontrada.';

export const listarSemestres = (
  repositorio: RepositorioSemestres,
  uid: string,
  limite: number,
  cursor?: string,
): Promise<PaginaDeSemestres> => repositorio.listar(uid, limite, cursor);

export async function obtenerSemestre(
  repositorio: RepositorioSemestres,
  uid: string,
  id: string,
): Promise<SemestreConMaterias> {
  const semestre = await repositorio.obtener(uid, id);
  if (!semestre) throw noEncontrado(SEMESTRE_NO_ENCONTRADO);
  return semestre;
}

export async function crearSemestre(
  repositorio: RepositorioSemestres,
  uid: string,
  datos: SemestreEntrada,
): Promise<SemestreConMaterias> {
  if ((await repositorio.contar(uid)) >= LIMITES.maxSemestres) {
    throw new ErrorHttp(409, `Llegaste al máximo de ${LIMITES.maxSemestres} semestres.`);
  }
  return repositorio.crear(uid, datos);
}

export async function actualizarSemestre(
  repositorio: RepositorioSemestres,
  uid: string,
  id: string,
  datos: SemestreEntrada,
): Promise<SemestreConMaterias> {
  const semestre = await repositorio.actualizar(uid, id, datos);
  if (!semestre) throw noEncontrado(SEMESTRE_NO_ENCONTRADO);
  return semestre;
}

export async function eliminarSemestre(
  repositorio: RepositorioSemestres,
  uid: string,
  id: string,
): Promise<void> {
  if (!(await repositorio.eliminar(uid, id))) throw noEncontrado(SEMESTRE_NO_ENCONTRADO);
}

export async function obtenerMateria(
  repositorio: RepositorioSemestres,
  uid: string,
  semestreId: string,
  materiaId: string,
): Promise<Materia> {
  const semestre = await obtenerSemestre(repositorio, uid, semestreId);
  const materia = semestre.materias.find((m) => m.id === materiaId);
  if (!materia) throw noEncontrado(MATERIA_NO_ENCONTRADA);
  return materia;
}

export interface PaginaDeMaterias {
  items: Materia[];
  siguienteCursor: string | null;
}

/** Paginación por cursor sobre las materias del semestre (máximo 30): el cursor es el id de la última. */
export async function listarMaterias(
  repositorio: RepositorioSemestres,
  uid: string,
  semestreId: string,
  limite: number,
  cursor?: string,
): Promise<PaginaDeMaterias> {
  const { materias } = await obtenerSemestre(repositorio, uid, semestreId);
  const desde = cursor === undefined ? 0 : materias.findIndex((m) => m.id === cursor) + 1;
  if (cursor !== undefined && desde === 0) {
    throw peticionInvalida([{ campo: 'cursor', mensaje: 'Cursor inválido.' }]);
  }
  const items = materias.slice(desde, desde + limite);
  const ultimo = items.at(-1);
  const hayMas = desde + limite < materias.length;
  return { items, siguienteCursor: hayMas && ultimo ? ultimo.id : null };
}

export async function crearMateria(
  repositorio: RepositorioSemestres,
  uid: string,
  semestreId: string,
  datos: MateriaEntrada,
): Promise<Materia> {
  const semestre = await obtenerSemestre(repositorio, uid, semestreId);
  if (semestre.materias.length >= LIMITES.maxMateriasPorSemestre) {
    throw new ErrorHttp(409, `Llegaste al máximo de ${LIMITES.maxMateriasPorSemestre} materias.`);
  }
  const materia = await repositorio.crearMateria(uid, semestreId, datos);
  if (!materia) throw noEncontrado(SEMESTRE_NO_ENCONTRADO);
  return materia;
}

export async function actualizarMateria(
  repositorio: RepositorioSemestres,
  uid: string,
  semestreId: string,
  materiaId: string,
  datos: MateriaEntrada,
): Promise<Materia> {
  const materia = await repositorio.actualizarMateria(uid, semestreId, materiaId, datos);
  if (!materia) throw noEncontrado(MATERIA_NO_ENCONTRADA);
  return materia;
}

export async function eliminarMateria(
  repositorio: RepositorioSemestres,
  uid: string,
  semestreId: string,
  materiaId: string,
): Promise<void> {
  if (!(await repositorio.eliminarMateria(uid, semestreId, materiaId))) {
    throw noEncontrado(MATERIA_NO_ENCONTRADA);
  }
}

export async function cargarEjemplo(
  repositorio: RepositorioSemestres,
  uid: string,
): Promise<SemestreConMaterias> {
  if ((await repositorio.contar(uid)) >= LIMITES.maxSemestres) {
    throw new ErrorHttp(409, `Llegaste al máximo de ${LIMITES.maxSemestres} semestres.`);
  }
  const semestre = await repositorio.cargarEjemplo(uid);
  if (!semestre) throw new ErrorHttp(409, 'Los datos de ejemplo ya están cargados.');
  return semestre;
}

export interface ResumenDeSemestre extends ResumenSemestre {
  semestreId: string;
  nombre: string;
}

/** Los promedios se calculan aquí, en el servidor, con aritmética en enteros. */
export async function obtenerResumen(
  repositorio: RepositorioSemestres,
  uid: string,
  id: string,
  meta?: number,
): Promise<ResumenDeSemestre> {
  const semestre = await obtenerSemestre(repositorio, uid, id);
  const resumen = resumirSemestre(semestre.materias, meta ?? semestre.meta);
  return { semestreId: semestre.id, nombre: semestre.nombre, ...resumen };
}
