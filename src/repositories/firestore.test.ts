import { describe, expect, it, vi } from 'vitest';
import type { Datos } from './almacen';
import {
  crearAlmacenFirestore,
  type ConsultaMinima,
  type FirestoreMinimo,
  type InstantaneaMinima,
  type ReferenciaMinima,
} from './firestore';

/** Doble de Firestore: guarda documentos en un mapa y registra las consultas que recibe. */
function crearDoble(inicial: Record<string, Datos> = {}) {
  const documentos = new Map(Object.entries(inicial));
  const consultas: string[] = [];
  const instantanea = (ruta: string): InstantaneaMinima => ({
    exists: documentos.has(ruta),
    id: ruta.split('/').at(-1) ?? '',
    data: () => documentos.get(ruta),
  });
  const referencia = (ruta: string): ReferenciaMinima => ({
    path: ruta,
    get: async () => instantanea(ruta),
    create: async (datos) => {
      if (documentos.has(ruta)) throw Object.assign(new Error('exists'), { code: 6 });
      documentos.set(ruta, datos);
    },
    set: async (datos) => void documentos.set(ruta, datos),
    delete: async () => void documentos.delete(ruta),
  });
  const consulta = (coleccion: string, pasos: string[]): ConsultaMinima => ({
    orderBy: (campo, direccion) =>
      consulta(coleccion, [...pasos, `orderBy(${campo},${direccion})`]),
    limit: (n) => consulta(coleccion, [...pasos, `limit(${n})`]),
    startAfter: (i) => consulta(coleccion, [...pasos, `startAfter(${i.id})`]),
    get: async () => {
      consultas.push(`${coleccion}:${pasos.join('.')}`);
      const docs = [...documentos.keys()]
        .filter(
          (r) => r.startsWith(`${coleccion}/`) && !r.slice(coleccion.length + 1).includes('/'),
        )
        .map(instantanea);
      return { docs };
    },
    count: () => ({ get: async () => ({ data: () => ({ count: 7 }) }) }),
  });
  const db: FirestoreMinimo = {
    doc: referencia,
    collection: (ruta) => consulta(ruta, []),
    recursiveDelete: vi.fn(async () => undefined),
  };
  return { db, documentos, consultas };
}

describe('crearAlmacenFirestore', () => {
  it('leer devuelve los datos o null si no existe', async () => {
    const { db } = crearDoble({ 'a/1': { nombre: 'x' } });
    const almacen = crearAlmacenFirestore(db);
    expect(await almacen.leer('a/1')).toEqual({ nombre: 'x' });
    expect(await almacen.leer('a/2')).toBeNull();
  });

  it('crear falla con 409 si el documento ya existe (el id es único aunque haya carreras)', async () => {
    const { db } = crearDoble({ 'a/1': {} });
    const almacen = crearAlmacenFirestore(db);
    await expect(almacen.crear('a/1', {})).rejects.toMatchObject({ status: 409 });
    await almacen.crear('a/2', { n: 1 });
    expect(await almacen.leer('a/2')).toEqual({ n: 1 });
  });

  it('crear no esconde los demás errores como 409', async () => {
    const { db } = crearDoble();
    const rota: FirestoreMinimo = {
      ...db,
      doc: () => ({ ...db.doc('x'), create: async () => Promise.reject(new Error('sin red')) }),
    };
    await expect(crearAlmacenFirestore(rota).crear('a/1', {})).rejects.toThrow('sin red');
  });

  it('reemplazar y borrar escriben en el documento', async () => {
    const { db, documentos } = crearDoble({ 'a/1': { v: 1 } });
    const almacen = crearAlmacenFirestore(db);
    await almacen.reemplazar('a/1', { v: 2 });
    expect(documentos.get('a/1')).toEqual({ v: 2 });
    await almacen.borrar('a/1');
    expect(documentos.has('a/1')).toBe(false);
  });

  it('borrarConSubcolecciones usa recursiveDelete sobre el documento', async () => {
    const { db } = crearDoble();
    await crearAlmacenFirestore(db).borrarConSubcolecciones('usuarios/u/semestres/s');
    expect(db.recursiveDelete).toHaveBeenCalledTimes(1);
  });

  it('listar ordena, limita y pagina con el documento cursor', async () => {
    const { db, consultas } = crearDoble({ 'c/a': { n: 1 }, 'c/b': { n: 2 }, 'c/c/sub/x': {} });
    const almacen = crearAlmacenFirestore(db);
    const pagina = await almacen.listar('c', { orden: 'creadoEn', descendente: true, limite: 3 });
    expect(pagina.map((d) => d.id)).toEqual(['a', 'b']);
    await almacen.listar('c', { orden: 'creadoEn', descendente: false, limite: 2, despuesDe: 'a' });
    expect(consultas).toEqual([
      'c:orderBy(creadoEn,desc).limit(3)',
      'c:orderBy(creadoEn,asc).startAfter(a).limit(2)',
    ]);
  });

  it('un cursor que no existe es un 400, no un error del servidor', async () => {
    const { db } = crearDoble();
    await expect(
      crearAlmacenFirestore(db).listar('c', {
        orden: 'creadoEn',
        descendente: false,
        limite: 2,
        despuesDe: 'fantasma',
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('contar usa la agregación count() de Firestore', async () => {
    const { db } = crearDoble();
    expect(await crearAlmacenFirestore(db).contar('c')).toBe(7);
  });
});
