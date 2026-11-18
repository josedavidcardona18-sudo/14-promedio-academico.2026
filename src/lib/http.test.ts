// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { noEncontrado, peticionInvalida } from './errores';
import { creado, json, leer, leerCuerpo, manejar, sinContenido, verificarOrigen } from './http';
import { reiniciarLimites } from './limite';

const contexto = {};
const sitio = 'http://localhost';
const pedir = (ruta = '/api/x', init: RequestInit = {}) => new Request(`${sitio}${ruta}`, init);
const escritura = (init: RequestInit = {}) =>
  pedir('/api/x', { method: 'POST', headers: { origin: sitio }, ...init });

beforeEach(reiniciarLimites);

describe('manejar', () => {
  it('devuelve la respuesta del manejador con un identificador de petición', async () => {
    const GET = manejar(async () => json({ ok: true }));
    const r = await GET(pedir(), contexto);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    expect(r.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('los datos son privados: toda respuesta, correcta o de error, sale con no-store', async () => {
    const correcta = await manejar(async () => json({}))(pedir(), contexto);
    const error = await manejar(async () => {
      throw noEncontrado('x');
    })(pedir(), contexto);
    expect(correcta.headers.get('cache-control')).toBe('no-store');
    expect(error.headers.get('cache-control')).toBe('no-store');
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

  it('los ayudantes de respuesta usan 201 y 204', async () => {
    expect(creado({ id: 1 }).status).toBe(201);
    expect(sinContenido().status).toBe(204);
  });
});

describe('verificarOrigen (CSRF)', () => {
  it('las lecturas no se comprueban', () => {
    expect(() =>
      verificarOrigen(pedir('/api/x', { headers: { origin: 'http://malo.com' } })),
    ).not.toThrow();
  });

  it('una escritura desde este mismo sitio pasa', () => {
    expect(() => verificarOrigen(escritura())).not.toThrow();
  });

  it('una escritura desde otro sitio es un 403', async () => {
    const POST = manejar(async () => sinContenido());
    const r = await POST(escritura({ headers: { origin: 'http://malo.com' } }), contexto);
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ error: 'Origen no permitido.' });
  });

  it('un Origin ilegible se trata como ajeno', () => {
    expect(() => verificarOrigen(escritura({ headers: { origin: 'no es una url' } }))).toThrow(
      'Origen no permitido',
    );
  });

  it('sin Origin solo se acepta con Bearer (Bruno, Postman); sin nada, 403', () => {
    const sinOrigen = (headers: Record<string, string>) =>
      pedir('/api/x', { method: 'PUT', headers });
    expect(() => verificarOrigen(sinOrigen({ authorization: 'Bearer abc' }))).not.toThrow();
    expect(() => verificarOrigen(sinOrigen({}))).toThrow('Origen no permitido');
    expect(() => verificarOrigen(sinOrigen({ authorization: 'Basic abc' }))).toThrow(
      'Origen no permitido',
    );
  });
});

describe('límite de frecuencia (429)', () => {
  it('después del máximo responde 429 con Retry-After; las lecturas no cuentan', async () => {
    const POST = manejar(async () => sinContenido(), { limite: { maximo: 2, ventanaMs: 60_000 } });
    const estados: number[] = [];
    for (let i = 0; i < 3; i++) estados.push((await POST(escritura(), contexto)).status);
    expect(estados).toEqual([204, 204, 429]);
    const r = await POST(escritura(), contexto);
    expect(Number(r.headers.get('retry-after'))).toBeGreaterThan(0);
    expect((await r.json()).error).toContain('Demasiadas solicitudes');
  });

  it('cada IP cuenta aparte', async () => {
    const POST = manejar(async () => sinContenido(), { limite: { maximo: 1, ventanaMs: 60_000 } });
    const desde = (ip: string) => escritura({ headers: { origin: sitio, 'x-forwarded-for': ip } });
    expect((await POST(desde('1.1.1.1'), contexto)).status).toBe(204);
    expect((await POST(desde('2.2.2.2'), contexto)).status).toBe(204);
    expect((await POST(desde('1.1.1.1'), contexto)).status).toBe(429);
  });
});

describe('leerCuerpo', () => {
  const esquema = z.strictObject({ nombre: z.string('Falta el nombre.') });
  const conCuerpo = (cuerpo: string, tipo = 'application/json') =>
    escritura({ headers: { origin: sitio, 'content-type': tipo }, body: cuerpo });

  it('devuelve el cuerpo validado', async () => {
    expect(await leerCuerpo(conCuerpo('{"nombre":"Ana"}'), esquema)).toEqual({ nombre: 'Ana' });
  });

  it('415 si no es JSON', async () => {
    await expect(leerCuerpo(conCuerpo('x', 'text/plain'), esquema)).rejects.toMatchObject({
      status: 415,
    });
  });

  it('400 si el JSON está roto o no cumple el esquema (campo desconocido incluido)', async () => {
    await expect(leerCuerpo(conCuerpo('{roto'), esquema)).rejects.toMatchObject({ status: 400 });
    await expect(leerCuerpo(conCuerpo('{"nombre":1}'), esquema)).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      leerCuerpo(conCuerpo('{"nombre":"a","rol":"admin"}'), esquema),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('413 si es demasiado grande', async () => {
    const grande = JSON.stringify({ nombre: 'x'.repeat(100_001) });
    await expect(leerCuerpo(conCuerpo(grande), esquema)).rejects.toMatchObject({ status: 413 });
    const declarado = escritura({
      headers: { origin: sitio, 'content-type': 'application/json', 'content-length': '999999' },
      body: '{}',
    });
    await expect(leerCuerpo(declarado, esquema)).rejects.toMatchObject({ status: 413 });
  });
});
