import { describe, expect, it } from 'vitest';
import { analizarMateria, resumirSemestre } from './calculo';
import { estadoDeEjemplo } from './ejemplo';
import { hayErrores } from './validacion';

describe('estadoDeEjemplo', () => {
  it('es válido y muestra materias en distintos estados', () => {
    const { materias, config } = estadoDeEjemplo();
    for (const materia of materias) {
      expect(hayErrores(analizarMateria(materia, config).errores)).toBe(false);
    }
    const { conteo, promedio } = resumirSemestre(materias, config);
    expect(conteo.aprobada).toBe(1);
    expect(conteo['en-curso']).toBe(3);
    expect(promedio).not.toBeNull();
  });

  it('cada llamada devuelve datos nuevos (no se comparten referencias)', () => {
    expect(estadoDeEjemplo().materias).not.toBe(estadoDeEjemplo().materias);
  });
});
