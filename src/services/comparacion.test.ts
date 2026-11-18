import { describe, expect, it } from 'vitest';
import { diferenciaDePromedios, tendenciaDe } from './comparacion';

describe('diferenciaDePromedios', () => {
  it('resta en centésimas, sin ruido de coma flotante (3,3 − 3,1 es 0,20, no 0,19999)', () => {
    expect(diferenciaDePromedios(3.3, 3.1)).toBe(20);
    expect(diferenciaDePromedios(3.37, 3.12)).toBe(25);
    expect(diferenciaDePromedios(2.9, 3.4)).toBe(-50);
    expect(diferenciaDePromedios(3.5, 3.5)).toBe(0);
  });

  it('si algún semestre no tiene notas no hay comparación', () => {
    expect(diferenciaDePromedios(null, 3)).toBeNull();
    expect(diferenciaDePromedios(3, null)).toBeNull();
  });
});

describe('tendenciaDe', () => {
  it('sube, baja o igual', () => {
    expect([tendenciaDe(1), tendenciaDe(-1), tendenciaDe(0)]).toEqual(['sube', 'baja', 'igual']);
  });
});
