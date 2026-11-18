import { beforeEach, describe, expect, it } from 'vitest';
import { excedeLimite, reiniciarLimites } from './limite';

const limite = { maximo: 3, ventanaMs: 60_000 };

beforeEach(reiniciarLimites);

describe('excedeLimite', () => {
  it('deja pasar hasta el máximo y bloquea la siguiente', () => {
    const resultados = [1, 2, 3, 4].map(() => excedeLimite('ip:ruta', limite, 1000).excede);
    expect(resultados).toEqual([false, false, false, true]);
  });

  it('dice en cuántos segundos se puede reintentar', () => {
    for (let i = 0; i < 4; i++) excedeLimite('ip:ruta', limite, 0);
    expect(excedeLimite('ip:ruta', limite, 20_000)).toEqual({
      excede: true,
      reintentarEnSegundos: 40,
    });
  });

  it('cada clave cuenta aparte', () => {
    for (let i = 0; i < 4; i++) excedeLimite('a', limite, 0);
    expect(excedeLimite('b', limite, 0).excede).toBe(false);
  });

  it('al terminar la ventana el contador empieza de nuevo', () => {
    for (let i = 0; i < 4; i++) excedeLimite('a', limite, 0);
    expect(excedeLimite('a', limite, 60_001).excede).toBe(false);
  });

  it('no acumula claves viejas sin límite (se limpian las vencidas)', () => {
    for (let i = 0; i < 1100; i++) excedeLimite(`clave-${i}`, limite, 0);
    expect(excedeLimite('nueva', limite, 120_000).excede).toBe(false);
  });
});
