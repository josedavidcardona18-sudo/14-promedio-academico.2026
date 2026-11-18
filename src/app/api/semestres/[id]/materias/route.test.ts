// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pedir, reiniciarEntorno } from '@/app/api/pruebas-api';

vi.mock(
  '@/lib/firebase-admin',
  async () => (await import('@/app/api/pruebas-api')).moduloFirebaseFalso,
);
vi.mock('@/repositories', async () => (await import('@/app/api/pruebas-api')).moduloRepositorios);

beforeEach(reiniciarEntorno);
import { LIMITES } from '@/schemas/semestre';
import { materiaValida } from '@/app/api/pruebas-api';
import { GET, POST } from './route';

const crear = (id: string, cuerpo: unknown, opciones: Parameters<typeof pedir>[1] = {}) =>
  POST(pedir(`/api/semestres/${id}/materias`, { metodo: 'POST', cuerpo, ...opciones }), {
    params: Promise.resolve({ id }),
  });

describe('POST /api/semestres/:id/materias', () => {
  it('201: crea la materia con id nuevo y queda en el semestre', async () => {
    const r = await crear('ejemplo', materiaValida);
    const materia = await r.json();
    expect(r.status).toBe(201);
    expect(materia).toMatchObject({ ...materiaValida, id: expect.any(String) });
  });

  it('201: las notas son opcionales al crear (la materia empieza vacía)', async () => {
    const r = await crear('ejemplo', { nombre: 'Ética', creditos: 2 });
    expect(r.status).toBe(201);
    expect((await r.json()).notas).toEqual([]);
  });

  it('400: los porcentajes pasan de 100 %, nota de 5,5, créditos 0 o campo desconocido', async () => {
    const notas = (valor: number, porcentaje: number) => [{ nombre: 'n', valor, porcentaje }];
    const casos = [
      { ...materiaValida, notas: [...notas(3, 60), ...notas(3, 50)] },
      { ...materiaValida, notas: notas(5.5, 30) },
      { ...materiaValida, creditos: 0 },
      { ...materiaValida, rol: 'admin' },
    ];
    for (const cuerpo of casos) {
      const r = await crear('ejemplo', cuerpo);
      expect(r.status, JSON.stringify(cuerpo)).toBe(400);
    }
  });

  it('404: el semestre no existe o es de otra persona; 401 sin sesión; 403 desde otro origen', async () => {
    expect((await crear('nada', materiaValida)).status).toBe(404);
    expect((await crear('ejemplo', materiaValida, { uid: 'beto' })).status).toBe(404);
    expect((await crear('ejemplo', materiaValida, { uid: null })).status).toBe(401);
    expect((await crear('ejemplo', materiaValida, { origen: 'https://malo.example' })).status).toBe(
      403,
    );
  });

  it('409: al llegar al máximo de materias por semestre', async () => {
    const libres = LIMITES.maxMateriasPorSemestre - 4;
    for (let i = 0; i < libres; i++)
      expect((await crear('ejemplo', materiaValida)).status).toBe(201);
    const r = await crear('ejemplo', materiaValida);
    expect(r.status).toBe(409);
    expect((await r.json()).error).toContain('máximo');
  });
});

describe('GET /api/semestres/:id/materias', () => {
  const listar = (id: string, consulta = '', opciones: Parameters<typeof pedir>[1] = {}) =>
    GET(pedir(`/api/semestres/${id}/materias${consulta}`, opciones), {
      params: Promise.resolve({ id }),
    });

  it('200: las materias del semestre, de la más antigua a la más reciente, sin siguienteCursor', async () => {
    const r = await listar('ejemplo');
    const cuerpo = await r.json();
    expect(r.status).toBe(200);
    expect(cuerpo.items.map((m: { id: string }) => m.id)).toEqual([
      'calculo-diferencial',
      'programacion-web',
      'algebra-lineal',
      'ingles-ii',
    ]);
    expect(cuerpo.siguienteCursor).toBeNull();
  });

  it('pagina con limite y cursor sin repetir ni perder materias', async () => {
    const primera = await (await listar('ejemplo', '?limite=3')).json();
    expect(primera.items).toHaveLength(3);
    expect(primera.siguienteCursor).toBe('algebra-lineal');
    const segunda = await (
      await listar('ejemplo', `?limite=3&cursor=${primera.siguienteCursor}`)
    ).json();
    expect(segunda.items.map((m: { id: string }) => m.id)).toEqual(['ingles-ii']);
    expect(segunda.siguienteCursor).toBeNull();
  });

  it('400: límite o cursor inválidos; 404: semestre ajeno o inexistente; 401: sin sesión', async () => {
    expect((await listar('ejemplo', '?limite=101')).status).toBe(400);
    const cursor = await listar('ejemplo', '?cursor=no-existe');
    expect(cursor.status).toBe(400);
    expect((await cursor.json()).detalles).toEqual([
      { campo: 'cursor', mensaje: 'Cursor inválido.' },
    ]);
    expect((await listar('ejemplo', '', { uid: 'beto' })).status).toBe(404);
    expect((await listar('nada')).status).toBe(404);
    expect((await listar('ejemplo', '', { uid: null })).status).toBe(401);
  });
});
