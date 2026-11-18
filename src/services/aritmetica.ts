/**
 * Aritmética en enteros. Las notas se manejan en décimas (3,5 → 35) y los porcentajes en décimas
 * de punto porcentual (33,3 % → 333), así `3,3 × 30 %` nunca pasa por coma flotante.
 */
export function aDecimas(valor: number): number {
  return Math.round(valor * 10);
}

/** División entera para enteros no negativos, sin pasar por decimales. */
export function divEntera(dividendo: number, divisor: number): number {
  return (dividendo - (dividendo % divisor)) / divisor;
}

/** Centésimas enteras → número con 2 decimales (355 → 3,55). */
export function aGrado(centesimas: number): number {
  return centesimas / 100;
}
