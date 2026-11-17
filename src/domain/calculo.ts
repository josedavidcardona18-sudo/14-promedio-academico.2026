import { redondear, redondearArriba } from './numeros';
import type { Config, Materia } from './tipos';
import { hayErrores, validarMateria, type ErroresMateria } from './validacion';

export type EstadoMateria =
  'sin-notas' | 'en-curso' | 'asegurada' | 'sin-salida' | 'aprobada' | 'reprobada';

export interface ResultadoMateria {
  /** Puntos ya ganados, en la escala de la materia (nota × peso, sumados). */
  acumulado: number;
  pesoEvaluado: number;
  pesoPendiente: number;
  /** Promedio de lo evaluado hasta ahora; null si todavía no hay notas. */
  promedioActual: number | null;
  /** Nota final; solo existe cuando ya están todas las notas. */
  definitiva: number | null;
  estado: EstadoMateria;
}

export type Simulacion =
  | { tipo: 'completa'; definitiva: number; alcanzada: boolean }
  | { tipo: 'asegurada' }
  | { tipo: 'necesaria'; requerida: number; pesoPendiente: number; cortesPendientes: number }
  | { tipo: 'imposible'; maximoPosible: number };

export interface ResumenSemestre {
  promedio: number | null;
  creditosConNotas: number;
  creditosTotales: number;
  conteo: Record<EstadoMateria, number>;
  materiasConErrores: number;
}

/** Por debajo de este peso (en %) se considera que ya no queda nada por evaluar. */
const PESO_DESPRECIABLE = 1e-9;

function sumarPesos(materia: Materia) {
  let evaluado = 0;
  let pendiente = 0;
  let puntos = 0;
  for (const corte of materia.cortes) {
    if (corte.nota === null) pendiente += corte.peso;
    else {
      evaluado += corte.peso;
      puntos += corte.nota * corte.peso;
    }
  }
  return { evaluado, pendiente, acumulado: puntos / 100 };
}

function clasificar(acumulado: number, pendiente: number, config: Config): EstadoMateria {
  const { notaMinima, notaMaxima } = config;
  if (pendiente <= PESO_DESPRECIABLE) {
    return redondear(acumulado) >= notaMinima ? 'aprobada' : 'reprobada';
  }
  if (redondear(acumulado) >= notaMinima) return 'asegurada';
  const maximo = acumulado + (pendiente * notaMaxima) / 100;
  return redondear(maximo) < notaMinima ? 'sin-salida' : 'en-curso';
}

/** Supone una materia válida: úsela con `analizarMateria` o tras `validarMateria`. */
export function calcularMateria(materia: Materia, config: Config): ResultadoMateria {
  const { evaluado, pendiente, acumulado } = sumarPesos(materia);
  const sinNotas = evaluado <= PESO_DESPRECIABLE;
  const completa = pendiente <= PESO_DESPRECIABLE;
  return {
    acumulado,
    pesoEvaluado: evaluado,
    pesoPendiente: pendiente,
    promedioActual: sinNotas ? null : redondear((acumulado * 100) / evaluado),
    definitiva: completa && !sinNotas ? redondear(acumulado) : null,
    estado: sinNotas ? 'sin-notas' : clasificar(acumulado, pendiente, config),
  };
}

/** ¿Qué nota necesito en lo que falta para llegar a `meta`? */
export function simularNota(materia: Materia, config: Config, meta: number): Simulacion {
  const { pendiente, acumulado } = sumarPesos(materia);
  if (pendiente <= PESO_DESPRECIABLE) {
    const definitiva = redondear(acumulado);
    return { tipo: 'completa', definitiva, alcanzada: definitiva >= meta };
  }
  if (redondear(acumulado) >= meta) return { tipo: 'asegurada' };
  const maximo = acumulado + (pendiente * config.notaMaxima) / 100;
  if (redondear(maximo) < meta) return { tipo: 'imposible', maximoPosible: redondear(maximo) };
  // Se redondea hacia arriba: con esa nota la meta se alcanza sin depender de cómo aproxime cada institución.
  const exacta = redondearArriba(((meta - acumulado) * 100) / pendiente);
  return {
    tipo: 'necesaria',
    requerida: Math.min(exacta, config.notaMaxima),
    pesoPendiente: pendiente,
    cortesPendientes: materia.cortes.filter((c) => c.nota === null && c.peso > 0).length,
  };
}

export function analizarMateria(
  materia: Materia,
  config: Config,
): { errores: ErroresMateria; resultado: ResultadoMateria | null } {
  const errores = validarMateria(materia, config);
  return { errores, resultado: hayErrores(errores) ? null : calcularMateria(materia, config) };
}

function conteoVacio(): Record<EstadoMateria, number> {
  return {
    'sin-notas': 0,
    'en-curso': 0,
    asegurada: 0,
    'sin-salida': 0,
    aprobada: 0,
    reprobada: 0,
  };
}

export function resumirSemestre(materias: Materia[], config: Config): ResumenSemestre {
  const resumen: ResumenSemestre = {
    promedio: null,
    creditosConNotas: 0,
    creditosTotales: 0,
    conteo: conteoVacio(),
    materiasConErrores: 0,
  };
  let puntos = 0;
  for (const materia of materias) {
    const { resultado } = analizarMateria(materia, config);
    if (!resultado) {
      resumen.materiasConErrores += 1;
      continue;
    }
    resumen.creditosTotales += materia.creditos;
    resumen.conteo[resultado.estado] += 1;
    if (resultado.promedioActual === null) continue;
    resumen.creditosConNotas += materia.creditos;
    puntos += resultado.promedioActual * materia.creditos;
  }
  resumen.promedio =
    resumen.creditosConNotas > 0 ? redondear(puntos / resumen.creditosConNotas) : null;
  return resumen;
}
