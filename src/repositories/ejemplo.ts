import { UID_DEMO } from '@/lib/constantes';
import type { SemestreConMaterias } from '@/schemas/semestre';
import type { AlmacenDocumentos } from './almacen';

export { UID_DEMO };

const BASE = Date.parse('2026-08-01T00:00:00.000Z');
const fecha = (segundos: number) => new Date(BASE + segundos * 1000).toISOString();

export const SEMESTRE_DE_EJEMPLO: SemestreConMaterias = {
  id: 'ejemplo',
  creadoEn: fecha(0),
  nombre: '2026-2 (datos de ejemplo)',
  meta: 3,
  materias: [
    {
      id: 'calculo-diferencial',
      nombre: 'Cálculo diferencial',
      creditos: 4,
      notas: [
        { nombre: 'Primer corte', valor: 3.5, porcentaje: 30 },
        { nombre: 'Segundo corte', valor: 2.8, porcentaje: 30 },
        { nombre: 'Tercer corte', valor: null, porcentaje: 40 },
      ],
    },
    {
      id: 'programacion-web',
      nombre: 'Programación web',
      creditos: 3,
      notas: [
        { nombre: 'Taller', valor: 4.5, porcentaje: 30 },
        { nombre: 'Proyecto', valor: 4.2, porcentaje: 30 },
        { nombre: 'Sustentación', valor: null, porcentaje: 40 },
      ],
    },
    {
      id: 'algebra-lineal',
      nombre: 'Álgebra lineal',
      creditos: 3,
      notas: [
        { nombre: 'Parcial 1', valor: 2, porcentaje: 30 },
        { nombre: 'Parcial 2', valor: 2.4, porcentaje: 30 },
        { nombre: 'Examen final', valor: null, porcentaje: 40 },
      ],
    },
    {
      id: 'ingles-ii',
      nombre: 'Inglés II',
      creditos: 2,
      notas: [
        { nombre: 'Quices', valor: 4, porcentaje: 30 },
        { nombre: 'Oral', valor: 3.8, porcentaje: 30 },
        { nombre: 'Final', valor: 4.4, porcentaje: 40 },
      ],
    },
  ],
};

/** Escribe el semestre de ejemplo (con ids fijos) en la carpeta de un usuario. */
export async function sembrarEjemplo(almacen: AlmacenDocumentos, uid: string): Promise<void> {
  const base = `usuarios/${uid}/semestres/${SEMESTRE_DE_EJEMPLO.id}`;
  await almacen.reemplazar(base, {
    nombre: SEMESTRE_DE_EJEMPLO.nombre,
    meta: SEMESTRE_DE_EJEMPLO.meta,
    creadoEn: SEMESTRE_DE_EJEMPLO.creadoEn,
  });
  for (const [posicion, materia] of SEMESTRE_DE_EJEMPLO.materias.entries()) {
    await almacen.reemplazar(`${base}/materias/${materia.id}`, {
      nombre: materia.nombre,
      creditos: materia.creditos,
      notas: materia.notas,
      creadoEn: fecha(posicion + 1),
    });
  }
}
