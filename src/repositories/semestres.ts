import { ID_SEMESTRE_DE_EJEMPLO } from '@/lib/constantes';
import {
  semestreConMateriasSchema,
  type Materia,
  type MateriaEntrada,
  type SemestreConMaterias,
  type SemestreEntrada,
} from '@/schemas/semestre';
import type { AlmacenDocumentos, Datos } from './almacen';
import { sembrarEjemplo } from './ejemplo';

export interface PaginaDeSemestres {
  items: SemestreConMaterias[];
  siguienteCursor: string | null;
}

/**
 * Único acceso a los datos de semestres y materias. Todo cuelga de `usuarios/{uid}`: el `uid`
 * sale siempre de la sesión verificada, nunca del cuerpo ni de la URL, así que nadie alcanza lo ajeno.
 */
export interface RepositorioSemestres {
  listar(uid: string, limite: number, cursor?: string): Promise<PaginaDeSemestres>;
  contar(uid: string): Promise<number>;
  obtener(uid: string, id: string): Promise<SemestreConMaterias | null>;
  crear(uid: string, datos: SemestreEntrada): Promise<SemestreConMaterias>;
  actualizar(uid: string, id: string, datos: SemestreEntrada): Promise<SemestreConMaterias | null>;
  eliminar(uid: string, id: string): Promise<boolean>;
  crearMateria(uid: string, semestreId: string, datos: MateriaEntrada): Promise<Materia | null>;
  actualizarMateria(
    uid: string,
    semestreId: string,
    materiaId: string,
    datos: MateriaEntrada,
  ): Promise<Materia | null>;
  eliminarMateria(uid: string, semestreId: string, materiaId: string): Promise<boolean>;
  /** Copia el semestre de ejemplo a la cuenta; `null` si ya lo tenía. */
  cargarEjemplo(uid: string): Promise<SemestreConMaterias | null>;
}

interface Dependencias {
  almacen: AlmacenDocumentos;
  ahora?: () => Date;
  nuevoId?: () => string;
}

const SEGURO = /^[A-Za-z0-9_-]{1,128}$/;

/** Defensa en profundidad: ningún segmento puede traer `/` ni `..` y escapar a otra colección. */
function ruta(...segmentos: string[]): string {
  for (const segmento of segmentos) {
    if (!SEGURO.test(segmento)) throw new Error('Segmento de ruta no permitido.');
  }
  return segmentos.join('/');
}

const texto = (datos: Datos, campo: string): string => String(datos[campo] ?? '');

const coleccionSemestres = (uid: string) => ruta('usuarios', uid, 'semestres');
const rutaSemestre = (uid: string, id: string) => `${coleccionSemestres(uid)}/${ruta(id)}`;
const coleccionMaterias = (uid: string, semestreId: string) =>
  ruta('usuarios', uid, 'semestres', semestreId, 'materias');
const rutaMateria = (uid: string, semestreId: string, id: string) =>
  `${coleccionMaterias(uid, semestreId)}/${ruta(id)}`;

function aMateria(id: string, datos: Datos): Materia {
  return {
    id,
    nombre: texto(datos, 'nombre'),
    creditos: Number(datos['creditos']),
    notas: Array.isArray(datos['notas']) ? datos['notas'] : [],
  };
}

async function armar(
  almacen: AlmacenDocumentos,
  uid: string,
  id: string,
  datos: Datos,
): Promise<SemestreConMaterias> {
  const materias = await almacen.listar(coleccionMaterias(uid, id), {
    orden: 'creadoEn',
    descendente: false,
    limite: 100,
  });
  const semestre = semestreConMateriasSchema.safeParse({
    id,
    creadoEn: texto(datos, 'creadoEn'),
    nombre: texto(datos, 'nombre'),
    meta: datos['meta'],
    materias: materias.map((m) => aMateria(m.id, m.datos)),
  });
  // Un documento con otra forma es un error del servidor, no de quien pregunta.
  if (!semestre.success) throw new Error('Un documento guardado no tiene el formato esperado.');
  return semestre.data;
}

type Lecturas = Pick<RepositorioSemestres, 'listar' | 'contar' | 'obtener'>;

