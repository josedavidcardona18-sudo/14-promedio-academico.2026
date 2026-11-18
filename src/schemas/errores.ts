import type { ZodError } from 'zod';

/** Un mensaje por campo, indexado por su ruta: `notas.0.valor`, `notas` (la suma), `nombre`… */
export function erroresPorCampo(error: ZodError | undefined): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const problema of error?.issues ?? []) {
    const ruta = problema.path.join('.');
    errores[ruta] ??= problema.message;
  }
  return errores;
}
