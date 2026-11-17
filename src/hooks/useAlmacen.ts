import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { reducir, type Accion } from '@/domain/reducer';
import type { Estado } from '@/domain/tipos';
import { escribir, leer, suscribir } from '@/storage/almacen';
import { deserializar, serializar } from '@/storage/serializar';

const sinSuscripcion = () => () => undefined;

/** `false` en el servidor y en el primer pintado; `true` cuando ya podemos leer el navegador. */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false,
  );
}

export function useAlmacen(): { estado: Estado; despachar: (accion: Accion) => void } {
  const crudo = useSyncExternalStore(suscribir, leer, () => null);
  const estado = useMemo(() => deserializar(crudo), [crudo]);
  // Siempre parte de lo último guardado, no de una copia vieja capturada por el cierre.
  const despachar = useCallback((accion: Accion) => {
    escribir(serializar(reducir(deserializar(leer()), accion)));
  }, []);
  return { estado, despachar };
}
