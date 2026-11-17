import type { Config, Estado } from './tipos';

export const LIMITES = {
  maxCortes: 8,
  maxCreditos: 20,
  maxNombre: 60,
  maxEscala: 1000,
} as const;

export const CONFIG_INICIAL: Config = { notaMaxima: 5, notaMinima: 3 };

export function estadoInicial(): Estado {
  return { version: 1, config: { ...CONFIG_INICIAL }, materias: [] };
}
