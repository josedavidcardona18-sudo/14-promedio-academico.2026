import { beforeEach, describe, expect, it } from 'vitest';
import { crearAlmacenEnMemoria, type AlmacenDocumentos } from './almacen';
import { SEMESTRE_DE_EJEMPLO, UID_DEMO, sembrarEjemplo } from './ejemplo';
import { crearRepositorioSemestres, type RepositorioSemestres } from './semestres';

const nota = { nombre: 'Parcial', valor: 4, porcentaje: 50 };
let almacen: AlmacenDocumentos;
let repo: RepositorioSemestres;

beforeEach(() => {
  almacen = crearAlmacenEnMemoria();
  let segundo = 0;
  let n = 0;
  repo = crearRepositorioSemestres({
    almacen,
    ahora: () => new Date(Date.UTC(2026, 0, 1, 0, 0, segundo++)),
    nuevoId: () => `id-${++n}`,
  });
});

describe('semestres', () => {
  it('crea un semestre con id y fecha del servidor, y se puede volver a leer', async () => {
    const creado = await repo.crear('ana', { nombre: '2026-1', meta: 3.5 });
    expect(creado).toEqual({
      id: 'id-1',
      creadoEn: '2026-01-01T00:00:00.000Z',
      nombre: '2026-1',
      meta: 3.5,
      materias: [],
    });
    expect(await repo.obtener('ana', 'id-1')).toEqual(creado);
  });

  it('lista del más reciente al más antiguo, con paginación por cursor', async () => {
    for (const nombre of ['A', 'B', 'C']) await repo.crear('ana', { nombre, meta: 3 });
    const primera = await repo.listar('ana', 2);
    expect(primera.items.map((s) => s.nombre)).toEqual(['C', 'B']);
    expect(primera.siguienteCursor).toBe('id-2');
    const segunda = await repo.listar('ana', 2, primera.siguienteCursor ?? undefined);
    expect(segunda.items.map((s) => s.nombre)).toEqual(['A']);
    expect(segunda.siguienteCursor).toBeNull();
  });

  it('un cursor que no existe es un 400', async () => {
    await repo.crear('ana', { nombre: 'A', meta: 3 });
    await expect(repo.listar('ana', 5, 'no-existe')).rejects.toMatchObject({ status: 400 });
  });

  it('actualiza nombre y meta sin tocar las materias', async () => {
    const { id } = await repo.crear('ana', { nombre: 'A', meta: 3 });
    await repo.crearMateria('ana', id, { nombre: 'Física', creditos: 3, notas: [nota] });
    const actualizado = await repo.actualizar('ana', id, { nombre: 'Nuevo', meta: 4 });
    expect(actualizado).toMatchObject({ nombre: 'Nuevo', meta: 4 });
    expect(actualizado?.materias).toHaveLength(1);
    expect(await repo.actualizar('ana', 'no-existe', { nombre: 'x', meta: 3 })).toBeNull();
  });

  it('eliminar borra el semestre y todas sus materias (en cascada)', async () => {
    const { id } = await repo.crear('ana', { nombre: 'A', meta: 3 });
    await repo.crearMateria('ana', id, { nombre: 'Física', creditos: 3, notas: [] });
    expect(await repo.eliminar('ana', id)).toBe(true);
    expect(await repo.obtener('ana', id)).toBeNull();
    expect(await almacen.contar(`usuarios/ana/semestres/${id}/materias`)).toBe(0);
    expect(await repo.eliminar('ana', id)).toBe(false);
    expect(await repo.contar('ana')).toBe(0);
  });
});

describe('materias', () => {
  it('se crean en orden, se actualizan por completo y se eliminan', async () => {
    const { id } = await repo.crear('ana', { nombre: 'A', meta: 3 });
    const fisica = await repo.crearMateria('ana', id, { nombre: 'Física', creditos: 3, notas: [] });
    await repo.crearMateria('ana', id, { nombre: 'Álgebra', creditos: 2, notas: [nota] });
    expect((await repo.obtener('ana', id))?.materias.map((m) => m.nombre)).toEqual([
      'Física',
      'Álgebra',
    ]);

    const editada = await repo.actualizarMateria('ana', id, fisica?.id ?? '', {
      nombre: 'Física II',
      creditos: 4,
      notas: [nota],
    });
    expect(editada).toEqual({ id: fisica?.id, nombre: 'Física II', creditos: 4, notas: [nota] });
    expect(await repo.eliminarMateria('ana', id, fisica?.id ?? '')).toBe(true);
    expect(await repo.eliminarMateria('ana', id, fisica?.id ?? '')).toBe(false);
    expect((await repo.obtener('ana', id))?.materias).toHaveLength(1);
  });

  it('en un semestre o una materia que no existen devuelven null / false', async () => {
    const datos = { nombre: 'x', creditos: 1, notas: [] };
    expect(await repo.crearMateria('ana', 'no-existe', datos)).toBeNull();
    expect(await repo.actualizarMateria('ana', 'no-existe', 'm', datos)).toBeNull();
    expect(await repo.eliminarMateria('ana', 'no-existe', 'm')).toBe(false);
  });
});

describe('autorización por objeto: cada usuario solo ve lo suyo', () => {
  it('lo de Ana no existe para Beto (lectura, escritura y borrado)', async () => {
    const { id } = await repo.crear('ana', { nombre: 'Privado', meta: 3 });
    const materia = await repo.crearMateria('ana', id, {
      nombre: 'Física',
      creditos: 3,
      notas: [],
    });

    expect(await repo.obtener('beto', id)).toBeNull();
    expect((await repo.listar('beto', 10)).items).toEqual([]);
    expect(await repo.actualizar('beto', id, { nombre: 'Hackeado', meta: 5 })).toBeNull();
    expect(await repo.eliminar('beto', id)).toBe(false);
    expect(await repo.crearMateria('beto', id, { nombre: 'x', creditos: 1, notas: [] })).toBeNull();
    expect(await repo.eliminarMateria('beto', id, materia?.id ?? '')).toBe(false);
    expect((await repo.obtener('ana', id))?.nombre).toBe('Privado');
  });

  it('un identificador con `/` o `..` no puede escapar a otra colección', async () => {
    await expect(repo.obtener('ana', '../../beto/semestres/x')).rejects.toThrow(
      'Segmento de ruta no permitido',
    );
    await expect(repo.obtener('ana/../beto', 'x')).rejects.toThrow('Segmento de ruta no permitido');
    await expect(
      repo.crearMateria('ana', 'a/b', { nombre: 'x', creditos: 1, notas: [] }),
    ).rejects.toThrow();
  });
});

describe('datos guardados', () => {
  it('un documento con otra forma es un error del servidor, no se devuelve a medias', async () => {
    await almacen.reemplazar('usuarios/ana/semestres/malo', {
      nombre: 'x',
      meta: 'no-es-numero',
      creadoEn: '2026-01-01T00:00:00.000Z',
    });
    await expect(repo.obtener('ana', 'malo')).rejects.toThrow('formato esperado');
  });

  it('la siembra del ejemplo produce exactamente el semestre de ejemplo', async () => {
    await sembrarEjemplo(almacen, UID_DEMO);
    expect(await repo.obtener(UID_DEMO, 'ejemplo')).toEqual(SEMESTRE_DE_EJEMPLO);
  });
});
