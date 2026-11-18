import { aDecimas, aGrado, divEntera } from './aritmetica';

export interface NotaCalculo {
  valor: number | null;
  porcentaje: number;
}

export type EstadoMateria = 'sin-notas' | 'aprobando' | 'en-riesgo' | 'perdida';

export interface ResultadoMateria {
  /** Puntos ya ganados (nota × porcentaje, sumados), truncados a 2 decimales. */
  acumulado: number;
  pesoEvaluado: number;
  pesoPendiente: number;
  /** Promedio de lo evaluado hasta ahora; null si todavía no hay notas. */
  promedioActual: number | null;
  /** Nota final: solo existe cuando ya está evaluado el 100 %. */
  definitiva: number | null;
  estado: EstadoMateria;
  /** Ya alcanzó 3,0 aunque falte evaluar: no puede perder la materia. */
  asegurada: boolean;
}

export type Simulacion =
  | { tipo: 'completa'; definitiva: number; alcanzada: boolean }
  | { tipo: 'asegurada' }
  | { tipo: 'necesaria'; requerida: number; pesoPendiente: number }
  | { tipo: 'imposible'; maximoPosible: number };

/** 100,0 % expresado en décimas de punto porcentual. */
const PESO_TOTAL = 1000;
/** 5,0 expresado en décimas de nota. */
const NOTA_MAXIMA = 50;
/** Para aprobar: 3,0 × 10 000 (décimas de nota × décimas de porcentaje, ver `sumar`). */
const UMBRAL_APROBAR = 30000;

interface Sumas {
  puntos: number;
  evaluado: number;
  pendiente: number;
}

/** `puntos` = Σ nota(décimas) × peso(décimas de %) ; 1 punto = 1/10 000 de nota. */
function sumar(notas: readonly NotaCalculo[]): Sumas {
  let puntos = 0;
  let evaluado = 0;
  for (const { valor, porcentaje } of notas) {
    if (valor === null) continue;
    const peso = aDecimas(porcentaje);
    puntos += aDecimas(valor) * peso;
    evaluado += peso;
  }
  return { puntos, evaluado, pendiente: Math.max(0, PESO_TOTAL - evaluado) };
}

const truncarACentesimas = (puntos: number): number => divEntera(puntos, 100);

/** Promedio de lo evaluado, en centésimas enteras (truncado, nunca aproximado hacia arriba). */
export function promedioEnCentesimas(notas: readonly NotaCalculo[]): number | null {
  const { puntos, evaluado } = sumar(notas);
  return evaluado === 0 ? null : divEntera(puntos * 10, evaluado);
}

function clasificar({ puntos, evaluado, pendiente }: Sumas): {
  estado: EstadoMateria;
  asegurada: boolean;
} {
  if (evaluado === 0) return { estado: 'sin-notas', asegurada: false };
  if (pendiente === 0) {
    return { estado: puntos >= UMBRAL_APROBAR ? 'aprobando' : 'perdida', asegurada: false };
  }
  if (puntos >= UMBRAL_APROBAR) return { estado: 'aprobando', asegurada: true };
  if (puntos + NOTA_MAXIMA * pendiente < UMBRAL_APROBAR) {
    return { estado: 'perdida', asegurada: false };
  }
  const promedio = divEntera(puntos * 10, evaluado);
  return { estado: promedio >= 300 ? 'aprobando' : 'en-riesgo', asegurada: false };
}

/** Todo con enteros; los resultados se truncan a 2 decimales para que lo que se ve coincida con lo que se decide. */
export function calcularMateria(notas: readonly NotaCalculo[]): ResultadoMateria {
  const sumas = sumar(notas);
  const promedio = promedioEnCentesimas(notas);
  const completa = sumas.evaluado > 0 && sumas.pendiente === 0;
  const acumulado = aGrado(truncarACentesimas(sumas.puntos));
  return {
    acumulado,
    pesoEvaluado: sumas.evaluado / 10,
    pesoPendiente: sumas.pendiente / 10,
    promedioActual: promedio === null ? null : aGrado(promedio),
    definitiva: completa ? acumulado : null,
    ...clasificar(sumas),
  };
}

/** ¿Qué nota necesito (en la décima siguiente, que es una nota válida) en lo pendiente para llegar a `meta`? */
export function simularNota(notas: readonly NotaCalculo[], meta: number): Simulacion {
  const { puntos, pendiente } = sumar(notas);
  const objetivo = aDecimas(meta) * 1000;
  if (pendiente === 0) {
    return {
      tipo: 'completa',
      definitiva: aGrado(truncarACentesimas(puntos)),
      alcanzada: puntos >= objetivo,
    };
  }
  if (puntos >= objetivo) return { tipo: 'asegurada' };
  const maximo = puntos + NOTA_MAXIMA * pendiente;
  if (maximo < objetivo) {
    return { tipo: 'imposible', maximoPosible: aGrado(truncarACentesimas(maximo)) };
  }
  // Redondeo hacia arriba en enteros: (a + b - 1) / b.
  const decimas = divEntera(objetivo - puntos + pendiente - 1, pendiente);
  return { tipo: 'necesaria', requerida: decimas / 10, pesoPendiente: pendiente / 10 };
}
