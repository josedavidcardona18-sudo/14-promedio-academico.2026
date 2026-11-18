// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { USUARIO_DEMO, leerCookie, requerirUsuario } from './auth';

const cuentas = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  verifySessionCookie: vi.fn(),
}));
vi.mock('./firebase-admin', () => ({ obtenerAuth: () => cuentas }));

const pedir = (encabezados: Record<string, string> = {}) =>
  new Request('http://localhost/api/semestres', { headers: encabezados });

beforeEach(() => {
  vi.stubEnv('MODO_DEMO', '0');
  cuentas.verifyIdToken.mockReset();
  cuentas.verifySessionCookie.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe('requerirUsuario', () => {
  it('en modo demostración entrega el usuario de demostración sin consultar a Firebase', async () => {
    vi.stubEnv('MODO_DEMO', '1');
    expect(await requerirUsuario(pedir())).toEqual(USUARIO_DEMO);
    expect(cuentas.verifySessionCookie).not.toHaveBeenCalled();
  });

  it('401 sin cookie ni token', async () => {
    await expect(requerirUsuario(pedir())).rejects.toMatchObject({
      status: 401,
      message: 'Necesitas iniciar sesión.',
    });
  });

  it('con cookie de sesión válida devuelve el usuario y comprueba que no esté revocada', async () => {
    cuentas.verifySessionCookie.mockResolvedValue({ uid: 'ana', email: 'ana@correo.co' });
    const usuario = await requerirUsuario(pedir({ cookie: 'otra=1; sesion=abc.def; x=2' }));
    expect(usuario).toEqual({ uid: 'ana', correo: 'ana@correo.co', rol: 'estudiante' });
    expect(cuentas.verifySessionCookie).toHaveBeenCalledWith('abc.def', true);
  });

  it('el rol sale del custom claim; cualquier otro valor es estudiante', async () => {
    cuentas.verifySessionCookie.mockResolvedValueOnce({ uid: 'a', rol: 'admin' });
    expect((await requerirUsuario(pedir({ cookie: 'sesion=x' }))).rol).toBe('admin');
    cuentas.verifySessionCookie.mockResolvedValueOnce({ uid: 'b', rol: 'superusuario' });
    expect((await requerirUsuario(pedir({ cookie: 'sesion=x' }))).rol).toBe('estudiante');
  });

  it('acepta Authorization: Bearer para Bruno y Postman', async () => {
    cuentas.verifyIdToken.mockResolvedValue({ uid: 'beto' });
    const usuario = await requerirUsuario(pedir({ authorization: 'Bearer token-123' }));
    expect(usuario.uid).toBe('beto');
    expect(cuentas.verifyIdToken).toHaveBeenCalledWith('token-123', true);
  });

  it('una cookie inválida, vencida o revocada es un 401, no un 500', async () => {
    cuentas.verifySessionCookie.mockRejectedValue(new Error('auth/session-cookie-revoked'));
    await expect(requerirUsuario(pedir({ cookie: 'sesion=mala' }))).rejects.toMatchObject({
      status: 401,
    });
  });
});

describe('leerCookie', () => {
  it('encuentra la cookie entre varias y conserva los «=» del valor', () => {
    expect(leerCookie(pedir({ cookie: 'a=1; sesion=abc==; b=2' }), 'sesion')).toBe('abc==');
  });

  it('devuelve null si no está o está vacía', () => {
    expect(leerCookie(pedir(), 'sesion')).toBeNull();
    expect(leerCookie(pedir({ cookie: 'a=1' }), 'sesion')).toBeNull();
    expect(leerCookie(pedir({ cookie: 'sesion=' }), 'sesion')).toBeNull();
  });
});
