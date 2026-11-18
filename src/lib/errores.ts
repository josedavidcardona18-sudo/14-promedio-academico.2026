import type { ZodError } from 'zod';

export interface DetalleError {
  campo: string;
  mensaje: string;
}

/** Un error que la API sabe explicar: lleva su código HTTP y, si hace falta, el detalle por campo. */
export class ErrorHttp extends Error {
  readonly status: number;
  readonly detalles: DetalleError[] | undefined;

  constructor(status: number, mensaje: string, detalles?: DetalleError[]) {
    super(mensaje);
    this.name = 'ErrorHttp';
    this.status = status;
    this.detalles = detalles;
  }
}

export const noEncontrado = (mensaje: string) => new ErrorHttp(404, mensaje);

export const peticionInvalida = (detalles: DetalleError[]) =>
  new ErrorHttp(400, 'Datos inválidos.', detalles);

/** `campo` se usa cuando el error no trae una ruta propia (p. ej. un parámetro suelto). */
export function detallesDeZod(error: ZodError, campo: string): DetalleError[] {
  return error.issues.map((problema) => ({
    campo: problema.path.length > 0 ? problema.path.join('.') : campo,
    mensaje: problema.message,
  }));
}
