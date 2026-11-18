import { z } from 'zod';

/** Lo que se pide en `/login`. Firebase exige al menos 6 caracteres en la contraseña. */
export const credencialesSchema = z.strictObject({
  correo: z
    .string('Escribe tu correo.')
    .trim()
    .min(1, 'Escribe tu correo.')
    .max(254, 'El correo es demasiado largo.')
    .pipe(z.email('Escribe un correo válido, por ejemplo ana@correo.com.')),
  clave: z
    .string('Escribe tu contraseña.')
    .min(6, 'La contraseña debe tener al menos 6 caracteres.')
    .max(128, 'La contraseña no puede pasar de 128 caracteres.'),
});

export type Credenciales = z.infer<typeof credencialesSchema>;
