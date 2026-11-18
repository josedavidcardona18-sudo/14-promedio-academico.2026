// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pedir, reiniciarEntorno } from '@/app/api/pruebas-api';

vi.mock(
  '@/lib/firebase-admin',
  async () => (await import('@/app/api/pruebas-api')).moduloFirebaseFalso,
);
vi.mock('@/repositories', async () => (await import('@/app/api/pruebas-api')).moduloRepositorios);

beforeEach(reiniciarEntorno);
import { semestreConMateriasSchema } from '@/schemas/semestre';
import { POST } from './route';

const cargar = (opciones: Parameters<typeof pedir>[1] = {}) =>
  POST(pedir('/api/ejemplo', { metodo: 'POST', ...opciones }), {});

describe('POST /api/ejemplo', () => {
  it('201: copia el semestre de ejemplo a la cuenta vacía de Beto', async () => {
    const r = await cargar({ uid: 'beto' });
    expect(r.status).toBe(201);
    expect(semestreConMateriasSchema.parse(await r.json()).materias).toHaveLength(4);
  });

  it('409: Ana ya lo tiene; no se duplica', async () => {
    const r = await cargar();
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ error: 'Los datos de ejemplo ya están cargados.' });
  });

  it('401 sin sesión y 403 desde otro origen', async () => {
    expect((await cargar({ uid: null })).status).toBe(401);
    expect((await cargar({ uid: 'beto', origen: 'https://malo.example' })).status).toBe(403);
  });

  it('409 si la cuenta ya está llena de semestres', async () => {
    const { POST: crear } = await import('../semestres/route');
    for (let i = 0; i < 20; i++) {
      await crear(
        pedir('/api/semestres', {
          uid: 'beto',
          metodo: 'POST',
          cuerpo: { nombre: `S${i}`, meta: 3 },
        }),
        {},
      );
    }
    const r = await cargar({ uid: 'beto' });
    expect(r.status).toBe(409);
    expect((await r.json()).error).toContain('máximo');
  });
});
