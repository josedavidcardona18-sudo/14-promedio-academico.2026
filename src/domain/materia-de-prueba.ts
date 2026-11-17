import type { Config, Materia } from './tipos';

export const CONFIG: Config = { notaMaxima: 5, notaMinima: 3 };

/** Construye una materia de 3 cortes (30/30/40) a partir de sus notas, para las pruebas. */
export function materiaDe(
  notas: (number | null)[],
  pesos: number[] = [30, 30, 40],
  resto: Partial<Materia> = {},
): Materia {
  return {
    id: 'm1',
    nombre: 'Cálculo',
    creditos: 3,
    cortes: notas.map((nota, i) => ({ id: `c${i + 1}`, peso: pesos[i] ?? 0, nota })),
    ...resto,
  };
}
