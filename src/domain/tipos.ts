/** Escala de notas: la nota máxima posible y la mínima para aprobar. */
export interface Config {
  notaMaxima: number;
  notaMinima: number;
}

/** Un corte evaluativo: pesa un porcentaje de la nota final y tiene una nota (o aún no). */
export interface Corte {
  id: string;
  peso: number;
  nota: number | null;
}

export interface Materia {
  id: string;
  nombre: string;
  creditos: number;
  cortes: Corte[];
}

export interface Estado {
  version: 1;
  config: Config;
  materias: Materia[];
}
