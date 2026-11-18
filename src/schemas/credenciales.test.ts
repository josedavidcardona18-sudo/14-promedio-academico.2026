import { describe, expect, it } from 'vitest';
import { credencialesSchema } from './credenciales';

const mensajes = (entrada: unknown) =>
  credencialesSchema.safeParse(entrada).error?.issues.map((i) => [i.path.join('.'), i.message]);

describe('credencialesSchema', () => {
  it('acepta un correo y una contraseña válidos y recorta el correo', () => {
    expect(credencialesSchema.parse({ correo: ' ana@correo.com ', clave: '123456' })).toEqual({
      correo: 'ana@correo.com',
      clave: '123456',
    });
  });

  it('explica cada error por campo', () => {
    expect(mensajes({ correo: '', clave: '123' })).toEqual([
      ['correo', 'Escribe tu correo.'],
      ['clave', 'La contraseña debe tener al menos 6 caracteres.'],
    ]);
    expect(mensajes({ correo: 'sin-arroba', clave: '123456' })).toEqual([
      ['correo', 'Escribe un correo válido, por ejemplo ana@correo.com.'],
    ]);
  });

  it('rechaza campos de más', () => {
    expect(
      credencialesSchema.safeParse({ correo: 'a@b.co', clave: '123456', rol: 'admin' }).success,
    ).toBe(false);
  });
});
