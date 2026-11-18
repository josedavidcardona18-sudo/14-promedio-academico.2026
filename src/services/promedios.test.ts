import { describe, expect, it } from 'vitest';
import { calcularMateria, simularNota, type NotaCalculo } from './promedios';

const n = (valor: number | null, porcentaje: number): NotaCalculo => ({ valor, porcentaje });

describe('calcularMateria', () => {
  it('sin notas: no hay promedio y todo el peso está pendiente', () => {
    expect(calcularMateria([n(null, 30), n(null, 70)])).toMatchObject({
      estado: 'sin-notas',
      promedioActual: null,
      definitiva: null,
      pesoEvaluado: 0,
      pesoPendiente: 100,
    });
  });

  it('el promedio actual es el de lo evaluado y lo no registrado cuenta como pendiente', () => {
    const r = calcularMateria([n(4, 30), n(3, 30)]);
    expect(r.promedioActual).toBe(3.5);
    expect(r.acumulado).toBe(2.1);
    expect(r.pesoEvaluado).toBe(60);
    expect(r.pesoPendiente).toBe(40);
    expect(r.definitiva).toBeNull();
  });

  it('con todo evaluado calcula la definitiva ponderada', () => {
    const r = calcularMateria([n(3.5, 30), n(3, 30), n(4, 40)]);
    expect(r.definitiva).toBe(3.55);
    expect(r.pesoPendiente).toBe(0);
  });

  it('una nota registrada sin valor sigue siendo peso pendiente', () => {
    const r = calcularMateria([n(4, 30), n(null, 70)]);
    expect(r.pesoEvaluado).toBe(30);
    expect(r.pesoPendiente).toBe(70);
  });

  it('trunca a 2 decimales sin aproximar hacia arriba (2,996 se ve 2,99, no 3,00)', () => {
    // Lo evaluado promedia (2,9 × 50 + 3,1 × 49,9) ÷ 99,9 = 2,9998…; redondeado daría 3,00.
    const r = calcularMateria([n(2.9, 50), n(3.1, 49.9), n(null, 0.1)]);
    expect(r.promedioActual).toBe(2.99);
  });
});

describe('calcularMateria · estados (aprobando, en riesgo, perdida)', () => {
  it('aprobando: lo evaluado promedia 3,0 o más', () => {
    expect(calcularMateria([n(4, 30), n(3.5, 30)]).estado).toBe('aprobando');
  });

  it('en riesgo: promedia menos de 3,0 pero todavía se puede aprobar', () => {
    expect(calcularMateria([n(2.5, 30), n(2.5, 30)]).estado).toBe('en-riesgo');
  });

  it('perdida: ni con 5,0 en lo que falta se llega a 3,0', () => {
    expect(calcularMateria([n(0, 50), n(0, 30)]).estado).toBe('perdida');
  });

  it('asegurada: ya tiene 3,0 aunque falte evaluar', () => {
    const r = calcularMateria([n(5, 60)]);
    expect(r.estado).toBe('aprobando');
    expect(r.asegurada).toBe(true);
  });

  it('cerrada: con todo evaluado decide por la definitiva, justo en 3,0 aprueba', () => {
    expect(calcularMateria([n(3, 100)]).estado).toBe('aprobando');
    expect(calcularMateria([n(2.9, 100)]).estado).toBe('perdida');
  });
});

describe('simularNota · tabla de 6 casos', () => {
  it('1. criterio del documento: 4,0 (30 %) y 3,0 (30 %) → 2,3 en el 40 % restante', () => {
    expect(simularNota([n(4, 30), n(3, 30)], 3)).toEqual({
      tipo: 'necesaria',
      requerida: 2.3,
      pesoPendiente: 40,
    });
  });

  it('2. sin errores de coma flotante: 3,3 y 2,7 al 30 % piden exactamente 3,0 (no 3,1)', () => {
    expect(simularNota([n(3.3, 30), n(2.7, 30)], 3)).toEqual({
      tipo: 'necesaria',
      requerida: 3,
      pesoPendiente: 40,
    });
  });

  it('3. meta más alta: para llegar a 3,4 hacen falta 3,25, que sube a la décima siguiente (3,3)', () => {
    const s = simularNota([n(4, 30), n(3, 30)], 3.4);
    expect(s).toEqual({ tipo: 'necesaria', requerida: 3.3, pesoPendiente: 40 });
  });

  it('4. no alcanzable: la nota necesaria sería mayor que 5,0 (criterio del documento)', () => {
    expect(simularNota([n(4, 30), n(3, 30)], 4.5)).toEqual({
      tipo: 'imposible',
      maximoPosible: 4.1,
    });
  });

  it('5. ya asegurada: con 5,0 al 60 % la meta de 3,0 está cumplida', () => {
    expect(simularNota([n(5, 60)], 3)).toEqual({ tipo: 'asegurada' });
  });

  it('6. todo evaluado: solo compara la definitiva con la meta', () => {
    expect(simularNota([n(3.5, 30), n(3, 30), n(4, 40)], 3)).toEqual({
      tipo: 'completa',
      definitiva: 3.55,
      alcanzada: true,
    });
    expect(simularNota([n(3.5, 30), n(3, 30), n(4, 40)], 4)).toMatchObject({ alcanzada: false });
  });

  it('sin ninguna nota pide el promedio de la meta sobre todo el peso', () => {
    expect(simularNota([], 3)).toEqual({ tipo: 'necesaria', requerida: 3, pesoPendiente: 100 });
  });

  it('una meta de 3,0 con 2,0 al 100 % ya está perdida', () => {
    expect(simularNota([n(2, 100)], 3)).toMatchObject({ tipo: 'completa', alcanzada: false });
  });
});
