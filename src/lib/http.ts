import { ZodError, type ZodType } from 'zod';
import { detallesDeZod, ErrorHttp, peticionInvalida } from './errores';
import { excedeLimite, type Limite } from './limite';
import { registrar } from './log';

type Manejador<Contexto> = (peticion: Request, contexto: Contexto) => Promise<Response>;

interface Opciones {
  limite?: Limite;
}

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);
const MAX_CUERPO = 100_000;

export function json(datos: unknown, init?: ResponseInit): Response {
  return Response.json(datos, init);
}

export const creado = (datos: unknown): Response => json(datos, { status: 201 });
export const sinContenido = (): Response => new Response(null, { status: 204 });

/** Valida con Zod y, si falla, lanza un 400 con el detalle por campo. */
export function leer<T>(esquema: ZodType<T>, valor: unknown, campo: string): T {
  const resultado = esquema.safeParse(valor);
  if (resultado.success) return resultado.data;
  throw peticionInvalida(detallesDeZod(resultado.error, campo));
}

/** Cuerpo JSON validado: 415 si no es JSON, 413 si es demasiado grande, 400 si no cumple el esquema. */
export async function leerCuerpo<T>(peticion: Request, esquema: ZodType<T>): Promise<T> {
  if (!(peticion.headers.get('content-type') ?? '').includes('application/json')) {
    throw new ErrorHttp(415, 'El cuerpo debe ser application/json.');
  }
  if (Number(peticion.headers.get('content-length') ?? 0) > MAX_CUERPO) {
    throw new ErrorHttp(413, 'El cuerpo es demasiado grande.');
  }
  const texto = await peticion.text();
  if (texto.length > MAX_CUERPO) throw new ErrorHttp(413, 'El cuerpo es demasiado grande.');
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw peticionInvalida([{ campo: 'cuerpo', mensaje: 'El cuerpo no es JSON válido.' }]);
  }
  return leer(esquema, datos, 'cuerpo');
}

/**
 * Defensa contra CSRF en peticiones que modifican datos: el `Origin` debe ser este mismo sitio
 * (junto con la cookie `SameSite=Lax`). Sin `Origin` solo se acepta con `Authorization: Bearer`,
 * que una página ajena no puede añadir.
 */
export function verificarOrigen(peticion: Request): void {
  if (METODOS_SEGUROS.has(peticion.method)) return;
  const origen = peticion.headers.get('origin');
  const sitio = peticion.headers.get('host') ?? new URL(peticion.url).host;
  if (origen) {
    let hostDelOrigen: string | null = null;
    try {
      hostDelOrigen = new URL(origen).host;
    } catch {
      // un Origin ilegible se trata como ajeno
    }
    if (hostDelOrigen === sitio) return;
  } else if (peticion.headers.get('authorization')?.startsWith('Bearer ')) {
    return;
  }
  throw new ErrorHttp(403, 'Origen no permitido.');
}

const ipDe = (peticion: Request): string =>
  peticion.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

function aplicarLimite(peticion: Request, limite: Limite): void {
  const clave = `${ipDe(peticion)}:${peticion.method}:${new URL(peticion.url).pathname}`;
  const { excede, reintentarEnSegundos } = excedeLimite(clave, limite);
  if (excede) {
    throw new ErrorHttp(
      429,
      'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
      undefined,
      {
        'Retry-After': String(reintentarEnSegundos),
      },
    );
  }
}

/** `{ error: 'FirebaseAppError', codigo: 'app/invalid-credential' }`: lo bastante para depurar, sin datos. */
function datosDelFallo(error: unknown): Record<string, string> {
  const nombre = error instanceof Error ? error.name : 'desconocido';
  const codigo = typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
  return typeof codigo === 'string' || typeof codigo === 'number'
    ? { error: nombre, codigo: String(codigo) }
    : { error: nombre };
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
    return json(cuerpo, { status: error.status, headers: error.cabeceras });
  }
  // Un error inesperado nunca revela su mensaje, su pila ni sus rutas.
  return json({ error: 'Error interno.' }, { status: 500 });
}

/**
 * Envoltorio común: comprobación de origen, límite de frecuencia, errores consistentes, `no-store`
 * (los datos son privados), identificador de petición y registro sin datos sensibles.
 */
export function manejar<Contexto>(
  manejador: Manejador<Contexto>,
  { limite }: Opciones = {},
): Manejador<Contexto> {
  return async (peticion, contexto) => {
    const id = crypto.randomUUID();
    const inicio = performance.now();
    let respuesta: Response;
    try {
      verificarOrigen(peticion);
      if (limite && !METODOS_SEGUROS.has(peticion.method)) aplicarLimite(peticion, limite);
      respuesta = await manejador(peticion, contexto);
    } catch (error) {
      respuesta = respuestaDeError(error);
      if (respuesta.status >= 500) {
        registrar({ nivel: 'error', id, ...datosDelFallo(error) });
      }
    }
    respuesta.headers.set('Cache-Control', 'no-store');
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
