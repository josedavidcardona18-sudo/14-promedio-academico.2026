type Entorno = Record<string, string | undefined>;

export interface ConfigFirebase {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/** Variables SOLO de servidor. Nunca llevan el prefijo `NEXT_PUBLIC_`. */
export function configFirebase(env: Entorno = process.env): ConfigFirebase | null {
  const projectId = env['FIREBASE_PROJECT_ID'];
  const clientEmail = env['FIREBASE_CLIENT_EMAIL'];
  const clave = env['FIREBASE_PRIVATE_KEY'];
  if (!projectId || !clientEmail || !clave) return null;
  // En Vercel la clave se guarda con `\n` literales: se convierten en saltos de línea.
  return { projectId, clientEmail, privateKey: clave.replace(/\\n/g, '\n') };
}

/**
 * Modo demostración: sin cuentas y con datos en memoria. Es **explícito** (`MODO_DEMO=1`) o, en
 * desarrollo, el que se usa cuando todavía no hay Firebase configurado. En producción, sin Firebase
 * y sin `MODO_DEMO=1`, la API se cierra: nunca queda abierta por olvido.
 */
export function modoDemo(env: Entorno = process.env): boolean {
  if (env['MODO_DEMO'] === '1') return true;
  if (env['MODO_DEMO'] === '0') return false;
  return env['NODE_ENV'] === 'development' && configFirebase(env) === null;
}
