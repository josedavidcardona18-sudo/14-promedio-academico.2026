'use client';

import type { ReactNode } from 'react';
import { useSemestres, type AccionesSemestres } from '@/hooks/useSemestres';
import type { SemestreConMaterias } from '@/schemas/semestre';
import { Esqueleto, MensajeDeError } from './EstadosDeDatos';
import { SesionVencida } from './SesionVencida';

export interface DatosCuenta {
  semestres: SemestreConMaterias[];
  acciones: AccionesSemestres;
}

/**
 * Contenedor de datos: pide los semestres de la cuenta y resuelve la carga, el error con reintento
 * y la sesión vencida. Las pantallas solo se ocupan de mostrar lo que llega.
 */
export function ConSemestres({ children }: { children: (datos: DatosCuenta) => ReactNode }) {
  const { estado, reintentar, acciones } = useSemestres();
  switch (estado.tipo) {
    case 'cargando':
      return <Esqueleto />;
    case 'error':
      return estado.sesionVencida ? (
        <SesionVencida />
      ) : (
        <MensajeDeError mensaje={estado.mensaje} onReintentar={reintentar} />
      );
    case 'listo':
      return <>{children({ semestres: estado.semestres, acciones })}</>;
  }
}
