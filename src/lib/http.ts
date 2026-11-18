import { ZodError, type ZodType } from 'zod';
import { detallesDeZod, ErrorHttp, peticionInvalida } from './errores';
import { registrar } from './log';

type Manejador<Contexto> = (peticion: Request, contexto: Contexto) => Promise<Response>;

interface Opciones {
  /** Lectura pública: se puede cachear. Lo privado nunca (`no-store`). */
  publica?: boolean;
}

export function json(datos: unknown, init?: ResponseInit): Response {
  return Response.json(datos, init);
}

/** Valida con Zod y, si falla, lanza un 400 con el detalle por campo. */
export function leer<T>(esquema: ZodType<T>, valor: unknown, campo: string): T {
  const resultado = esquema.safeParse(valor);
  if (resultado.success) return resultado.data;
  throw peticionInvalida(detallesDeZod(resultado.error, campo));
}

function respuestaDeError(error: unknown): Response {
  if (error instanceof ZodError) {
    return json(
      { error: 'Datos inválidos.', detalles: detallesDeZod(error, 'cuerpo') },
      { status: 400 },
    );
  }
  if (error instanceof ErrorHttp) {
    const cuerpo = error.detalles
      ? { error: error.message, detalles: error.detalles }
      : { error: error.message };
    return json(cuerpo, { status: error.status });
  }
  // Un error inesperado nunca revela su mensaje, su pila ni sus rutas.
  return json({ error: 'Error interno.' }, { status: 500 });
}

/** Envoltorio común: errores consistentes, cabeceras de caché, identificador y registro por petición. */
export function manejar<Contexto>(
  manejador: Manejador<Contexto>,
  { publica = false }: Opciones = {},
): Manejador<Contexto> {
  return async (peticion, contexto) => {
    const id = crypto.randomUUID();
    const inicio = performance.now();
    let respuesta: Response;
    try {
      respuesta = await manejador(peticion, contexto);
    } catch (error) {
      respuesta = respuestaDeError(error);
      if (respuesta.status >= 500) {
        registrar({
          nivel: 'error',
          id,
          error: error instanceof Error ? error.name : 'desconocido',
        });
      }
    }
    respuesta.headers.set(
      'Cache-Control',
      publica && respuesta.status < 400
        ? 'public, s-maxage=60, stale-while-revalidate=300'
        : 'no-store',
    );
    respuesta.headers.set('X-Request-Id', id);
    registrar({
      id,
      metodo: peticion.method,
      ruta: new URL(peticion.url).pathname,
      estado: respuesta.status,
      ms: Math.round(performance.now() - inicio),
    });
    return respuesta;
  };
}
