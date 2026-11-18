import { describe, expect, it } from 'vitest';
import { calcularMateria, type ResultadoMateria } from '@/services/promedios';
import { describirEstado, mensajeSimulacion } from './textos';

const estado = (notas: { valor: number | null; porcentaje: number }[]): ResultadoMateria =>
  calcularMateria(notas);

describe('describirEstado', () => {
  it('cada estado tiene texto, icono y tono: nunca solo color', () => {
    const casos = [
      estado([]),
      estado([{ valor: 2.5, porcentaje: 60 }]),
      estado([{ valor: 0, porcentaje: 80 }]),
      estado([{ valor: 4, porcentaje: 60 }]),
    ];
    const etiquetas = casos.map(describirEstado);
    expect(etiquetas.map((e) => e.texto)).toEqual([
      'Sin notas',
      'En riesgo',
      'Perdida',
      'Aprobando',
    ]);
    for (const e of etiquetas) expect(e.icono).not.toBe('');
  });

  it('distingue aprobación asegurada y materia ya aprobada', () => {
    expect(describirEstado(estado([{ valor: 5, porcentaje: 60 }])).texto).toBe(
      'Aprobación asegurada',
    );
    expect(describirEstado(estado([{ valor: 4, porcentaje: 100 }])).texto).toBe('Aprobada');
  });
});

describe('mensajeSimulacion', () => {
  it('necesaria: dice cuánto y en qué porcentaje (criterio de aceptación 1)', () => {
    const m = mensajeSimulacion({ tipo: 'necesaria', requerida: 2.3, pesoPendiente: 40 }, 3);
    expect(m.texto).toBe('Necesitas al menos 2,3 en el 40 % que falta para llegar a 3,0.');
    expect(m.tono).toBe('info');
  });

  it('imposible: avisa de que ya no es alcanzable (criterio de aceptación 3)', () => {
    const m = mensajeSimulacion({ tipo: 'imposible', maximoPosible: 4.1 }, 4.5);
    expect(m.texto).toContain('ya no es alcanzable');
    expect(m.texto).toContain('4,1');
    expect(m.tono).toBe('peligro');
  });

  it('asegurada y completa tienen mensaje y tono propios', () => {
    expect(mensajeSimulacion({ tipo: 'asegurada' }, 3).tono).toBe('exito');
    const ganada = mensajeSimulacion({ tipo: 'completa', definitiva: 3.55, alcanzada: true }, 3);
    const perdida = mensajeSimulacion({ tipo: 'completa', definitiva: 2.5, alcanzada: false }, 3);
    expect(ganada.texto).toContain('alcanzas la meta');
    expect(perdida.texto).toContain('no alcanza la meta');
  });
});
