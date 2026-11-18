import { z } from 'zod';
import { materiaSchema, LIMITES, type Materia } from '@/schemas/semestre';

const borradorSchema = z.strictObject({
  version: z.literal(1),
  materias: z.array(materiaSchema).max(LIMITES.maxMateriasPorSemestre),
});

export const claveDeBorrador = (semestreId: string): string =>
  `promedio-academico:borrador:${semestreId}`;

export function serializarBorrador(materias: readonly Materia[]): string {
  return JSON.stringify({ version: 1, materias });
}

/**
 * Lo que viene de `localStorage` no es de fiar (otra versión, edición a mano, datos corruptos):
 * se valida con el mismo esquema Zod de la API y, si no cumple, se ignora en vez de romper la página.
 */
export function leerBorrador(crudo: string | null): Materia[] | null {
  if (crudo === null) return null;
  try {
    const resultado = borradorSchema.safeParse(JSON.parse(crudo));
    return resultado.success ? resultado.data.materias : null;
  } catch {
    return null;
  }
}
