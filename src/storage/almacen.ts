/** Único módulo que toca `localStorage`. Si el navegador lo bloquea, guarda en memoria. */
const CLAVE = 'promedio-academico:v1';

const oyentes = new Set<() => void>();
let sinAlmacenamiento = false;
let respaldo: string | null = null;

function avisar(): void {
  for (const oyente of oyentes) oyente();
}

export function leer(): string | null {
  if (sinAlmacenamiento) return respaldo;
  try {
    return window.localStorage.getItem(CLAVE);
  } catch {
    sinAlmacenamiento = true;
    return respaldo;
  }
}

export function escribir(valor: string): void {
  try {
    if (!sinAlmacenamiento) window.localStorage.setItem(CLAVE, valor);
  } catch {
    sinAlmacenamiento = true;
  }
  if (sinAlmacenamiento) respaldo = valor;
  avisar();
}

function alCambiarEnOtraPestana(evento: StorageEvent): void {
  if (evento.key === CLAVE || evento.key === null) avisar();
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
