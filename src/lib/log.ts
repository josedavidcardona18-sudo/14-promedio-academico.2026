/**
 * Registro en una línea JSON por evento. Solo se anotan datos operativos (identificador de la
 * petición, método, ruta, estado, duración): nunca contraseñas, tokens ni datos personales.
 */
export function registrar(evento: Record<string, string | number>): void {
  if (process.env.NODE_ENV === 'test') return;
  process.stdout.write(`${JSON.stringify({ momento: new Date().toISOString(), ...evento })}\n`);
}
