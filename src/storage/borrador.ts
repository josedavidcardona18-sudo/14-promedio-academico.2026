import { z } from 'zod';
import { materiaEntradaSchema, type MateriaEntrada } from '@/schemas/semestre';

const borradorSchema = z.strictObject({ version: z.literal(1), materia: materiaEntradaSchema });

export const claveDeBorrador = (semestreId: string, materiaId: string): string =>
  `promedio-academico:borrador:${semestreId}:${materiaId}`;

export function serializarBorrador(materia: MateriaEntrada): string {
  return JSON.stringify({ version: 1, materia });
}

/**
 * Lo que viene de `localStorage` no es de fiar (otra versión, edición a mano, datos corruptos):
 * se valida con el mismo esquema Zod de la API y, si no cumple, se ignora en vez de romper la página.
 */
export function leerBorrador(crudo: string | null): MateriaEntrada | null {
  if (crudo === null) return null;
  try {
    const resultado = borradorSchema.safeParse(JSON.parse(crudo));
    return resultado.success ? resultado.data.materia : null;
  } catch {
    return null;
  }
}
