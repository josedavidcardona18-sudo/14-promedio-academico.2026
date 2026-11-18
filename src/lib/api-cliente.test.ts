import { afterEach, describe, expect, it, vi } from 'vitest';
import { SEMESTRE_DE_EJEMPLO } from '@/repositories/ejemplo';
import { ErrorDeApi, pedirSemestre } from './api-cliente';

const responder = (cuerpo: unknown, estado = 200) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(cuerpo), { status: estado })),
  );

afterEach(() => vi.unstubAllGlobals());

describe('pedirSemestre', () => {
  it('devuelve el semestre cuando cumple el esquema y pide la ruta correcta', async () => {
    responder(SEMESTRE_DE_EJEMPLO);
    expect(await pedirSemestre('ejemplo')).toEqual(SEMESTRE_DE_EJEMPLO);
    expect(fetch).toHaveBeenCalledWith('/api/semestres/ejemplo', { signal: undefined });
  });

  it('codifica el identificador para no alterar la ruta', async () => {
    responder(SEMESTRE_DE_EJEMPLO);
    await pedirSemestre('a/../b');
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe('/api/semestres/a%2F..%2Fb');
  });

  it('404 → «No encontramos ese semestre.»', async () => {
    responder({ error: 'Semestre no encontrado.' }, 404);
    await expect(pedirSemestre('x')).rejects.toMatchObject({
      message: 'No encontramos ese semestre.',
      estado: 404,
    });
  });

  it('500 → mensaje para la persona, sin detalles internos', async () => {
    responder({ error: 'Error interno.' }, 500);
    await expect(pedirSemestre('x')).rejects.toThrow('El servidor no pudo entregar los datos');
  });

  it('una respuesta con otra forma se rechaza (el cliente también valida)', async () => {
    responder({ id: 'ejemplo' });
    await expect(pedirSemestre('ejemplo')).rejects.toThrow('formato esperado');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no es json', { status: 200 })));
    await expect(pedirSemestre('ejemplo')).rejects.toThrow('formato esperado');
  });

  it('sin red → mensaje de conexión', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = await pedirSemestre('ejemplo').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorDeApi);
    expect(error).toMatchObject({
      estado: null,
      message: expect.stringContaining('No hay conexión'),
    });
  });

  it('una petición cancelada no se disfraza de error de red', async () => {
    const control = new AbortController();
    control.abort();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('abortada', 'AbortError')));
    await expect(pedirSemestre('ejemplo', control.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
