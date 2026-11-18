import { describe, expect, it } from 'vitest';
import { resumirSemestre, type MateriaCalculo } from './semestre';

const m = (
  id: string,
  creditos: number,
  notas: { valor: number | null; porcentaje: number }[],
): MateriaCalculo => ({ id, nombre: id, creditos, notas });

describe('resumirSemestre', () => {
  const a = m('a', 3, [
    { valor: 4, porcentaje: 30 },
    { valor: 4, porcentaje: 30 },
  ]);
  const b = m('b', 2, [{ valor: 3, porcentaje: 100 }]);
  const c = m('c', 4, [{ valor: null, porcentaje: 100 }]);

  it('pondera por créditos solo las materias con notas', () => {
    const r = resumirSemestre([a, b, c], 3);
    expect(r.promedio).toBe(3.6);
    expect(r.creditosConNotas).toBe(5);
    expect(r.creditosTotales).toBe(9);
  });

  it('sin ninguna nota el promedio es null', () => {
    expect(resumirSemestre([c], 3).promedio).toBeNull();
    expect(resumirSemestre([], 3).promedio).toBeNull();
  });

  it('cuenta las materias por estado e incluye el resultado y la simulación de cada una', () => {
    const r = resumirSemestre([a, b, c], 3);
    expect(r.conteo).toEqual({ aprobando: 2, 'en-riesgo': 0, perdida: 0, 'sin-notas': 1 });
    expect(r.materias.map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(r.materias[0]?.simulacion).toEqual({
      tipo: 'necesaria',
      requerida: 1.5,
      pesoPendiente: 40,
    });
  });

  it('la meta del semestre cambia la nota necesaria de cada materia', () => {
    const r = resumirSemestre([a], 4);
    expect(r.meta).toBe(4);
    expect(r.materias[0]?.simulacion).toEqual({
      tipo: 'necesaria',
      requerida: 4,
      pesoPendiente: 40,
    });
  });

  it('no acumula error al ponderar: 3,3 y 4,4 con 1 y 2 créditos dan exactamente 4,03', () => {
    const r = resumirSemestre(
      [m('x', 1, [{ valor: 3.3, porcentaje: 100 }]), m('y', 2, [{ valor: 4.4, porcentaje: 100 }])],
      3,
    );
    expect(r.promedio).toBe(4.03);
  });
});
