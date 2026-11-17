import { LIMITES } from './constantes';
import { aTexto, redondear } from './numeros';
import type { Config, Materia } from './tipos';

export interface ErroresCorte {
  peso?: string;
  nota?: string;
}

export interface ErroresMateria {
  nombre?: string;
  creditos?: string;
  pesos?: string;
  cortes: Record<string, ErroresCorte>;
}

export interface ErroresConfig {
  notaMaxima?: string;
  notaMinima?: string;
}

const TOLERANCIA_SUMA = 1e-6;

export function limpiarNombre(nombre: string): string {
  return nombre.replace(/\s+/g, ' ').trim();
}

export function validarNombre(nombre: string): string | undefined {
  const limpio = limpiarNombre(nombre);
  if (limpio === '') return 'Escribe el nombre de la materia.';
  if (limpio.length > LIMITES.maxNombre) {
    return `El nombre no puede pasar de ${LIMITES.maxNombre} caracteres.`;
  }
  return undefined;
}

export function validarCreditos(creditos: number): string | undefined {
  const valido = Number.isInteger(creditos) && creditos >= 1 && creditos <= LIMITES.maxCreditos;
  return valido
    ? undefined
    : `Los créditos deben ser un número entero entre 1 y ${LIMITES.maxCreditos}.`;
}

function validarPeso(peso: number): string | undefined {
  const valido = Number.isFinite(peso) && peso >= 0 && peso <= 100;
  return valido ? undefined : 'El porcentaje debe estar entre 0 y 100.';
}

function validarNota(nota: number | null, maxima: number): string | undefined {
  if (nota === null) return undefined;
  const valida = Number.isFinite(nota) && nota >= 0 && nota <= maxima;
  return valida ? undefined : `La nota debe estar entre 0 y ${aTexto(maxima)}.`;
}

function validarCortes(materia: Materia, maxima: number): Record<string, ErroresCorte> {
  const errores: Record<string, ErroresCorte> = {};
  for (const corte of materia.cortes) {
    const peso = validarPeso(corte.peso);
    const nota = validarNota(corte.nota, maxima);
    if (peso || nota) errores[corte.id] = { ...(peso && { peso }), ...(nota && { nota }) };
  }
  return errores;
}

function validarSuma(materia: Materia): string | undefined {
  const suma = materia.cortes.reduce((total, corte) => total + corte.peso, 0);
  if (Math.abs(suma - 100) < TOLERANCIA_SUMA) return undefined;
  return `Los porcentajes suman ${aTexto(redondear(suma))} %; deben sumar 100 %.`;
}

export function validarMateria(materia: Materia, config: Config): ErroresMateria {
  const cortes = validarCortes(materia, config.notaMaxima);
  const nombre = validarNombre(materia.nombre);
  const creditos = validarCreditos(materia.creditos);
  const hayErrorDePeso = Object.values(cortes).some((e) => e.peso);
  const pesos = hayErrorDePeso ? undefined : validarSuma(materia);
  return {
    ...(nombre && { nombre }),
    ...(creditos && { creditos }),
    ...(pesos && { pesos }),
    cortes,
  };
}

export function validarConfig(config: Config): ErroresConfig {
  const errores: ErroresConfig = {};
  const { notaMaxima, notaMinima } = config;
  if (!(notaMaxima > 0)) errores.notaMaxima = 'La nota máxima debe ser mayor que 0.';
  else if (notaMaxima > LIMITES.maxEscala) {
    errores.notaMaxima = `La nota máxima no puede pasar de ${LIMITES.maxEscala}.`;
  }
  if (!(notaMinima > 0)) errores.notaMinima = 'La nota mínima para aprobar debe ser mayor que 0.';
  else if (notaMinima > notaMaxima) {
    errores.notaMinima = 'La nota mínima para aprobar no puede superar la nota máxima.';
  }
  return errores;
}

export function hayErrores(errores: ErroresMateria | ErroresConfig): boolean {
  return Object.values(errores).some(
    (valor) =>
      typeof valor === 'string' || (typeof valor === 'object' && Object.keys(valor).length > 0),
  );
}
