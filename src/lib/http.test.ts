// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { noEncontrado, peticionInvalida } from './errores';
import { json, leer, manejar } from './http';

const contexto = {};
const pedir = (ruta = '/api/x') => new Request(`http://localhost${ruta}`);

describe('manejar', () => {
  it('devuelve la respuesta del manejador con un identificador de petición', async () => {
    const GET = manejar(async () => json({ ok: true }));
    const r = await GET(pedir(), contexto);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    expect(r.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('las rutas privadas no se cachean; las públicas, sí', async () => {
    const privada = await manejar(async () => json({}))(pedir(), contexto);
    const publica = await manejar(async () => json({}), { publica: true })(pedir(), contexto);
    expect(privada.headers.get('cache-control')).toBe('no-store');
    expect(publica.headers.get('cache-control')).toContain('s-maxage');
  });

  it('una respuesta pública con error NUNCA se cachea (una CDN no debe guardar un 404 ni un 400)', async () => {
    const GET = manejar(
      async () => {
        throw noEncontrado('x');
      },
      { publica: true },
    );
    const r = await GET(pedir(), contexto);
    expect(r.status).toBe(404);
    expect(r.headers.get('cache-control')).toBe('no-store');
  });

  it('un error conocido se convierte en su código con el cuerpo {error}', async () => {
    const GET = manejar(async () => {
      throw noEncontrado('Semestre no encontrado.');
    });
    const r = await GET(pedir(), contexto);
    expect(r.status).toBe(404);
    expect(await r.json()).toEqual({ error: 'Semestre no encontrado.' });
  });

  it('una validación fallida responde 400 con el detalle por campo', async () => {
    const GET = manejar(async () => {
      leer(z.number('Escribe un número.'), 'abc', 'meta');
      return json({});
    });
    const r = await GET(pedir(), contexto);
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({
      error: 'Datos inválidos.',
      detalles: [{ campo: 'meta', mensaje: 'Escribe un número.' }],
    });
  });

  it('usa la ruta del campo cuando el error viene de un objeto anidado', async () => {
    const esquema = z.strictObject({
      nota: z.strictObject({ valor: z.number('Escribe un número.') }),
    });
    const GET = manejar(async () => {
      leer(esquema, { nota: { valor: 'x' } }, 'cuerpo');
      return json({});
    });
    const cuerpo = await (await GET(pedir(), contexto)).json();
    expect(cuerpo.detalles).toEqual([{ campo: 'nota.valor', mensaje: 'Escribe un número.' }]);
  });

  it('un error inesperado responde 500 sin revelar detalles internos', async () => {
    const GET = manejar(async () => {
      throw new Error('clave secreta: abc123 en /srv/app/db.ts');
    });
    const r = await GET(pedir(), contexto);
    const texto = await r.text();
    expect(r.status).toBe(500);
    expect(JSON.parse(texto)).toEqual({ error: 'Error interno.' });
    expect(texto).not.toContain('abc123');
  });

  it('peticionInvalida lleva el 400 y sus detalles', () => {
    const e = peticionInvalida([{ campo: 'a', mensaje: 'b' }]);
    expect([e.status, e.detalles]).toEqual([400, [{ campo: 'a', mensaje: 'b' }]]);
  });
});
