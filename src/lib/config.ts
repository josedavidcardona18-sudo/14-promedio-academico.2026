type Entorno = Record<string, string | undefined>;

export interface ConfigFirebase {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/** Quita las comillas que se copian sin querer del archivo `.env` al pegar el valor en Vercel. */
function sinComillas(valor: string): string {
  const recortado = valor.trim();
  const comillas = ['"', "'"];
  const [primero, ultimo] = [recortado.at(0), recortado.at(-1)];
  const envuelto = primero !== undefined && primero === ultimo && comillas.includes(primero);
  return envuelto && recortado.length > 1 ? recortado.slice(1, -1) : recortado;
}

/** Variables SOLO de servidor. Nunca llevan el prefijo `NEXT_PUBLIC_`. */
export function configFirebase(env: Entorno = process.env): ConfigFirebase | null {
  const projectId = env['FIREBASE_PROJECT_ID']?.trim();
  const clientEmail = env['FIREBASE_CLIENT_EMAIL']?.trim();
  const clave = env['FIREBASE_PRIVATE_KEY'];
  if (!projectId || !clientEmail || !clave?.trim()) return null;
  // En Vercel la clave suele guardarse con `\n` literales: se convierten en saltos de línea.
  const privateKey = `${sinComillas(clave).replace(/\\n/g, '\n').trim()}\n`;
  return { projectId, clientEmail, privateKey };
}

/**
 * Modo demostración: sin cuentas y con datos en memoria. Es **explícito** (`MODO_DEMO=1`) o, en
 * desarrollo, el que se usa cuando todavía no hay Firebase configurado.
 *
 * Dos cierres para que nunca quede abierta una API con datos reales:
 * - En producción, sin Firebase y sin `MODO_DEMO=1`, la API se cierra.
 * - En producción, **con** credenciales de Firebase, `MODO_DEMO=1` se ignora (un valor olvidado en
 *   Vercel no puede saltarse el inicio de sesión).
 */
export function modoDemo(env: Entorno = process.env): boolean {
  const hayFirebase = configFirebase(env) !== null;
  if (env['NODE_ENV'] === 'production' && hayFirebase) return false;
  if (env['MODO_DEMO'] === '1') return true;
  if (env['MODO_DEMO'] === '0') return false;
  return env['NODE_ENV'] === 'development' && !hayFirebase;
}
