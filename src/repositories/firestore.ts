import { ErrorHttp, peticionInvalida } from '@/lib/errores';
import type { AlmacenDocumentos, Datos, DocumentoGuardado } from './almacen';

/**
 * Lo mínimo que se usa de Firestore (el `Firestore` del Admin SDK lo cumple tal cual). Declararlo
 * así permite probar el adaptador con un doble sin red ni credenciales.
 */
export interface InstantaneaMinima {
  exists: boolean;
  id: string;
  data(): Datos | undefined;
}

export interface ReferenciaMinima {
  path: string;
  get(): Promise<InstantaneaMinima>;
  create(datos: Datos): Promise<unknown>;
  set(datos: Datos): Promise<unknown>;
  delete(): Promise<unknown>;
}

export interface ConsultaMinima {
  orderBy(campo: string, direccion: 'asc' | 'desc'): ConsultaMinima;
  limit(cantidad: number): ConsultaMinima;
  startAfter(instantanea: InstantaneaMinima): ConsultaMinima;
  get(): Promise<{ docs: InstantaneaMinima[] }>;
  count(): { get(): Promise<{ data(): { count: number } }> };
}

export interface FirestoreMinimo {
  doc(ruta: string): ReferenciaMinima;
  collection(ruta: string): ConsultaMinima;
  recursiveDelete(referencia: { path: string }): Promise<void>;
}

const YA_EXISTE = new Set<unknown>([6, 'already-exists', 'ALREADY_EXISTS']);

function yaExiste(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'code' in error && YA_EXISTE.has(error.code)
  );
}

/** Adaptador de Firestore (Admin SDK): la única parte del código que habla con la base real. */
export function crearAlmacenFirestore(db: FirestoreMinimo): AlmacenDocumentos {
  return {
    async leer(ruta) {
      const documento = await db.doc(ruta).get();
      return documento.exists ? (documento.data() ?? null) : null;
    },

    async crear(ruta, datos) {
      try {
        await db.doc(ruta).create(datos);
      } catch (error) {
        if (yaExiste(error)) {
          throw new ErrorHttp(409, 'Ya existe un elemento con ese identificador.');
        }
        throw error;
      }
    },

    async reemplazar(ruta, datos) {
      await db.doc(ruta).set(datos);
    },

    async borrar(ruta) {
      await db.doc(ruta).delete();
    },

    async borrarConSubcolecciones(ruta) {
      await db.recursiveDelete(db.doc(ruta));
    },

    async listar(coleccion, { orden, descendente, limite, despuesDe }) {
      let consulta = db.collection(coleccion).orderBy(orden, descendente ? 'desc' : 'asc');
      if (despuesDe !== undefined) {
        const cursor = await db.doc(`${coleccion}/${despuesDe}`).get();
        if (!cursor.exists) {
          throw peticionInvalida([{ campo: 'cursor', mensaje: 'Cursor inválido.' }]);
        }
        consulta = consulta.startAfter(cursor);
      }
      const resultado = await consulta.limit(limite).get();
      return resultado.docs.map((d): DocumentoGuardado => ({ id: d.id, datos: d.data() ?? {} }));
    },

    async contar(coleccion) {
      const respuesta = await db.collection(coleccion).count().get();
      return respuesta.data().count;
    },
  };
}
