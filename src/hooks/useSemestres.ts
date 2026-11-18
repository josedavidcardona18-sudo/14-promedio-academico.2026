import { useCallback, useEffect, useMemo, useState } from 'react';
import * as api from '@/lib/api-cliente';
import { ErrorDeApi } from '@/lib/api-cliente';
import type { SemestreConMaterias } from '@/schemas/semestre';

export type EstadoSemestres =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string; sesionVencida: boolean }
  | { tipo: 'listo'; semestres: SemestreConMaterias[] };

const MENSAJE_GENERICO = 'No se pudieron cargar los datos. Inténtalo de nuevo.';

function comoError(error: unknown): EstadoSemestres {
  return {
    tipo: 'error',
    mensaje: error instanceof Error ? error.message : MENSAJE_GENERICO,
    sesionVencida: error instanceof ErrorDeApi && error.estado === 401,
  };
}

/** Todo lo que se puede hacer con los datos de la cuenta; cada acción refresca la lista al terminar. */
export interface AccionesSemestres {
  crearSemestre: (datos: { nombre: string; meta: number }) => Promise<SemestreConMaterias>;
  actualizarSemestre: (id: string, datos: { nombre: string; meta: number }) => Promise<void>;
  eliminarSemestre: (id: string) => Promise<void>;
  crearMateria: (
    semestreId: string,
    datos: { nombre: string; creditos: number },
  ) => Promise<{ id: string }>;
  actualizarMateria: (
    semestreId: string,
    materia: Parameters<typeof api.actualizarMateria>[1],
  ) => Promise<void>;
  eliminarMateria: (semestreId: string, materiaId: string) => Promise<void>;
  cargarEjemplo: () => Promise<SemestreConMaterias>;
}

/** Pide los semestres a la API con `fetch` y expone carga, error, reintento y las acciones de escritura. */
export function useSemestres() {
  const [estado, setEstado] = useState<EstadoSemestres>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const control = new AbortController();
    api.listarSemestres(control.signal).then(
      (semestres) => setEstado({ tipo: 'listo', semestres }),
      (error: unknown) => {
        if (!control.signal.aborted) setEstado(comoError(error));
      },
    );
    return () => control.abort();
  }, [intento]);

  const reintentar = useCallback(() => {
    setEstado({ tipo: 'cargando' });
    setIntento((n) => n + 1);
  }, []);

  /** Ejecuta la escritura y vuelve a pedir la lista sin pasar por «cargando» (no parpadea). */
  const acciones = useMemo<AccionesSemestres>(() => {
    const refrescar = () =>
      api.listarSemestres().then(
        (semestres) => setEstado({ tipo: 'listo', semestres }),
        (error: unknown) => setEstado(comoError(error)),
      );
    const tras = async <T>(escritura: Promise<T>): Promise<T> => {
      const resultado = await escritura;
      await refrescar();
      return resultado;
    };
    return {
      crearSemestre: (datos) => tras(api.crearSemestre(datos)),
      actualizarSemestre: async (id, datos) => void (await tras(api.actualizarSemestre(id, datos))),
      eliminarSemestre: (id) => tras(api.eliminarSemestre(id)),
      crearMateria: (semestreId, datos) => tras(api.crearMateria(semestreId, datos)),
      actualizarMateria: async (semestreId, materia) =>
        void (await tras(api.actualizarMateria(semestreId, materia))),
      eliminarMateria: (semestreId, materiaId) => tras(api.eliminarMateria(semestreId, materiaId)),
      cargarEjemplo: () => tras(api.cargarEjemplo()),
    };
  }, []);

  return { estado, reintentar, acciones };
}
