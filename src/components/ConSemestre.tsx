'use client';

import type { ReactNode } from 'react';
import { useSemestreActual, type DatosSemestre } from '@/hooks/useSemestreActual';
import { Esqueleto, MensajeDeError, MensajeVacio } from './EstadosDeDatos';

interface Props {
  id: string;
  children: (datos: DatosSemestre) => ReactNode;
}

/**
 * Contenedor de datos: pide el semestre y resuelve los cuatro estados de la interfaz (carga,
 * error con reintento, vacío y listo). Las pantallas solo se ocupan de mostrar lo que llega.
 */
export function ConSemestre({ id, children }: Props) {
  const estado = useSemestreActual(id);
  switch (estado.tipo) {
    case 'cargando':
      return <Esqueleto />;
    case 'error':
      return <MensajeDeError mensaje={estado.mensaje} onReintentar={estado.reintentar} />;
    case 'vacio':
      return (
        <MensajeVacio
          onRestablecer={estado.datos.hayBorrador ? estado.datos.restablecer : undefined}
        />
      );
    case 'listo':
      return <>{children(estado.datos)}</>;
  }
}
