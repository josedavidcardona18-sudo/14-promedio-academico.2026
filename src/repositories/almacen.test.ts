import { describe, expect, it } from 'vitest';
import { crearAlmacenEnMemoria } from './almacen';

const opciones = { orden: 'creadoEn', descendente: false, limite: 10 };

async function conTres() {
  const almacen = crearAlmacenEnMemoria();
  await almacen.crear('u/a', { creadoEn: '2026-01-01' });
  await almacen.crear('u/b', { creadoEn: '2026-01-02' });
  await almacen.crear('u/c', { creadoEn: '2026-01-03' });
  await almacen.crear('u/c/hijos/x', { creadoEn: '2026-01-09' });
  return almacen;
}

describe('almacén en memoria', () => {
  it('lee null si no existe y devuelve una copia (no la referencia guardada)', async () => {
    const almacen = crearAlmacenEnMemoria();
    expect(await almacen.leer('u/a')).toBeNull();
    await almacen.crear('u/a', { n: { x: 1 } });
    const copia = await almacen.leer('u/a');
    expect(copia).toEqual({ n: { x: 1 } });
    if (copia && typeof copia['n'] === 'object' && copia['n'] !== null)
      Object.assign(copia['n'], { x: 2 });
    expect(await almacen.leer('u/a')).toEqual({ n: { x: 1 } });
  });

  it('crear falla con 409 si el documento ya existe; reemplazar sí lo sobrescribe', async () => {
    const almacen = crearAlmacenEnMemoria();
    await almacen.crear('u/a', { v: 1 });
    await expect(almacen.crear('u/a', { v: 2 })).rejects.toMatchObject({ status: 409 });
    await almacen.reemplazar('u/a', { v: 3 });
    expect(await almacen.leer('u/a')).toEqual({ v: 3 });
  });

  it('lista solo los hijos directos, ordenados, y cuenta', async () => {
    const almacen = await conTres();
    const lista = await almacen.listar('u', opciones);
    expect(lista.map((d) => d.id)).toEqual(['a', 'b', 'c']);
    expect(await almacen.contar('u')).toBe(3);
    expect(
      (await almacen.listar('u', { ...opciones, descendente: true })).map((d) => d.id),
    ).toEqual(['c', 'b', 'a']);
  });

  it('pagina por cursor: límite y «después de»', async () => {
    const almacen = await conTres();
    const primera = await almacen.listar('u', { ...opciones, limite: 2 });
    expect(primera.map((d) => d.id)).toEqual(['a', 'b']);
    const segunda = await almacen.listar('u', { ...opciones, limite: 2, despuesDe: 'b' });
    expect(segunda.map((d) => d.id)).toEqual(['c']);
  });

  it('un cursor que no existe es un 400', async () => {
    const almacen = await conTres();
    await expect(almacen.listar('u', { ...opciones, despuesDe: 'zzz' })).rejects.toMatchObject({
      status: 400,
    });
  });

  it('borrar quita un documento; borrarConSubcolecciones quita también lo de adentro', async () => {
    const almacen = await conTres();
    await almacen.borrar('u/a');
    expect(await almacen.leer('u/a')).toBeNull();
    await almacen.borrarConSubcolecciones('u/c');
    expect(await almacen.leer('u/c')).toBeNull();
    expect(await almacen.leer('u/c/hijos/x')).toBeNull();
    expect(await almacen.leer('u/b')).not.toBeNull();
  });

  it('desempata por id cuando dos documentos tienen la misma fecha', async () => {
    const almacen = crearAlmacenEnMemoria();
    await almacen.crear('u/b', { creadoEn: 'igual' });
    await almacen.crear('u/a', { creadoEn: 'igual' });
    expect((await almacen.listar('u', opciones)).map((d) => d.id)).toEqual(['a', 'b']);
  });
});
