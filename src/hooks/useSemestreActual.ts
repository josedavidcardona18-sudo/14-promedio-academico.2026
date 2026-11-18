import { useCallback, useMemo } from 'react';
import type { Materia, SemestreConMaterias } from '@/schemas/semestre';
import { useBorrador } from './useBorrador';
import { useSemestre } from './useSemestre';

const SIN_MATERIAS: Materia[] = [];

export interface DatosSemestre {
  /** El semestre con las materias del borrador (si hay) en lugar de las de la API. */
  semestre: SemestreConMaterias;
  hayBorrador: boolean;
  guardarMateria: (materia: Materia) => void;
  restablecer: () => void;
}

export type EstadoActual =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string; reintentar: () => void }
  | { tipo: 'vacio'; datos: DatosSemestre }
  | { tipo: 'listo'; datos: DatosSemestre };

/** Une lo que dice la API con el borrador local: las pantallas trabajan siempre sobre esto. */
export function useSemestreActual(id: string): EstadoActual {
  const { estado, reintentar } = useSemestre(id);
  const { borrador, guardar, descartar } = useBorrador(id);
  const base = estado.tipo === 'listo' ? estado.semestre : null;
  const materias = useMemo(() => borrador ?? base?.materias ?? SIN_MATERIAS, [borrador, base]);

  const semestre = useMemo(() => (base ? { ...base, materias } : null), [base, materias]);
  const guardarMateria = useCallback(
    (materia: Materia) => guardar(materias.map((m) => (m.id === materia.id ? materia : m))),
    [guardar, materias],
  );

  if (estado.tipo === 'cargando' || !semestre) {
    return estado.tipo === 'error'
      ? { tipo: 'error', mensaje: estado.mensaje, reintentar }
      : { tipo: 'cargando' };
  }
  const datos: DatosSemestre = {
    semestre,
    hayBorrador: borrador !== null,
    guardarMateria,
    restablecer: descartar,
  };
  return semestre.materias.length === 0 ? { tipo: 'vacio', datos } : { tipo: 'listo', datos };
}
