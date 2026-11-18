import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { Materia } from '@/schemas/semestre';
import { borrar, escribir, leer, suscribir } from '@/storage/almacen';
import { claveDeBorrador, leerBorrador, serializarBorrador } from '@/storage/borrador';

/**
 * Borrador de las materias de un semestre en `localStorage`, mientras no hay sesión.
 * `useSyncExternalStore`: el HTML del servidor no depende del navegador y se sincroniza entre pestañas.
 */
export function useBorrador(semestreId: string) {
  const clave = claveDeBorrador(semestreId);
  const crudo = useSyncExternalStore(
    suscribir,
    () => leer(clave),
    () => null,
  );
  const borrador = useMemo(() => leerBorrador(crudo), [crudo]);
  const guardar = useCallback(
    (materias: readonly Materia[]) => escribir(clave, serializarBorrador(materias)),
    [clave],
  );
  const descartar = useCallback(() => borrar(clave), [clave]);
  return { borrador, guardar, descartar };
}
