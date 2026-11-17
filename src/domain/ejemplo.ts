import { CONFIG_INICIAL } from './constantes';
import type { Estado } from './tipos';

/** Datos de muestra para probar la aplicación sin escribir nada. Cubre varios estados. */
export function estadoDeEjemplo(): Estado {
  const cortes = (notas: (number | null)[]) =>
    [30, 30, 40].map((peso, i) => ({ id: `c${i + 1}`, peso, nota: notas[i] ?? null }));
  return {
    version: 1,
    config: { ...CONFIG_INICIAL },
    materias: [
      {
        id: 'ej-calculo',
        nombre: 'Cálculo diferencial',
        creditos: 4,
        cortes: cortes([3.5, 2.8, null]),
      },
      { id: 'ej-web', nombre: 'Programación web', creditos: 3, cortes: cortes([4.5, 4.2, null]) },
      { id: 'ej-algebra', nombre: 'Álgebra lineal', creditos: 3, cortes: cortes([2, 2.4, null]) },
      { id: 'ej-ingles', nombre: 'Inglés II', creditos: 2, cortes: cortes([4, 3.8, 4.4]) },
    ],
  };
}
