/**
 * Único módulo que toca `localStorage` (API del navegador del documento, sección 5: «guardar un
 * borrador mientras no hay sesión»). Si el navegador lo bloquea, guarda en memoria durante la sesión.
 */
const oyentes = new Set<() => void>();
const enMemoria = new Map<string, string>();
let sinAlmacenamiento = false;

function avisar(): void {
  for (const oyente of oyentes) oyente();
}

export function leer(clave: string): string | null {
  if (sinAlmacenamiento) return enMemoria.get(clave) ?? null;
  try {
    return window.localStorage.getItem(clave);
  } catch {
    sinAlmacenamiento = true;
    return enMemoria.get(clave) ?? null;
  }
}

export function escribir(clave: string, valor: string): void {
  try {
    if (!sinAlmacenamiento) window.localStorage.setItem(clave, valor);
  } catch {
    sinAlmacenamiento = true;
  }
  if (sinAlmacenamiento) enMemoria.set(clave, valor);
  avisar();
}

export function borrar(clave: string): void {
  try {
    if (!sinAlmacenamiento) window.localStorage.removeItem(clave);
  } catch {
    sinAlmacenamiento = true;
  }
  enMemoria.delete(clave);
  avisar();
}

function alCambiarEnOtraPestana(): void {
  avisar();
}

/** Para `useSyncExternalStore`: avisa también cuando otra pestaña modifica los datos. */
export function suscribir(oyente: () => void): () => void {
  if (oyentes.size === 0) window.addEventListener('storage', alCambiarEnOtraPestana);
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
    if (oyentes.size === 0) window.removeEventListener('storage', alCambiarEnOtraPestana);
  };
}