function crearLecturas(almacen: AlmacenDocumentos): Lecturas {
  return {
    async listar(uid, limite, cursor) {
      const pagina = await almacen.listar(coleccionSemestres(uid), {
        orden: 'creadoEn',
        descendente: true,
        limite: limite + 1,
        despuesDe: cursor,
      });
      const visibles = pagina.slice(0, limite);
      const items = await Promise.all(visibles.map((d) => armar(almacen, uid, d.id, d.datos)));
      const ultimo = visibles.at(-1);
      return { items, siguienteCursor: pagina.length > limite && ultimo ? ultimo.id : null };
    },
    contar: (uid) => almacen.contar(coleccionSemestres(uid)),
    async obtener(uid, id) {
      const datos = await almacen.leer(rutaSemestre(uid, id));
      return datos ? armar(almacen, uid, id, datos) : null;
    },
  };
}

type EscriturasDeSemestre = Pick<
  RepositorioSemestres,
  'crear' | 'actualizar' | 'eliminar' | 'cargarEjemplo'
>;

function crearEscriturasDeSemestre(
  { almacen, ahora = () => new Date(), nuevoId = () => crypto.randomUUID() }: Dependencias,
  lecturas: Lecturas,
): EscriturasDeSemestre {
  return {
    async crear(uid, { nombre, meta }) {
      const id = nuevoId();
      const creadoEn = ahora().toISOString();
      await almacen.crear(rutaSemestre(uid, id), { nombre, meta, creadoEn });
      return { id, creadoEn, nombre, meta, materias: [] };
    },

    async actualizar(uid, id, { nombre, meta }) {
      const rutaDoc = rutaSemestre(uid, id);
      const actual = await almacen.leer(rutaDoc);
      if (!actual) return null;
      await almacen.reemplazar(rutaDoc, { ...actual, nombre, meta });
      return lecturas.obtener(uid, id);
    },

    async eliminar(uid, id) {
      const rutaDoc = rutaSemestre(uid, id);
      if (!(await almacen.leer(rutaDoc))) return false;
      await almacen.borrarConSubcolecciones(rutaDoc);
      return true;
    },

    async cargarEjemplo(uid) {
      if (await lecturas.obtener(uid, ID_SEMESTRE_DE_EJEMPLO)) return null;
      await sembrarEjemplo(almacen, uid);
      return lecturas.obtener(uid, ID_SEMESTRE_DE_EJEMPLO);
    },
  };
}

type EscriturasDeMateria = Pick<
  RepositorioSemestres,
  'crearMateria' | 'actualizarMateria' | 'eliminarMateria'
>;

function crearEscriturasDeMateria({
  almacen,
  ahora = () => new Date(),
  nuevoId = () => crypto.randomUUID(),
}: Dependencias): EscriturasDeMateria {
  return {
    async crearMateria(uid, semestreId, { nombre, creditos, notas }) {
      if (!(await almacen.leer(rutaSemestre(uid, semestreId)))) return null;
      const id = nuevoId();
      const creadoEn = ahora().toISOString();
      await almacen.crear(rutaMateria(uid, semestreId, id), { nombre, creditos, notas, creadoEn });
      return { id, nombre, creditos, notas };
    },

    async actualizarMateria(uid, semestreId, materiaId, { nombre, creditos, notas }) {
      const rutaDoc = rutaMateria(uid, semestreId, materiaId);
      const actual = await almacen.leer(rutaDoc);
      if (!actual) return null;
      await almacen.reemplazar(rutaDoc, { ...actual, nombre, creditos, notas });
      return { id: materiaId, nombre, creditos, notas };
    },

    async eliminarMateria(uid, semestreId, materiaId) {
      const rutaDoc = rutaMateria(uid, semestreId, materiaId);
      if (!(await almacen.leer(rutaDoc))) return false;
      await almacen.borrar(rutaDoc);
      return true;
    },
  };
}

export function crearRepositorioSemestres(dependencias: Dependencias): RepositorioSemestres {
  const lecturas = crearLecturas(dependencias.almacen);
  return {
    ...lecturas,
    ...crearEscriturasDeSemestre(dependencias, lecturas),
    ...crearEscriturasDeMateria(dependencias),
  };
}
