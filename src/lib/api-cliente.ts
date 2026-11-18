import { z, type ZodType } from 'zod';
import {
  materiaSchema,
  semestreConMateriasSchema,
  type Materia,
  type MateriaEntrada,
  type SemestreConMaterias,
  type SemestreEntrada,
} from '@/schemas/semestre';

/** Un error de la API ya explicado para la persona (sin códigos ni detalles internos). */
export class ErrorDeApi extends Error {
  readonly estado: number | null;

  constructor(mensaje: string, estado: number | null) {
    super(mensaje);
    this.name = 'ErrorDeApi';
    this.estado = estado;
  }
}

const paginaSchema = z.object({
  items: z.array(semestreConMateriasSchema),
  siguienteCursor: z.string().nullable(),
});

const SIN_CONEXION = 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
const FORMATO = 'Los datos recibidos no tienen el formato esperado.';

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  cuerpo?: unknown;
  signal?: AbortSignal | undefined;
  /** Para el inicio de sesión: ahí el motivo del servidor («token muy antiguo») es lo que sirve. */
  mensajeDelServidor?: boolean;
}

const cuerpoDeErrorSchema = z.object({
  error: z.string(),
  detalles: z.array(z.object({ campo: z.string(), mensaje: z.string() })).optional(),
});

const MENSAJES_FIJOS: Record<number, string> = {
  401: 'Tu sesión venció. Inicia sesión de nuevo.',
  403: 'No tienes permiso para hacer esto.',
};
/** Estos códigos traen un mensaje del servidor ya pensado para la persona; si falta, este. */
const MENSAJES_DE_RESPALDO: Record<number, string> = {
  404: 'No encontramos lo que buscabas.',
  409: 'No se pudo completar la acción.',
  429: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
};
const MENSAJE_GENERICO = 'El servidor no pudo completar la acción. Inténtalo de nuevo.';

type CuerpoDeError = z.infer<typeof cuerpoDeErrorSchema> | null;

function mensajeDeValidacion(cuerpo: CuerpoDeError): string {
  const primero = cuerpo?.detalles?.[0];
  return primero
    ? `Revisa los datos: ${primero.mensaje}`
    : 'Revisa los datos e inténtalo de nuevo.';
}

/** El servidor ya responde en español; para lo demás damos un mensaje que sirva a la persona. */
async function mensajeDeFallo(respuesta: Response, delServidor: boolean): Promise<string> {
  const analizado = cuerpoDeErrorSchema.safeParse(await respuesta.json().catch(() => null));
  const cuerpo: CuerpoDeError = analizado.success ? analizado.data : null;
  const { status } = respuesta;
  if (delServidor && cuerpo) return cuerpo.error;
  if (status === 400) return mensajeDeValidacion(cuerpo);
  const respaldo = MENSAJES_DE_RESPALDO[status];
  if (respaldo) return cuerpo?.error ?? respaldo;
  return MENSAJES_FIJOS[status] ?? MENSAJE_GENERICO;
}

async function enviar(
  ruta: string,
  { metodo = 'GET', cuerpo, signal }: Opciones,
): Promise<Response> {
  const hayCuerpo = cuerpo !== undefined;
  try {
    return await fetch(ruta, {
      method: metodo,
      signal,
      ...(hayCuerpo && {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      }),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ErrorDeApi(SIN_CONEXION, null);
  }
}

/** Llama a la API; con `esquema` valida la respuesta con el mismo Zod que usa el servidor. */
async function llamar<T>(ruta: string, esquema: ZodType<T>, opciones?: Opciones): Promise<T>;
async function llamar(ruta: string, esquema: null, opciones?: Opciones): Promise<void>;
async function llamar<T>(ruta: string, esquema: ZodType<T> | null, opciones: Opciones = {}) {
  const respuesta = await enviar(ruta, opciones);
  if (!respuesta.ok) {
    throw new ErrorDeApi(
      await mensajeDeFallo(respuesta, opciones.mensajeDelServidor === true),
      respuesta.status,
    );
  }
  if (esquema === null) return undefined;
  const cuerpo: unknown = await respuesta.json().catch(() => null);
  const resultado = esquema.safeParse(cuerpo);
  if (!resultado.success) throw new ErrorDeApi(FORMATO, respuesta.status);
  return resultado.data;
}

const ruta = (...partes: string[]): string => partes.map(encodeURIComponent).join('/');
const rutaSemestre = (id: string) => `/api/semestres/${ruta(id)}`;

/** Son pocos (máximo 20 por cuenta): una sola página basta para el historial y los selectores. */
export async function listarSemestres(signal?: AbortSignal): Promise<SemestreConMaterias[]> {
  return (await llamar('/api/semestres?limite=100', paginaSchema, { signal })).items;
}

export const crearSemestre = (datos: SemestreEntrada) =>
  llamar('/api/semestres', semestreConMateriasSchema, { metodo: 'POST', cuerpo: datos });

export const actualizarSemestre = (id: string, datos: SemestreEntrada) =>
  llamar(rutaSemestre(id), semestreConMateriasSchema, { metodo: 'PUT', cuerpo: datos });

export const eliminarSemestre = (id: string) =>
  llamar(rutaSemestre(id), null, { metodo: 'DELETE' });

export const crearMateria = (semestreId: string, datos: Partial<MateriaEntrada>) =>
  llamar(`${rutaSemestre(semestreId)}/materias`, materiaSchema, { metodo: 'POST', cuerpo: datos });

export const actualizarMateria = (semestreId: string, materia: Materia) => {
  const { id, ...datos } = materia;
  return llamar(`${rutaSemestre(semestreId)}/materias/${ruta(id)}`, materiaSchema, {
    metodo: 'PUT',
    cuerpo: datos,
  });
};

export const eliminarMateria = (semestreId: string, materiaId: string) =>
  llamar(`${rutaSemestre(semestreId)}/materias/${ruta(materiaId)}`, null, { metodo: 'DELETE' });

export const cargarEjemplo = () =>
  llamar('/api/ejemplo', semestreConMateriasSchema, { metodo: 'POST' });

const usuarioSchema = z.object({
  uid: z.string(),
  correo: z.string().nullable(),
  rol: z.enum(['estudiante', 'admin']),
  demo: z.boolean(),
});
export type UsuarioActual = z.infer<typeof usuarioSchema>;

export const pedirUsuario = (signal?: AbortSignal) =>
  llamar('/api/auth/yo', usuarioSchema, { signal });

/** Cambia el `idToken` de Firebase por la cookie de sesión. */
export async function abrirSesion(idToken: string): Promise<void> {
  await llamar('/api/auth/sesion', z.unknown(), {
    metodo: 'POST',
    cuerpo: { idToken },
    mensajeDelServidor: true,
  });
}

export async function cerrarSesion(): Promise<void> {
  await llamar('/api/auth/sesion', null, { metodo: 'DELETE' });
}
