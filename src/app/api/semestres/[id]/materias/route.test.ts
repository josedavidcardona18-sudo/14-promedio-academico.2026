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
import { POST } from './route';

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
