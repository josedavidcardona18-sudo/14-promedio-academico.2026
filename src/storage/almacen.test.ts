import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CLAVE = 'promedio-academico:v1';

/** Cada prueba carga el módulo de cero para no heredar el modo «sin almacenamiento». */
async function cargarAlmacen() {
  vi.resetModules();
  return import('./almacen');
}

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('almacén con localStorage', () => {
  it('lee null si no hay nada y devuelve lo que se escribe', async () => {
    const { leer, escribir } = await cargarAlmacen();
    expect(leer()).toBeNull();
    escribir('{"a":1}');
    expect(leer()).toBe('{"a":1}');
    expect(window.localStorage.getItem(CLAVE)).toBe('{"a":1}');
  });

  it('avisa a los suscritos al escribir y deja de avisar al desuscribirse', async () => {
    const { escribir, suscribir } = await cargarAlmacen();
    const oyente = vi.fn();
    const baja = suscribir(oyente);
    escribir('1');
    expect(oyente).toHaveBeenCalledTimes(1);
    baja();
    escribir('2');
    expect(oyente).toHaveBeenCalledTimes(1);
  });

  it('avisa cuando otra pestaña cambia los datos, y solo por nuestra clave', async () => {
    const { suscribir } = await cargarAlmacen();
    const oyente = vi.fn();
    const baja = suscribir(oyente);
    window.dispatchEvent(new StorageEvent('storage', { key: CLAVE }));
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'otra-app' }));
    expect(oyente).toHaveBeenCalledTimes(2);
    baja();
  });

  it('no deja escuchas colgadas cuando ya nadie está suscrito', async () => {
    const { suscribir } = await cargarAlmacen();
    const quitar = vi.spyOn(window, 'removeEventListener');
    suscribir(() => undefined)();
    expect(quitar).toHaveBeenCalledWith('storage', expect.any(Function));
  });
});

describe('almacén cuando el navegador bloquea localStorage', () => {
  it('si no se puede leer, devuelve null en vez de lanzar error', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError');
    });
    const { leer } = await cargarAlmacen();
    expect(leer()).toBeNull();
  });

  it('si no se puede escribir, conserva los datos en memoria durante la sesión', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('sin espacio', 'QuotaExceededError');
    });
    const { leer, escribir, suscribir } = await cargarAlmacen();
    const oyente = vi.fn();
    suscribir(oyente);
    escribir('en-memoria');
    expect(leer()).toBe('en-memoria');
    expect(oyente).toHaveBeenCalled();
  });
});
