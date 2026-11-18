import { describe, expect, it } from 'vitest';
import { erroresPorCampo } from './errores';
import { materiaEntradaSchema } from './semestre';

const parsear = (entrada: unknown) => materiaEntradaSchema.safeParse(entrada).error;

describe('erroresPorCampo', () => {
  it('sin error devuelve un objeto vacío', () => {
    expect(erroresPorCampo(undefined)).toEqual({});
  });

  it('indexa cada mensaje por la ruta del campo', () => {
    const errores = erroresPorCampo(
      parsear({
        nombre: 'Física',
        creditos: 3,
        notas: [{ nombre: 'Parcial', valor: 5.5, porcentaje: 30 }],
      }),
    );
    expect(errores).toEqual({ 'notas.0.valor': 'La nota no puede pasar de 5,0.' });
  });

  it('el error de la suma de porcentajes queda en la ruta «notas»', () => {
    const errores = erroresPorCampo(
      parsear({
        nombre: 'Física',
        creditos: 3,
        notas: [
          { nombre: 'A', valor: 4, porcentaje: 60 },
          { nombre: 'B', valor: 3, porcentaje: 50 },
        ],
      }),
    );
    expect(errores).toEqual({ notas: 'Los porcentajes suman 110 %; no pueden pasar de 100 %.' });
  });

  it('si un campo tiene varios errores se queda con el primero', () => {
    const errores = erroresPorCampo(
      parsear({ nombre: '', creditos: 0, notas: [{ nombre: ' ', valor: 1, porcentaje: 1 }] }),
    );
    expect(errores['nombre']).toBe('Escribe el nombre de la materia.');
    expect(errores['creditos']).toBe('Mínimo 1 crédito.');
    expect(errores['notas.0.nombre']).toBe('Escribe el nombre de la nota.');
  });
});
