import { describe, expect, it } from 'vitest';
import { calcularMateria, resumirSemestre, simularNota } from './calculo';
import { CONFIG, materiaDe } from './materia-de-prueba';

describe('calcularMateria', () => {
  it('sin notas: no hay promedio y todo el peso está pendiente', () => {
    const r = calcularMateria(materiaDe([null, null, null]), CONFIG);
    expect(r).toMatchObject({
      estado: 'sin-notas',
      promedioActual: null,
      definitiva: null,
      pesoEvaluado: 0,
      pesoPendiente: 100,
    });
  });

  it('con una nota: el promedio actual es el de lo evaluado, no el de toda la materia', () => {
    const r = calcularMateria(materiaDe([4, null, null]), CONFIG);
    expect(r.acumulado).toBeCloseTo(1.2);
    expect(r.promedioActual).toBe(4);
    expect(r.pesoEvaluado).toBe(30);
    expect(r.estado).toBe('en-curso');
  });

  it('con todas las notas: calcula la definitiva ponderada y aprueba', () => {
    const r = calcularMateria(materiaDe([3.5, 3, 4]), CONFIG);
    expect(r.definitiva).toBe(3.55);
    expect(r.estado).toBe('aprobada');
  });

  it('con todas las notas: reprueba si queda por debajo de la mínima', () => {
    const r = calcularMateria(materiaDe([2, 2, 2]), CONFIG);
    expect(r.definitiva).toBe(2);
    expect(r.estado).toBe('reprobada');
  });

  it('aprueba justo en la mínima aunque haya ruido de coma flotante', () => {
    const r = calcularMateria(materiaDe([3, 3, 3], [10, 20, 70]), CONFIG);
    expect(r.definitiva).toBe(3);
    expect(r.estado).toBe('aprobada');
  });

  it('aproxima la definitiva a 2 decimales (mitad hacia arriba) antes de comparar', () => {
    const r = calcularMateria(materiaDe([2.99, 3], [50, 50]), CONFIG);
    expect(r.definitiva).toBe(3);
    expect(r.estado).toBe('aprobada');
  });

  it('asegurada: ya alcanzó la mínima aunque falte un corte', () => {
    expect(calcularMateria(materiaDe([5, 5, null]), CONFIG).estado).toBe('asegurada');
  });

  it('sin salida: ni con el máximo en lo que falta llega a la mínima', () => {
    expect(calcularMateria(materiaDe([0, 0, null]), CONFIG).estado).toBe('sin-salida');
  });

  it('en curso: todavía puede aprobar', () => {
    expect(calcularMateria(materiaDe([2.5, 2.5, null]), CONFIG).estado).toBe('en-curso');
  });

  it('un corte pendiente de peso 0 no impide tener definitiva', () => {
    const r = calcularMateria(materiaDe([4, 4, null], [50, 50, 0]), CONFIG);
    expect(r.definitiva).toBe(4);
    expect(r.estado).toBe('aprobada');
  });
});

describe('simularNota', () => {
  it('calcula la nota que falta con la meta por defecto (mínima para aprobar)', () => {
    const s = simularNota(materiaDe([3.5, 2.8, null]), CONFIG, CONFIG.notaMinima);
    expect(s).toEqual({
      tipo: 'necesaria',
      requerida: 2.78,
      pesoPendiente: 40,
      cortesPendientes: 1,
    });
  });

  it('redondea hacia arriba para que la nota sí alcance (no 2,77)', () => {
    const s = simularNota(materiaDe([3.5, 2.8, null]), CONFIG, 3);
    expect(s.tipo === 'necesaria' && s.requerida).toBe(2.78);
  });

  it('no sube un centésimo de más por ruido de coma flotante (meta 4,0)', () => {
    const s = simularNota(materiaDe([4, 4, null]), CONFIG, 4);
    expect(s.tipo === 'necesaria' && s.requerida).toBe(4);
  });

  it('reparte entre varios cortes pendientes: es un promedio sobre lo que falta', () => {
    const s = simularNota(materiaDe([4, null, null]), CONFIG, 3);
    expect(s).toEqual({
      tipo: 'necesaria',
      requerida: 2.58,
      pesoPendiente: 70,
      cortesPendientes: 2,
    });
  });

  it('asegurada: la meta ya está garantizada', () => {
    expect(simularNota(materiaDe([5, 5, null]), CONFIG, 3)).toEqual({ tipo: 'asegurada' });
  });

  it('imposible: informa el máximo que todavía se puede lograr', () => {
    const s = simularNota(materiaDe([1, 1, null]), CONFIG, 3);
    expect(s).toEqual({ tipo: 'imposible', maximoPosible: 2.6 });
  });

  it('una meta más alta que la mínima exige más', () => {
    const s = simularNota(materiaDe([3.5, 2.8, null]), CONFIG, 3.5);
    expect(s.tipo === 'necesaria' && s.requerida).toBe(4.03);
  });

  it('una meta por encima de lo alcanzable es imposible', () => {
    const s = simularNota(materiaDe([3.5, 2.8, null]), CONFIG, 4.5);
    expect(s).toEqual({ tipo: 'imposible', maximoPosible: 3.89 });
  });

  it('completa: no hay nada que simular, solo comparar con la meta', () => {
    expect(simularNota(materiaDe([3.5, 3, 4]), CONFIG, 3)).toEqual({
      tipo: 'completa',
      definitiva: 3.55,
      alcanzada: true,
    });
    expect(simularNota(materiaDe([3.5, 3, 4]), CONFIG, 4)).toMatchObject({ alcanzada: false });
  });
});

describe('resumirSemestre', () => {
  const a = materiaDe([4, 4, null], [30, 30, 40], { id: 'a', creditos: 3 });
  const b = materiaDe([3, 3, 3], [30, 30, 40], { id: 'b', creditos: 2 });
  const c = materiaDe([null, null, null], [30, 30, 40], { id: 'c', creditos: 4 });

  it('pondera por créditos solo las materias con notas', () => {
    const r = resumirSemestre([a, b, c], CONFIG);
    expect(r.promedio).toBe(3.6);
    expect(r.creditosConNotas).toBe(5);
    expect(r.creditosTotales).toBe(9);
  });

  it('sin ninguna nota el promedio es null', () => {
    expect(resumirSemestre([c], CONFIG).promedio).toBeNull();
    expect(resumirSemestre([], CONFIG).promedio).toBeNull();
  });

  it('cuenta las materias por estado', () => {
    const r = resumirSemestre([a, b, c], CONFIG);
    expect(r.conteo).toMatchObject({ aprobada: 1, 'en-curso': 1, asegurada: 0, 'sin-notas': 1 });
  });

  it('ignora las materias con datos inválidos y las cuenta aparte', () => {
    const mala = materiaDe([9, null, null], [30, 30, 40], { id: 'x', creditos: 5 });
    const r = resumirSemestre([a, mala], CONFIG);
    expect(r.promedio).toBe(4);
    expect(r.materiasConErrores).toBe(1);
  });
});
