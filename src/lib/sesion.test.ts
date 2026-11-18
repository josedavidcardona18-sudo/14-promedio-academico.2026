// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cabeceraDeCookie, crearSesion, revocarSesion } from './sesion';

const auth = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  createSessionCookie: vi.fn(),
  verifySessionCookie: vi.fn(),
  revokeRefreshTokens: vi.fn(),
}));
vi.mock('./firebase-admin', () => ({ obtenerAuth: () => auth }));

const AHORA_MS = 1_800_000_000_000;
const reciente = { uid: 'ana', email: 'ana@correo.co', auth_time: AHORA_MS / 1000 - 30 };

beforeEach(() => {
  for (const f of Object.values(auth)) f.mockReset();
});

describe('crearSesion', () => {
  it('cambia un token reciente por una cookie de sesión y devuelve la persona', async () => {
    auth.verifyIdToken.mockResolvedValue(reciente);
    auth.createSessionCookie.mockResolvedValue('cookie-firmada');
    const sesion = await crearSesion('token', AHORA_MS);
    expect(sesion).toEqual({
      cookie: 'cookie-firmada',
      usuario: { uid: 'ana', correo: 'ana@correo.co', rol: 'estudiante' },
    });
    expect(auth.verifyIdToken).toHaveBeenCalledWith('token', true);
    expect(auth.createSessionCookie).toHaveBeenCalledWith('token', { expiresIn: 432_000_000 });
  });

  it('401 si el token no es válido (sin repetir el motivo de Firebase)', async () => {
    auth.verifyIdToken.mockRejectedValue(new Error('auth/id-token-expired: detalle interno'));
    await expect(crearSesion('malo', AHORA_MS)).rejects.toMatchObject({
      status: 401,
      message: 'No pudimos verificar tu inicio de sesión. Inténtalo de nuevo.',
    });
    expect(auth.createSessionCookie).not.toHaveBeenCalled();
  });

  it('401 si el inicio de sesión tiene más de 5 minutos (token robado y guardado)', async () => {
    auth.verifyIdToken.mockResolvedValue({ ...reciente, auth_time: AHORA_MS / 1000 - 301 });
    await expect(crearSesion('viejo', AHORA_MS)).rejects.toMatchObject({ status: 401 });
    expect(auth.createSessionCookie).not.toHaveBeenCalled();
  });
});

describe('revocarSesion', () => {
  it('revoca los tokens de la persona dueña de la cookie', async () => {
    auth.verifySessionCookie.mockResolvedValue({ uid: 'ana' });
    await revocarSesion('cookie');
    expect(auth.revokeRefreshTokens).toHaveBeenCalledWith('ana');
  });

  it('sin cookie o con una cookie inválida no falla ni toca a nadie', async () => {
    await revocarSesion(null);
    auth.verifySessionCookie.mockRejectedValue(new Error('vencida'));
    await expect(revocarSesion('mala')).resolves.toBeUndefined();
    expect(auth.revokeRefreshTokens).not.toHaveBeenCalled();
  });
});

describe('cabeceraDeCookie', () => {
  it('en producción es HttpOnly, Secure y SameSite=Lax', () => {
    expect(cabeceraDeCookie('v', 100, true)).toBe(
      'sesion=v; Path=/; Max-Age=100; HttpOnly; SameSite=Lax; Secure',
    );
  });

  it('en desarrollo (http) omite Secure para que el navegador la acepte', () => {
    expect(cabeceraDeCookie('v', 100, false)).not.toContain('Secure');
  });

  it('Max-Age=0 la borra', () => {
    expect(cabeceraDeCookie('', 0, true)).toContain('Max-Age=0');
  });
});
