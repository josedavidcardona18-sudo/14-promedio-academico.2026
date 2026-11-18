import type { EstadoMateria, Simulacion } from '@/domain/calculo';
import { aTexto, formatear, redondear } from '@/domain/numeros';

export type Tono = 'exito' | 'aviso' | 'peligro' | 'info' | 'neutro';

export interface Mensaje {
  tono: Tono;
  icono: string;
  texto: string;
}

/** El icono acompaña al texto: el estado nunca se comunica solo con color. */
export const ESTADOS: Record<EstadoMateria, { texto: string; icono: string; tono: Tono }> = {
  'sin-notas': { texto: 'Sin notas', icono: '○', tono: 'neutro' },
  'en-curso': { texto: 'En curso', icono: '◔', tono: 'info' },
  asegurada: { texto: 'Aprobación asegurada', icono: '✓', tono: 'exito' },
  'sin-salida': { texto: 'Ya no alcanza para aprobar', icono: '!', tono: 'peligro' },
  aprobada: { texto: 'Aprobada', icono: '✓', tono: 'exito' },
  reprobada: { texto: 'Reprobada', icono: '✕', tono: 'peligro' },
};

export function porcentaje(valor: number): string {
  return `${aTexto(redondear(valor))} %`;
}

export function nombreDeCorte(posicion: number): string {
  return `Corte ${posicion + 1}`;
}

/** `corteUnico`: nombre del único corte que falta, si solo falta uno. */
export function mensajeSimulacion(
  simulacion: Simulacion,
  meta: number,
  corteUnico: string | undefined,
): Mensaje {
  const objetivo = formatear(meta);
  switch (simulacion.tipo) {
    case 'completa':
      return simulacion.alcanzada
        ? {
            tono: 'exito',
            icono: '✓',
            texto: `Ya tienes todas las notas: tu definitiva es ${formatear(simulacion.definitiva)} y alcanzas la meta de ${objetivo}.`,
          }
        : {
            tono: 'peligro',
            icono: '✕',
            texto: `Ya tienes todas las notas: tu definitiva es ${formatear(simulacion.definitiva)} y no alcanza la meta de ${objetivo}.`,
          };
    case 'asegurada':
      return {
        tono: 'exito',
        icono: '✓',
        texto: `Ya alcanzaste la meta de ${objetivo}: aunque saques 0 en lo que falta, la mantienes.`,
      };
    case 'imposible':
      return {
        tono: 'peligro',
        icono: '!',
        texto: `Ni con la nota máxima en lo que falta llegarías a ${objetivo}: lo máximo que puedes lograr es ${formatear(simulacion.maximoPosible)}.`,
      };
    case 'necesaria': {
      const requerida = formatear(simulacion.requerida);
      const peso = porcentaje(simulacion.pesoPendiente);
      const donde = corteUnico
        ? `en el ${corteUnico} (vale ${peso} de la nota)`
        : `de promedio en los ${simulacion.cortesPendientes} cortes que faltan (valen ${peso} de la nota)`;
      return {
        tono: 'info',
        icono: '→',
        texto: `Necesitas sacar al menos ${requerida} ${donde} para llegar a ${objetivo}.`,
      };
    }
  }
}
