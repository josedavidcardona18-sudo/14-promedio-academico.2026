import { useCallback, useEffect, useState } from 'react';
import { pedirSemestre } from '@/lib/api-cliente';
import type { SemestreConMaterias } from '@/schemas/semestre';

export type EstadoSemestre =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; semestre: SemestreConMaterias };

interface Respuesta {
  /** Identifica qué petición contestó: así «cargando» se deduce sin llamar a setState en el efecto. */
  clave: string;
  estado: Exclude<EstadoSemestre, { tipo: 'cargando' }>;
}

const MENSAJE_GENERICO = 'No se pudieron cargar los datos. Inténtalo de nuevo.';

/** Pide el semestre a la API con `fetch` y expone carga, error y reintento. */
export function useSemestre(id: string): { estado: EstadoSemestre; reintentar: () => void } {
  const [intento, setIntento] = useState(0);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const clave = `${id}#${intento}`;

  useEffect(() => {
    const control = new AbortController();
    pedirSemestre(id, control.signal).then(
      (semestre) => setRespuesta({ clave, estado: { tipo: 'listo', semestre } }),
      (error: unknown) => {
        if (control.signal.aborted) return;
        const mensaje = error instanceof Error ? error.message : MENSAJE_GENERICO;
        setRespuesta({ clave, estado: { tipo: 'error', mensaje } });
      },
    );
    return () => control.abort();
  }, [id, clave]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  const estado: EstadoSemestre =
    respuesta?.clave === clave ? respuesta.estado : { tipo: 'cargando' };
  return { estado, reintentar };
}
