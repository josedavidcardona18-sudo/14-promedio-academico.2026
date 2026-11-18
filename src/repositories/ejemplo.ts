import type { SemestreConMaterias } from '@/schemas/semestre';

/**
 * Único punto de acceso a los datos. En el Hito 3 se agrega una implementación con Firestore
 * (Admin SDK) que cumple esta misma interfaz; las rutas y los servicios no cambian.
 */
export interface RepositorioSemestres {
  obtener(id: string): Promise<SemestreConMaterias | null>;
}

export const SEMESTRE_DE_EJEMPLO: SemestreConMaterias = {
  id: 'ejemplo',
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

export function crearRepositorioDeEjemplo(): RepositorioSemestres {
  return {
    async obtener(id) {
      return id === SEMESTRE_DE_EJEMPLO.id ? structuredClone(SEMESTRE_DE_EJEMPLO) : null;
    },
  };
}
