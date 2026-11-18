// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pedir } from '@/app/api/pruebas-api';
import { GET } from './route';

vi.mock(
  '@/lib/firebase-admin',
  async () => (await import('@/app/api/pruebas-api')).moduloFirebaseFalso,
);

const yo = (opciones: Parameters<typeof pedir>[1] = {}) => GET(pedir('/api/auth/yo', opciones), {});

beforeEach(() => {
  vi.stubEnv('MODO_DEMO', '0');
});

describe('GET /api/auth/yo', () => {
  it('200: la persona de la sesión, con su rol', async () => {
    expect(await (await yo()).json()).toEqual({
      usuario: { uid: 'ana', correo: 'ana@correo.co', rol: 'estudiante' },
      demo: false,
    });
    expect((await (await yo({ uid: 'root' })).json()).usuario.rol).toBe('admin');
  });

  it('401 sin sesión, con sesión inválida o con Bearer inválido', async () => {
    expect((await yo({ uid: null })).status).toBe(401);
    expect((await yo({ uid: 'revocada' })).status).toBe(401);
    expect((await yo({ uid: null, bearer: 'falso' })).status).toBe(401);
  });

  it('200 con Bearer válido (Bruno, Postman)', async () => {
    expect((await (await yo({ uid: null, bearer: 'beto' })).json()).usuario.uid).toBe('beto');
  });

  it('en modo demostración responde con la persona de demostración', async () => {
    vi.stubEnv('MODO_DEMO', '1');
    expect(await (await yo({ uid: null })).json()).toMatchObject({
      usuario: { uid: 'demo' },
      demo: true,
    });
  });
});
