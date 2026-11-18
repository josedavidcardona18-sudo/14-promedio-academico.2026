const NOTA = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
  useGrouping: false,
});

const PORCENTAJE = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1, useGrouping: false });

/** 3,5 → «3,5» · 3,55 → «3,55» · 4 → «4,0» (coma decimal, de 1 a 2 decimales). */
export function formatearNota(valor: number): string {
  return NOTA.format(valor);
}

/** 40 → «40 %» · 33,3 → «33,3 %». */
export function formatearPorcentaje(valor: number): string {
  return `${PORCENTAJE.format(valor)} %`;
}
