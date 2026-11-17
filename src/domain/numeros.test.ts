import { describe, expect, it } from 'vitest';
import { aTexto, formatear, leerNumero, redondear, redondearArriba } from './numeros';

describe('leerNumero', () => {
  it('acepta coma o punto decimal', () => {
    expect(leerNumero('3,5')).toEqual({ tipo: 'numero', valor: 3.5 });
    expect(leerNumero('3.5')).toEqual({ tipo: 'numero', valor: 3.5 });
    expect(leerNumero(' 4 ')).toEqual({ tipo: 'numero', valor: 4 });
    expect(leerNumero('.5')).toEqual({ tipo: 'numero', valor: 0.5 });
    expect(leerNumero('5,')).toEqual({ tipo: 'numero', valor: 5 });
  });

  it('un texto vacío es «vacío», no cero', () => {
    expect(leerNumero('')).toEqual({ tipo: 'vacio' });
    expect(leerNumero('   ')).toEqual({ tipo: 'vacio' });
  });

  it('rechaza lo que no es un número simple', () => {
    for (const texto of ['abc', '3,5,2', '1e3', 'Infinity', '3 5', '--1', ',']) {
      expect(leerNumero(texto)).toEqual({ tipo: 'invalido' });
    }
  });

  it('lee negativos (la validación los rechaza después)', () => {
    expect(leerNumero('-1')).toEqual({ tipo: 'numero', valor: -1 });
  });
});

describe('formato', () => {
  it('aTexto usa coma decimal y deja vacío lo que no tiene valor', () => {
    expect(aTexto(3.5)).toBe('3,5');
    expect(aTexto(4)).toBe('4');
    expect(aTexto(null)).toBe('');
  });

  it('formatear muestra de 1 a 2 decimales en español de Colombia', () => {
    expect(formatear(3.456)).toBe('3,46');
    expect(formatear(4)).toBe('4,0');
    expect(formatear(3.5)).toBe('3,5');
  });
});

describe('redondeo', () => {
  it('redondear: mitad hacia arriba, sin fallar en 1,005 ni 2,675', () => {
    expect(redondear(1.005)).toBe(1.01);
    expect(redondear(2.675)).toBe(2.68);
    expect(redondear(2.994)).toBe(2.99);
  });

  it('redondearArriba: sube solo si realmente sobra algo', () => {
    expect(redondearArriba(2.771)).toBe(2.78);
    expect(redondearArriba(2.77)).toBe(2.77);
    expect(redondearArriba(3.9999999999999987)).toBe(4);
  });
});
