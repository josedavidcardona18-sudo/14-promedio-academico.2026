import { describe, expect, it } from 'vitest';
import { CONFIG_INICIAL, LIMITES, estadoInicial } from './constantes';
import { CONFIG, materiaDe } from './materia-de-prueba';
import { crearMateria, reducir } from './reducer';
import type { Estado } from './tipos';

const conMateria = (): Estado => ({
  ...estadoInicial(),
  materias: [materiaDe([3.5, null, null])],
});

describe('crearMateria', () => {
  it('crea 3 cortes 30/30/40 sin notas', () => {
    const m = crearMateria('abc', 'Física', 4);
    expect(m).toMatchObject({ id: 'abc', nombre: 'Física', creditos: 4 });
    expect(m.cortes.map((c) => [c.id, c.peso, c.nota])).toEqual([
      ['c1', 30, null],
      ['c2', 30, null],
      ['c3', 40, null],
    ]);
  });

  it('quita espacios sobrantes del nombre', () => {
    expect(crearMateria('x', '  Física   II ', 3).nombre).toBe('Física II');
  });
});

describe('reducir', () => {
  it('agrega, actualiza y elimina materias', () => {
    let e = reducir(estadoInicial(), {
      tipo: 'agregar-materia',
      materia: crearMateria('a', 'A', 3),
    });
    expect(e.materias).toHaveLength(1);
    e = reducir(e, { tipo: 'actualizar-materia', id: 'a', nombre: ' Álgebra ', creditos: 5 });
    expect(e.materias[0]).toMatchObject({ nombre: 'Álgebra', creditos: 5 });
    e = reducir(e, { tipo: 'eliminar-materia', id: 'a' });
    expect(e.materias).toHaveLength(0);
  });

  it('pone una nota y la quita (null) sin mutar el estado anterior', () => {
    const antes = conMateria();
    const despues = reducir(antes, { tipo: 'poner-nota', materiaId: 'm1', corteId: 'c2', nota: 4 });
    expect(despues.materias[0]?.cortes[1]?.nota).toBe(4);
    expect(antes.materias[0]?.cortes[1]?.nota).toBeNull();
    const sin = reducir(despues, {
      tipo: 'poner-nota',
      materiaId: 'm1',
      corteId: 'c2',
      nota: null,
    });
    expect(sin.materias[0]?.cortes[1]?.nota).toBeNull();
  });

  it('cambia el porcentaje de un corte', () => {
    const e = reducir(conMateria(), {
      tipo: 'poner-peso',
      materiaId: 'm1',
      corteId: 'c1',
      peso: 25,
    });
    expect(e.materias[0]?.cortes[0]?.peso).toBe(25);
  });

  it('agrega un corte con id nuevo y peso 0, hasta el máximo', () => {
    let e = reducir(conMateria(), { tipo: 'agregar-corte', materiaId: 'm1' });
    expect(e.materias[0]?.cortes.at(-1)).toEqual({ id: 'c4', peso: 0, nota: null });
    for (let i = 0; i < 10; i++) e = reducir(e, { tipo: 'agregar-corte', materiaId: 'm1' });
    expect(e.materias[0]?.cortes).toHaveLength(LIMITES.maxCortes);
    const ids = e.materias[0]?.cortes.map((c) => c.id) ?? [];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no repite un id de corte aunque haya huecos en la numeración', () => {
    const base = conMateria();
    const conHueco: Estado = {
      ...base,
      materias: [
        materiaDe([null, null], [50, 50], {
          cortes: [
            { id: 'c1', peso: 50, nota: null },
            { id: 'c3', peso: 50, nota: null },
          ],
        }),
      ],
    };
    const e = reducir(conHueco, { tipo: 'agregar-corte', materiaId: 'm1' });
    expect(e.materias[0]?.cortes.map((c) => c.id)).toEqual(['c1', 'c3', 'c4']);
  });

  it('quita el último corte, pero deja siempre al menos uno', () => {
    let e = reducir(conMateria(), { tipo: 'quitar-corte', materiaId: 'm1' });
    expect(e.materias[0]?.cortes).toHaveLength(2);
    e = reducir(reducir(e, { tipo: 'quitar-corte', materiaId: 'm1' }), {
      tipo: 'quitar-corte',
      materiaId: 'm1',
    });
    expect(e.materias[0]?.cortes).toHaveLength(1);
  });

  it('cambia la escala de notas', () => {
    const e = reducir(estadoInicial(), {
      tipo: 'configurar',
      config: { notaMaxima: 10, notaMinima: 6 },
    });
    expect(e.config).toEqual({ notaMaxima: 10, notaMinima: 6 });
    expect(CONFIG_INICIAL).toEqual(CONFIG);
  });

  it('reemplaza todo el estado (cargar ejemplo, borrar todo)', () => {
    const nuevo = estadoInicial();
    expect(reducir(conMateria(), { tipo: 'reemplazar', estado: nuevo })).toBe(nuevo);
  });

  it('una acción sobre una materia que no existe devuelve el mismo estado', () => {
    const e = conMateria();
    expect(reducir(e, { tipo: 'poner-nota', materiaId: 'zzz', corteId: 'c1', nota: 1 })).toBe(e);
    expect(reducir(e, { tipo: 'eliminar-materia', id: 'zzz' }).materias).toHaveLength(1);
  });
});
