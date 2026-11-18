import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { MateriaEntrada } from '@/schemas/semestre';
import { borrar, escribir, leer, suscribir } from '@/storage/almacen';
import { claveDeBorrador, leerBorrador, serializarBorrador } from '@/storage/borrador';

/**
 * Borrador de una materia en `localStorage`: lo que se escribió y todavía no se guardó en la cuenta.
 * `useSyncExternalStore`: el HTML del servidor no depende del navegador y se sincroniza entre pestañas.
 */
export function useBorrador(semestreId: string, materiaId: string) {
  const clave = claveDeBorrador(semestreId, materiaId);
  const crudo = useSyncExternalStore(
    suscribir,
    () => leer(clave),
    () => null,
  );
  const borrador = useMemo(() => leerBorrador(crudo), [crudo]);
  const guardar = useCallback(
    (materia: MateriaEntrada) => escribir(clave, serializarBorrador(materia)),
    [clave],
  );
  const descartar = useCallback(() => borrar(clave), [clave]);
  return { borrador, guardar, descartar };
}
