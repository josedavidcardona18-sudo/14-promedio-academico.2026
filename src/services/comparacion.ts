/**
 * Diferencia entre dos promedios en centésimas (enteros: sin ruido de coma flotante). Positiva si
 * `nuevo` es mayor. `null` si alguno de los dos semestres todavía no tiene notas.
 */
export function diferenciaDePromedios(
  nuevo: number | null,
  anterior: number | null,
): number | null {
  if (nuevo === null || anterior === null) return null;
  return Math.round(nuevo * 100) - Math.round(anterior * 100);
}

export type Tendencia = 'sube' | 'baja' | 'igual';

export const tendenciaDe = (centesimas: number): Tendencia =>
  centesimas > 0 ? 'sube' : centesimas < 0 ? 'baja' : 'igual';
