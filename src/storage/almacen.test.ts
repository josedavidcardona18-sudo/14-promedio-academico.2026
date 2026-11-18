import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Cada prueba carga el módulo de cero para no heredar el modo «sin almacenamiento». */
async function cargarAlmacen() {
  vi.resetModules();
  return import('./almacen');
}

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('almacén con localStorage', () => {
  it('lee null si no hay nada, devuelve lo escrito y puede borrarlo', async () => {
    const { leer, escribir, borrar } = await cargarAlmacen();
    expect(leer('a')).toBeNull();
    escribir('a', '1');
    expect(leer('a')).toBe('1');
    expect(window.localStorage.getItem('a')).toBe('1');
    borrar('a');
    expect(leer('a')).toBeNull();
  });

  it('cada clave es independiente', async () => {
    const { leer, escribir } = await cargarAlmacen();
    escribir('a', '1');
    escribir('b', '2');
    expect([leer('a'), leer('b')]).toEqual(['1', '2']);
  });

  it('avisa a los suscritos al escribir o borrar, y deja de avisar al desuscribirse', async () => {
    const { escribir, borrar, suscribir } = await cargarAlmacen();
    const oyente = vi.fn();
    const baja = suscribir(oyente);
    escribir('a', '1');
    borrar('a');
    expect(oyente).toHaveBeenCalledTimes(2);
    baja();
    escribir('a', '2');
    expect(oyente).toHaveBeenCalledTimes(2);
  });

  it('avisa cuando otra pestaña cambia los datos', async () => {
    const { suscribir } = await cargarAlmacen();
    const oyente = vi.fn();
    const baja = suscribir(oyente);
    window.dispatchEvent(new StorageEvent('storage', { key: 'a' }));
    expect(oyente).toHaveBeenCalledTimes(1);
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
    expect(leer('a')).toBeNull();
  });

  it('si no se puede escribir, conserva los datos en memoria durante la sesión', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('sin espacio', 'QuotaExceededError');
    });
    const { leer, escribir, borrar, suscribir } = await cargarAlmacen();
    const oyente = vi.fn();
    suscribir(oyente);
    escribir('a', 'en-memoria');
    expect(leer('a')).toBe('en-memoria');
    borrar('a');
    expect(leer('a')).toBeNull();
    expect(oyente).toHaveBeenCalledTimes(2);
  });

  it('si no se puede borrar, el borrado igual se nota', async () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError');
    });
    const { leer, borrar } = await cargarAlmacen();
    borrar('a');
    expect(leer('a')).toBeNull();
  });
});
