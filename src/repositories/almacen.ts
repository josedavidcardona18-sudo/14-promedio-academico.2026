import { ErrorHttp, peticionInvalida } from '@/lib/errores';

export type Datos = Record<string, unknown>;

export interface DocumentoGuardado {
  id: string;
  datos: Datos;
}

export interface OpcionesDeListado {
  orden: string;
  descendente: boolean;
  limite: number;
  /** Id del último documento de la página anterior (paginación por cursor). */
  despuesDe?: string | undefined;
}

/**
 * Lo mínimo que el repositorio necesita de una base de documentos. Hay dos implementaciones:
 * en memoria (modo demostración y pruebas) y Firestore (`firestore.ts`). La lógica vive en el
 * repositorio, no aquí.
 */
export interface AlmacenDocumentos {
  leer(ruta: string): Promise<Datos | null>;
  /** Falla con 409 si el documento ya existe: así el id es único sin carreras. */
  crear(ruta: string, datos: Datos): Promise<void>;
  reemplazar(ruta: string, datos: Datos): Promise<void>;
  borrar(ruta: string): Promise<void>;
  borrarConSubcolecciones(ruta: string): Promise<void>;
  listar(coleccion: string, opciones: OpcionesDeListado): Promise<DocumentoGuardado[]>;
  contar(coleccion: string): Promise<number>;
}

function valorDeOrden(datos: Datos, campo: string): string {
  const valor = datos[campo];
  return typeof valor === 'string' ? valor : '';
}

function esHijoDirecto(ruta: string, coleccion: string): boolean {
  return ruta.startsWith(`${coleccion}/`) && !ruta.slice(coleccion.length + 1).includes('/');
}

export function crearAlmacenEnMemoria(): AlmacenDocumentos {
  const documentos = new Map<string, Datos>();
  const hijos = (coleccion: string) =>
    [...documentos.entries()].filter(([ruta]) => esHijoDirecto(ruta, coleccion));

  return {
    async leer(ruta) {
      const datos = documentos.get(ruta);
      return datos ? structuredClone(datos) : null;
    },
    async crear(ruta, datos) {
      if (documentos.has(ruta))
        throw new ErrorHttp(409, 'Ya existe un elemento con ese identificador.');
      documentos.set(ruta, structuredClone(datos));
    },
    async reemplazar(ruta, datos) {
      documentos.set(ruta, structuredClone(datos));
    },
    async borrar(ruta) {
      documentos.delete(ruta);
    },
    async borrarConSubcolecciones(ruta) {
      for (const clave of [...documentos.keys()]) {
        if (clave === ruta || clave.startsWith(`${ruta}/`)) documentos.delete(clave);
      }
    },
    async listar(coleccion, { orden, descendente, limite, despuesDe }) {
      const ordenados = hijos(coleccion)
        .map(([ruta, datos]) => ({ id: ruta.slice(coleccion.length + 1), datos }))
        .sort(
          (a, b) =>
            valorDeOrden(a.datos, orden).localeCompare(valorDeOrden(b.datos, orden)) ||
            a.id.localeCompare(b.id),
        );
      if (descendente) ordenados.reverse();
      const desde =
        despuesDe === undefined ? 0 : ordenados.findIndex((d) => d.id === despuesDe) + 1;
      if (despuesDe !== undefined && desde === 0)
        throw peticionInvalida([{ campo: 'cursor', mensaje: 'Cursor inválido.' }]);
      return ordenados
        .slice(desde, desde + limite)
        .map((d) => ({ id: d.id, datos: structuredClone(d.datos) }));
    },
    async contar(coleccion) {
      return hijos(coleccion).length;
    },
  };
}
