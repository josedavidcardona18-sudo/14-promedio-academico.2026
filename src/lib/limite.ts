export interface Limite {
  maximo: number;
  ventanaMs: number;
}

interface Contador {
  cuenta: number;
  reinicio: number;
}

const contadores = new Map<string, Contador>();
const TAMANO_PARA_LIMPIAR = 1000;

/**
 * Contador de frecuencia en memoria, por clave (IP + ruta). Sirve para frenar abusos en una
 * instancia; en varias instancias de Vercel cada una cuenta aparte. Para un límite global se usa
 * el Firewall de Vercel.
 */
export function excedeLimite(
  clave: string,
  { maximo, ventanaMs }: Limite,
  ahora = Date.now(),
): { excede: boolean; reintentarEnSegundos: number } {
  if (contadores.size > TAMANO_PARA_LIMPIAR) {
    for (const [k, c] of contadores) if (c.reinicio <= ahora) contadores.delete(k);
  }
  const actual = contadores.get(clave);
  if (!actual || actual.reinicio <= ahora) {
    contadores.set(clave, { cuenta: 1, reinicio: ahora + ventanaMs });
    return { excede: false, reintentarEnSegundos: 0 };
  }
  actual.cuenta += 1;
  const espera = Math.max(1, Math.ceil((actual.reinicio - ahora) / 1000));
  return { excede: actual.cuenta > maximo, reintentarEnSegundos: espera };
}

export function reiniciarLimites(): void {
  contadores.clear();
}
