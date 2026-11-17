import { describe, expect, it } from 'vitest';
import { CONFIG, materiaDe } from './materia-de-prueba';
import { hayErrores, validarConfig, validarMateria } from './validacion';

describe('validarMateria', () => {
  it('una materia correcta no tiene errores', () => {
    const errores = validarMateria(materiaDe([3.5, null, 4]), CONFIG);
    expect(hayErrores(errores)).toBe(false);
  });

  it('exige un nombre de hasta 60 caracteres', () => {
    expect(validarMateria(materiaDe([], [], { nombre: '  ' }), CONFIG).nombre).toMatch(/nombre/i);
    const largo = 'x'.repeat(61);
    expect(validarMateria(materiaDe([], [], { nombre: largo }), CONFIG).nombre).toMatch(/60/);
  });

  it('los créditos son un entero entre 1 y 20', () => {
    for (const creditos of [0, 2.5, 21, -1]) {
      const errores = validarMateria(materiaDe([], [], { creditos }), CONFIG);
      expect(errores.creditos).toMatch(/entero entre 1 y 20/);
    }
    expect(validarMateria(materiaDe([], [], { creditos: 20 }), CONFIG).creditos).toBeUndefined();
  });

  it('los porcentajes deben sumar 100 y el error dice cuánto suman', () => {
    const errores = validarMateria(materiaDe([null, null], [30, 30]), CONFIG);
    expect(errores.pesos).toBe('Los porcentajes suman 60 %; deben sumar 100 %.');
  });

  it('cada porcentaje va de 0 a 100', () => {
    const errores = validarMateria(materiaDe([null, null], [-10, 110]), CONFIG);
    expect(errores.cortes['c1']?.peso).toMatch(/entre 0 y 100/);
    expect(errores.cortes['c2']?.peso).toMatch(/entre 0 y 100/);
  });

  it('cada nota va de 0 a la nota máxima; una nota vacía es válida', () => {
    const errores = validarMateria(materiaDe([5.1, -1, null]), CONFIG);
    expect(errores.cortes['c1']?.nota).toBe('La nota debe estar entre 0 y 5.');
    expect(errores.cortes['c2']?.nota).toMatch(/entre 0 y 5/);
    expect(errores.cortes['c3']?.nota).toBeUndefined();
  });

  it('tolera el ruido de coma flotante en la suma de porcentajes', () => {
    const errores = validarMateria(materiaDe([null, null, null], [33.3, 33.3, 33.4]), CONFIG);
    expect(errores.pesos).toBeUndefined();
  });
});

describe('validarConfig', () => {
  it('acepta la escala 0–5 con mínima 3 y la 0–10 con mínima 6', () => {
    expect(hayErrores(validarConfig(CONFIG))).toBe(false);
    expect(hayErrores(validarConfig({ notaMaxima: 10, notaMinima: 6 }))).toBe(false);
  });

  it('la nota máxima debe ser positiva y razonable', () => {
    expect(validarConfig({ notaMaxima: 0, notaMinima: 0 }).notaMaxima).toMatch(/mayor que 0/);
    expect(validarConfig({ notaMaxima: 5000, notaMinima: 3 }).notaMaxima).toMatch(/1000/);
  });

  it('la mínima para aprobar no puede superar la máxima', () => {
    expect(validarConfig({ notaMaxima: 5, notaMinima: 6 }).notaMinima).toMatch(/máxima/);
    expect(validarConfig({ notaMaxima: 5, notaMinima: 0 }).notaMinima).toMatch(/mayor que 0/);
  });
});
