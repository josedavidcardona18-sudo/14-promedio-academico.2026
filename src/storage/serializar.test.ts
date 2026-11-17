import { describe, expect, it } from 'vitest';
import { estadoInicial } from '@/domain/constantes';
import { estadoDeEjemplo } from '@/domain/ejemplo';
import { deserializar, serializar } from './serializar';

describe('serializar / deserializar', () => {
  it('ida y vuelta sin perder nada', () => {
    const estado = estadoDeEjemplo();
    expect(deserializar(serializar(estado))).toEqual(estado);
  });

  it('sin nada guardado empieza vacío', () => {
    expect(deserializar(null)).toEqual(estadoInicial());
  });

  it('texto que no es JSON → empieza vacío, sin lanzar error', () => {
    expect(deserializar('{esto no es json')).toEqual(estadoInicial());
  });

  it('JSON de otra versión o de otra forma → empieza vacío', () => {
    const casos = [
      '[]',
      '"hola"',
      'null',
      JSON.stringify({ ...estadoInicial(), version: 2 }),
      JSON.stringify({ version: 1, config: { notaMaxima: '5', notaMinima: 3 }, materias: [] }),
      JSON.stringify({ version: 1, config: { notaMaxima: 5, notaMinima: 3 }, materias: {} }),
    ];
    for (const caso of casos) expect(deserializar(caso)).toEqual(estadoInicial());
  });

  it('rechaza materias o cortes mal formados', () => {
    const base = estadoDeEjemplo();
    const sinNombre = { ...base, materias: [{ ...base.materias[0], nombre: 5 }] };
    const notaTexto = {
      ...base,
      materias: [{ ...base.materias[0], cortes: [{ id: 'c1', peso: 100, nota: '4' }] }],
    };
    const pesoNulo = {
      ...base,
      materias: [{ ...base.materias[0], cortes: [{ id: 'c1', peso: null, nota: 4 }] }],
    };
    for (const malo of [sinNombre, notaTexto, pesoNulo]) {
      expect(deserializar(JSON.stringify(malo))).toEqual(estadoInicial());
    }
  });

  it('rechaza ids repetidos (romperían las listas de React)', () => {
    const base = estadoDeEjemplo();
    const [primera] = base.materias;
    const repetidas = { ...base, materias: [primera, primera] };
    expect(deserializar(JSON.stringify(repetidas))).toEqual(estadoInicial());
    const cortesRepetidos = {
      ...base,
      materias: [
        {
          ...primera,
          cortes: [
            { id: 'c1', peso: 50, nota: null },
            { id: 'c1', peso: 50, nota: null },
          ],
        },
      ],
    };
    expect(deserializar(JSON.stringify(cortesRepetidos))).toEqual(estadoInicial());
  });

  it('conserva notas fuera de rango: la validación las señalará, no se pierden', () => {
    const estado = estadoDeEjemplo();
    const [primera] = estado.materias;
    const conNotaAlta = {
      ...estado,
      materias: [{ ...primera, cortes: [{ id: 'c1', peso: 100, nota: 9 }] }],
    };
    expect(deserializar(JSON.stringify(conNotaAlta))).toEqual(conNotaAlta);
  });
});
