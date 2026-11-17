export type NumeroLeido =
  { tipo: 'vacio' } | { tipo: 'numero'; valor: number } | { tipo: 'invalido' };

/** Un número simple con coma o punto decimal. Sin separador de miles ni notación científica. */
const NUMERO_SIMPLE = /^-?(\d+([.,]\d*)?|[.,]\d+)$/;

/** Absorbe el ruido de la coma flotante (p. ej. 4,000000000000001) al redondear. */
const AJUSTE = 1e-9;

const FORMATO = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
  useGrouping: false,
});

export function leerNumero(texto: string): NumeroLeido {
  const limpio = texto.trim();
  if (limpio === '') return { tipo: 'vacio' };
  if (!NUMERO_SIMPLE.test(limpio)) return { tipo: 'invalido' };
  return { tipo: 'numero', valor: Number(limpio.replace(',', '.')) };
}

/** Texto para un campo de entrada: coma decimal y vacío si no hay valor. */
export function aTexto(valor: number | null): string {
  return valor === null ? '' : String(valor).replace('.', ',');
}

/** Texto para mostrar: de 1 a 2 decimales, en español de Colombia. */
export function formatear(valor: number): string {
  return FORMATO.format(valor);
}

/** Redondea a `decimales` con la mitad hacia arriba (2,675 → 2,68). */
export function redondear(valor: number, decimales = 2): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor + AJUSTE) / factor;
}

/** Redondea hacia arriba, pero ignora el ruido de coma flotante (4,000000000000001 → 4). */
export function redondearArriba(valor: number, decimales = 2): number {
  const factor = 10 ** decimales;
  return Math.ceil(valor * factor - AJUSTE) / factor + 0;
}
