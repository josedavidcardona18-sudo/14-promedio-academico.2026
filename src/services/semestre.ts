import { aGrado, divEntera } from './aritmetica';
import {
  calcularMateria,
  promedioEnCentesimas,
  simularNota,
  type EstadoMateria,
  type NotaCalculo,
  type ResultadoMateria,
  type Simulacion,
} from './promedios';

export interface MateriaCalculo {
  id: string;
  nombre: string;
  creditos: number;
  notas: readonly NotaCalculo[];
}

export interface ResumenMateria {
  id: string;
  nombre: string;
  creditos: number;
  resultado: ResultadoMateria;
  simulacion: Simulacion;
}

export interface ResumenSemestre {
  meta: number;
  /** Promedio ponderado por créditos de las materias con notas; null si no hay ninguna. */
  promedio: number | null;
  creditosConNotas: number;
  creditosTotales: number;
  conteo: Record<EstadoMateria, number>;
  materias: ResumenMateria[];
}

function conteoVacio(): Record<EstadoMateria, number> {
  return { 'sin-notas': 0, aprobando: 0, 'en-riesgo': 0, perdida: 0 };
}

/** Pura y sin efectos: se usa igual en el servidor (API) y en el navegador (estado derivado). */
export function resumirSemestre(
  materias: readonly MateriaCalculo[],
  meta: number,
): ResumenSemestre {
  const conteo = conteoVacio();
  let puntos = 0;
  let creditosConNotas = 0;
  let creditosTotales = 0;
  const resumenes = materias.map((materia): ResumenMateria => {
    const resultado = calcularMateria(materia.notas);
    conteo[resultado.estado] += 1;
    creditosTotales += materia.creditos;
    const promedio = promedioEnCentesimas(materia.notas);
    if (promedio !== null) {
      puntos += promedio * materia.creditos;
      creditosConNotas += materia.creditos;
    }
    return {
      id: materia.id,
      nombre: materia.nombre,
      creditos: materia.creditos,
      resultado,
      simulacion: simularNota(materia.notas, meta),
    };
  });
  return {
    meta,
    promedio: creditosConNotas > 0 ? aGrado(divEntera(puntos, creditosConNotas)) : null,
    creditosConNotas,
    creditosTotales,
    conteo,
    materias: resumenes,
  };
}
