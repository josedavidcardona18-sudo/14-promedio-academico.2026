import { describe, expect, it } from 'vitest';
import { formatearNota, formatearPorcentaje } from './formato';

describe('formato', () => {
  it('las notas usan coma decimal y de 1 a 2 decimales', () => {
    expect(formatearNota(3.5)).toBe('3,5');
    expect(formatearNota(4)).toBe('4,0');
    expect(formatearNota(3.55)).toBe('3,55');
  });

  it('los porcentajes no muestran ceros de más', () => {
    expect(formatearPorcentaje(40)).toBe('40 %');
    expect(formatearPorcentaje(33.3)).toBe('33,3 %');
  });
});
