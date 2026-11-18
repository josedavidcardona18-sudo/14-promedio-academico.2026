import { semestreConMateriasSchema, type SemestreConMaterias } from '@/schemas/semestre';

/** Un error de la API ya explicado para la persona (sin códigos ni detalles internos). */
export class ErrorDeApi extends Error {
  readonly estado: number | null;

  constructor(mensaje: string, estado: number | null) {
    super(mensaje);
    this.name = 'ErrorDeApi';
    this.estado = estado;
  }
}

async function pedir(ruta: string, signal: AbortSignal | undefined): Promise<Response> {
  try {
    return await fetch(ruta, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ErrorDeApi(
      'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.',
      null,
    );
  }
}

/** Pide el semestre a la API y verifica con el mismo esquema Zod que usa el servidor. */
export async function pedirSemestre(
  id: string,
  signal?: AbortSignal,
): Promise<SemestreConMaterias> {
  const respuesta = await pedir(`/api/semestres/${encodeURIComponent(id)}`, signal);
  if (!respuesta.ok) {
    throw new ErrorDeApi(
      respuesta.status === 404
        ? 'No encontramos ese semestre.'
        : 'El servidor no pudo entregar los datos. Inténtalo de nuevo.',
      respuesta.status,
    );
  }
  const formato = new ErrorDeApi(
    'Los datos recibidos no tienen el formato esperado.',
    respuesta.status,
  );
  const cuerpo = await respuesta.json().catch(() => {
    throw formato;
  });
  const resultado = semestreConMateriasSchema.safeParse(cuerpo);
  if (!resultado.success) throw formato;
  return resultado.data;
}
