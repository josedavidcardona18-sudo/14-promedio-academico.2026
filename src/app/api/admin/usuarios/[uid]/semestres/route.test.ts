// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pedir, reiniciarEntorno } from '@/app/api/pruebas-api';

vi.mock(
  '@/lib/firebase-admin',
  async () => (await import('@/app/api/pruebas-api')).moduloFirebaseFalso,
);
vi.mock('@/repositories', async () => (await import('@/app/api/pruebas-api')).moduloRepositorios);

beforeEach(reiniciarEntorno);
import { GET } from './route';

const ver = (uid: string, opciones: Parameters<typeof pedir>[1] = {}, consulta = '') =>
  GET(pedir(`/api/admin/usuarios/${uid}/semestres${consulta}`, opciones), {
    params: Promise.resolve({ uid }),
  });

describe('GET /api/admin/usuarios/:uid/semestres', () => {
  it('200: el administrador ve los semestres de otra persona', async () => {
    const r = await ver('ana', { uid: 'root' });
    expect(r.status).toBe(200);
    expect((await r.json()).items.map((s: { id: string }) => s.id)).toEqual(['ejemplo']);
  });

  it('403: un estudiante no puede, ni siquiera sobre sí mismo', async () => {
    for (const uid of ['ana', 'beto']) {
      const r = await ver('ana', { uid });
      expect(r.status).toBe(403);
      expect(await r.json()).toEqual({ error: 'No tienes permiso para hacer esto.' });
    }
  });

  it('401 sin sesión; 400 con uid o consulta inválidos', async () => {
    expect((await ver('ana', { uid: null })).status).toBe(401);
    expect((await ver('a%20b', { uid: 'root' })).status).toBe(400);
    expect((await ver('ana', { uid: 'root' }, '?limite=0')).status).toBe(400);
  });
});
