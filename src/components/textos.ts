import { formatearNota, formatearPorcentaje } from '@/lib/formato';
import type { ResultadoMateria, Simulacion } from '@/services/promedios';

export type Tono = 'exito' | 'aviso' | 'peligro' | 'info' | 'neutro';

export interface Etiqueta {
  texto: string;
  icono: string;
  tono: Tono;
}

export interface Mensaje {
  tono: Tono;
  icono: string;
  texto: string;
}

/** El icono acompaña al texto: el estado nunca se comunica solo con color. */
export function describirEstado({ estado, definitiva, asegurada }: ResultadoMateria): Etiqueta {
  switch (estado) {
    case 'sin-notas':
      return { texto: 'Sin notas', icono: '○', tono: 'neutro' };
    case 'en-riesgo':
      return { texto: 'En riesgo', icono: '!', tono: 'aviso' };
    case 'perdida':
      return { texto: 'Perdida', icono: '✕', tono: 'peligro' };
    case 'aprobando': {
      const texto =
        definitiva !== null ? 'Aprobada' : asegurada ? 'Aprobación asegurada' : 'Aprobando';
      return { texto, icono: '✓', tono: 'exito' };
    }
  }
}

export function mensajeSimulacion(simulacion: Simulacion, meta: number): Mensaje {
  const objetivo = formatearNota(meta);
  switch (simulacion.tipo) {
    case 'completa':
      return simulacion.alcanzada
        ? {
            tono: 'exito',
            icono: '✓',
            texto: `Ya están todas las notas: tu definitiva es ${formatearNota(simulacion.definitiva)} y alcanzas la meta de ${objetivo}.`,
          }
        : {
            tono: 'peligro',
            icono: '✕',
            texto: `Ya están todas las notas: tu definitiva es ${formatearNota(simulacion.definitiva)} y no alcanza la meta de ${objetivo}.`,
          };
    case 'asegurada':
      return {
        tono: 'exito',
        icono: '✓',
        texto: `Ya alcanzaste la meta de ${objetivo}: aunque saques 0,0 en lo que falta, la mantienes.`,
      };
    case 'imposible':
      return {
        tono: 'peligro',
        icono: '!',
        texto: `La meta de ${objetivo} ya no es alcanzable: ni con 5,0 en lo que falta pasas de ${formatearNota(simulacion.maximoPosible)}.`,
      };
    case 'necesaria':
      return {
        tono: 'info',
        icono: '→',
        texto: `Necesitas al menos ${formatearNota(simulacion.requerida)} en el ${formatearPorcentaje(simulacion.pesoPendiente)} que falta para llegar a ${objetivo}.`,
      };
  }
}
