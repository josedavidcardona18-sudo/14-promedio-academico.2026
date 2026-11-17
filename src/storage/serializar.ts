import { estadoInicial } from '@/domain/constantes';
import type { Config, Corte, Estado, Materia } from '@/domain/tipos';

export function serializar(estado: Estado): string {
  return JSON.stringify(estado);
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esNumero(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor);
}

function sinRepetidos(ids: string[]): boolean {
  return new Set(ids).size === ids.length;
}

function esCorte(valor: unknown): valor is Corte {
  return (
    esObjeto(valor) &&
    typeof valor.id === 'string' &&
    esNumero(valor.peso) &&
    (valor.nota === null || esNumero(valor.nota))
  );
}

function esMateria(valor: unknown): valor is Materia {
  return (
    esObjeto(valor) &&
    typeof valor.id === 'string' &&
    typeof valor.nombre === 'string' &&
    esNumero(valor.creditos) &&
    Array.isArray(valor.cortes) &&
    valor.cortes.every(esCorte) &&
    sinRepetidos(valor.cortes.map((corte) => corte.id))
  );
}

function esConfig(valor: unknown): valor is Config {
  return esObjeto(valor) && esNumero(valor.notaMaxima) && esNumero(valor.notaMinima);
}

function esEstado(valor: unknown): valor is Estado {
  return (
    esObjeto(valor) &&
    valor.version === 1 &&
    esConfig(valor.config) &&
    Array.isArray(valor.materias) &&
    valor.materias.every(esMateria) &&
    sinRepetidos(valor.materias.map((materia) => materia.id))
  );
}

/**
 * Lee lo guardado. Lo que viene de `localStorage` no es de fiar (otra versión, edición a mano,
 * datos corruptos): si no tiene la forma esperada se empieza de cero en vez de romper la página.
 */
export function deserializar(crudo: string | null): Estado {
  if (crudo === null) return estadoInicial();
  try {
    const dato: unknown = JSON.parse(crudo);
    return esEstado(dato) ? dato : estadoInicial();
  } catch {
    return estadoInicial();
  }
}
