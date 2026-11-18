// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pedir } from '@/app/api/pruebas-api';
import { reiniciarLimites } from '@/lib/limite';
import { DELETE, POST } from './route';

const auth = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  createSessionCookie: vi.fn(),
  verifySessionCookie: vi.fn(),
  revokeRefreshTokens: vi.fn(),
}));
vi.mock('@/lib/firebase-admin', () => ({ obtenerAuth: () => auth }));

const iniciar = (cuerpo: unknown, opciones: Parameters<typeof pedir>[1] = {}) =>
  POST(pedir('/api/auth/sesion', { metodo: 'POST', uid: null, cuerpo, ...opciones }), {});
const TOKEN = 'x'.repeat(40);

beforeEach(() => {
  reiniciarLimites();
  for (const f of Object.values(auth)) f.mockReset();
  vi.stubEnv('MODO_DEMO', '0');
});

describe('POST /api/auth/sesion', () => {
  it('201: entrega la cookie de sesión HttpOnly y la persona, y nunca el token', async () => {
    auth.verifyIdToken.mockResolvedValue({
      uid: 'ana',
      email: 'a@c.co',
      auth_time: Date.now() / 1000,
    });
    auth.createSessionCookie.mockResolvedValue('valor-de-la-cookie');
    const r = await iniciar({ idToken: TOKEN });
    expect(r.status).toBe(201);
    expect(await r.json()).toEqual({ uid: 'ana', correo: 'a@c.co', rol: 'estudiante' });
    const cookie = r.headers.get('set-cookie') ?? '';
    expect(cookie).toContain('sesion=valor-de-la-cookie');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).not.toContain(TOKEN);
    expect(r.headers.get('cache-control')).toBe('no-store');
  });

  it('401: token inválido, y no se crea ninguna cookie', async () => {
    auth.verifyIdToken.mockRejectedValue(new Error('auth/argument-error'));
    const r = await iniciar({ idToken: TOKEN });
    expect(r.status).toBe(401);
    expect(r.headers.get('set-cookie')).toBeNull();
  });

  it('400: sin token, con token corto o con campos de más', async () => {
    for (const cuerpo of [{}, { idToken: 'corto' }, { idToken: TOKEN, rol: 'admin' }]) {
      expect((await iniciar(cuerpo)).status, JSON.stringify(cuerpo)).toBe(400);
    }
  });

  it('403 desde otro origen (CSRF de inicio de sesión)', async () => {
    expect((await iniciar({ idToken: TOKEN }, { origen: 'https://malo.example' })).status).toBe(
      403,
    );
  });

  it('429 con Retry-After al pasar de 10 intentos por minuto', async () => {
    auth.verifyIdToken.mockRejectedValue(new Error('x'));
    let ultimo = await iniciar({ idToken: TOKEN }, { ip: '8.8.8.8' });
    for (let i = 0; i < 10; i++) ultimo = await iniciar({ idToken: TOKEN }, { ip: '8.8.8.8' });
    expect(ultimo.status).toBe(429);
    expect(Number(ultimo.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  it('en modo demostración no pide token ni crea cookie', async () => {
    vi.stubEnv('MODO_DEMO', '1');
    const r = await iniciar({});
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ uid: 'demo', demo: true });
    expect(r.headers.get('set-cookie')).toBeNull();
  });
});

describe('DELETE /api/auth/sesion', () => {
  const cerrar = (opciones: Parameters<typeof pedir>[1] = {}) =>
    DELETE(pedir('/api/auth/sesion', { metodo: 'DELETE', ...opciones }), {});

  it('204: revoca los tokens y borra la cookie', async () => {
    auth.verifySessionCookie.mockResolvedValue({ uid: 'ana' });
    const r = await cerrar({ uid: 'ana' });
    expect(r.status).toBe(204);
    expect(auth.revokeRefreshTokens).toHaveBeenCalledWith('ana');
    expect(r.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('204 también sin sesión (idempotente)', async () => {
    const r = await cerrar({ uid: null });
    expect(r.status).toBe(204);
    expect(auth.revokeRefreshTokens).not.toHaveBeenCalled();
  });

  it('403 desde otro origen: una página ajena no puede cerrarte la sesión', async () => {
    expect((await cerrar({ origen: 'https://malo.example' })).status).toBe(403);
  });
});
