import { z } from 'zod';

/** Reglas del documento del proyecto (sección 8): se escriben aquí una sola vez. */
export const LIMITES = {
  notaMaxima: 5,
  metaMinima: 3,
  metaMaxima: 5,
  porcentajeTotal: 100,
  maxNotasPorMateria: 12,
  maxMateriasPorSemestre: 30,
  maxCreditos: 20,
  maxNombre: 60,
  maxNombreNota: 40,
} as const;

/** Un decimal exacto, tolerando el ruido de la coma flotante (0,1 + 0,2 sigue siendo 0,3). */
function tieneUnDecimal(valor: number): boolean {
  return Math.abs(valor * 10 - Math.round(valor * 10)) < 1e-9;
}

const textoNumero = 'Escribe un número.';

export const valorNotaSchema = z
  .number(textoNumero)
  .min(0, 'La nota no puede ser menor que 0,0.')
  .max(LIMITES.notaMaxima, 'La nota no puede pasar de 5,0.')
  .refine(tieneUnDecimal, 'La nota admite un solo decimal.');

export const porcentajeSchema = z
  .number(textoNumero)
  .min(0, 'El porcentaje no puede ser menor que 0.')
  .max(LIMITES.porcentajeTotal, 'El porcentaje no puede pasar de 100.')
  .refine(tieneUnDecimal, 'El porcentaje admite un solo decimal.');

export const metaSchema = z
  .number(textoNumero)
  .min(LIMITES.metaMinima, 'La meta no puede ser menor que 3,0.')
  .max(LIMITES.metaMaxima, 'La meta no puede pasar de 5,0.')
  .refine(tieneUnDecimal, 'La meta admite un solo decimal.');

/** Identificador de semestre o materia: se usa en rutas, así que solo letras, números y guiones. */
export const idSchema = z
  .string('Identificador inválido.')
  .regex(/^[a-z0-9][a-z0-9-]{0,39}$/i, 'Identificador inválido.');

const nombreSchema = (maximo: number, vacio: string) =>
  z
    .string(vacio)
    .trim()
    .min(1, vacio)
    .max(maximo, `El nombre no puede pasar de ${maximo} caracteres.`);

export const notaSchema = z.strictObject({
  nombre: nombreSchema(LIMITES.maxNombreNota, 'Escribe el nombre de la nota.'),
  valor: valorNotaSchema.nullable(),
  porcentaje: porcentajeSchema,
});

const materiaBaseSchema = z.strictObject({
  nombre: nombreSchema(LIMITES.maxNombre, 'Escribe el nombre de la materia.'),
  creditos: z
    .number(textoNumero)
    .int('Los créditos son un número entero.')
    .min(1, 'Mínimo 1 crédito.')
    .max(LIMITES.maxCreditos, `Máximo ${LIMITES.maxCreditos} créditos.`),
  notas: z
    .array(notaSchema)
    .max(LIMITES.maxNotasPorMateria, `Máximo ${LIMITES.maxNotasPorMateria} notas por materia.`),
});

/** Suma en décimas de punto porcentual (entera, sin ruido de coma flotante). */
export function sumaPorcentajesEnDecimas(notas: readonly { porcentaje: number }[]): number {
  return notas.reduce((total, nota) => total + Math.round(nota.porcentaje * 10), 0);
}

function validarSuma(
  materia: { notas: readonly { porcentaje: number }[] },
  ctx: z.RefinementCtx,
): void {
  const decimas = sumaPorcentajesEnDecimas(materia.notas);
  if (decimas <= LIMITES.porcentajeTotal * 10) return;
  ctx.addIssue({
    code: 'custom',
    path: ['notas'],
    message: `Los porcentajes suman ${String(decimas / 10).replace('.', ',')} %; no pueden pasar de 100 %.`,
  });
}

/** Lo que el cliente envía al crear o editar una materia (sin `id`: lo pone el servidor). */
export const materiaEntradaSchema = materiaBaseSchema.superRefine(validarSuma);

export const materiaSchema = materiaBaseSchema.extend({ id: idSchema }).superRefine(validarSuma);

export const semestreEntradaSchema = z.strictObject({
  nombre: nombreSchema(LIMITES.maxNombreNota, 'Escribe el nombre del semestre.'),
  meta: metaSchema,
});

export const semestreConMateriasSchema = z.strictObject({
  id: idSchema,
  nombre: nombreSchema(LIMITES.maxNombreNota, 'Escribe el nombre del semestre.'),
  meta: metaSchema,
  materias: z.array(materiaSchema).max(LIMITES.maxMateriasPorSemestre),
});

export type Nota = z.infer<typeof notaSchema>;
export type MateriaEntrada = z.infer<typeof materiaEntradaSchema>;
export type Materia = z.infer<typeof materiaSchema>;
export type SemestreConMaterias = z.infer<typeof semestreConMateriasSchema>;
