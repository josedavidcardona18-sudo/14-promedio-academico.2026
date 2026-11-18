import { describe, expect, it } from 'vitest';
import { ESTADOS, mensajeSimulacion, nombreDeCorte, porcentaje } from './textos';

describe('textos', () => {
  it('cada estado tiene texto, icono y tono: nunca solo color', () => {
    for (const estado of Object.values(ESTADOS)) {
      expect(estado.texto.length).toBeGreaterThan(3);
      expect(estado.icono).not.toBe('');
    }
  });

  it('porcentaje usa coma decimal y no muestra ceros de más', () => {
    expect(porcentaje(40)).toBe('40 %');
    expect(porcentaje(33.3)).toBe('33,3 %');
  });

  it('nombreDeCorte numera desde 1', () => {
    expect(nombreDeCorte(0)).toBe('Corte 1');
  });
});

describe('mensajeSimulacion', () => {
  it('con un solo corte pendiente dice en cuál', () => {
    const m = mensajeSimulacion(
      { tipo: 'necesaria', requerida: 2.78, pesoPendiente: 40, cortesPendientes: 1 },
      3,
      'Corte 3',
    );
    expect(m.texto).toBe(
      'Necesitas sacar al menos 2,78 en el Corte 3 (vale 40 % de la nota) para llegar a 3,0.',
    );
    expect(m.tono).toBe('info');
  });

  it('con varios cortes pendientes habla de promedio', () => {
    const m = mensajeSimulacion(
      { tipo: 'necesaria', requerida: 2.58, pesoPendiente: 70, cortesPendientes: 2 },
      3,
      undefined,
    );
    expect(m.texto).toContain('de promedio en los 2 cortes que faltan (valen 70 % de la nota)');
  });

  it('asegurada, imposible y completa tienen tono y mensaje propios', () => {
    expect(mensajeSimulacion({ tipo: 'asegurada' }, 3, undefined).tono).toBe('exito');
    const imposible = mensajeSimulacion({ tipo: 'imposible', maximoPosible: 2.6 }, 3, undefined);
    expect(imposible.tono).toBe('peligro');
    expect(imposible.texto).toContain('2,6');
    const ganada = mensajeSimulacion(
      { tipo: 'completa', definitiva: 3.55, alcanzada: true },
      3,
      undefined,
    );
    const perdida = mensajeSimulacion(
      { tipo: 'completa', definitiva: 2.5, alcanzada: false },
      3,
      undefined,
    );
    expect(ganada.tono).toBe('exito');
    expect(perdida.texto).toContain('no alcanza la meta');
  });
});
