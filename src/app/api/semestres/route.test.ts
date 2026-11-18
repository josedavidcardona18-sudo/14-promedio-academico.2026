// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pedir, reiniciarEntorno } from '@/app/api/pruebas-api';

vi.mock(
  '@/lib/firebase-admin',
  async () => (await import('@/app/api/pruebas-api')).moduloFirebaseFalso,
);
vi.mock('@/repositories', async () => (await import('@/app/api/pruebas-api')).moduloRepositorios);

beforeEach(reiniciarEntorno);

import { listaQuerySchema } from '@/schemas/semestre';
import { GET, POST } from './route';

const contexto = {};
const nuevo = { nombre: '2027-1', meta: 3.5 };

describe('GET /api/semestres', () => {
  it('401: sin sesión', async () => {
    const r = await GET(pedir('/api/semestres', { uid: null }), contexto);
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ error: 'Necesitas iniciar sesión.' });
  });

  it('401: con una sesión inválida o revocada', async () => {
    const r = await GET(pedir('/api/semestres', { uid: 'revocada' }), contexto);
    expect(r.status).toBe(401);
  });

  it('200: lista solo los semestres de quien pregunta (aislamiento entre usuarios)', async () => {
    const ana = await (await GET(pedir('/api/semestres'), contexto)).json();
    const beto = await (await GET(pedir('/api/semestres', { uid: 'beto' }), contexto)).json();
    expect(ana.items.map((s: { id: string }) => s.id)).toEqual(['ejemplo']);
    expect(ana.siguienteCursor).toBeNull();
    expect(beto).toEqual({ items: [], siguienteCursor: null });
  });

  it('200: pagina con limite y cursor sin repetir ni perder semestres', async () => {
    for (const nombre of ['A', 'B', 'C']) {
      await POST(
        pedir('/api/semestres', { metodo: 'POST', cuerpo: { ...nuevo, nombre } }),
        contexto,
      );
    }
    const primera = await (await GET(pedir('/api/semestres?limite=3'), contexto)).json();
    expect(primera.items).toHaveLength(3);
    expect(primera.siguienteCursor).toEqual(expect.any(String));
    const segunda = await (
      await GET(pedir(`/api/semestres?limite=3&cursor=${primera.siguienteCursor}`), contexto)
    ).json();
    expect(segunda.items.map((s: { id: string }) => s.id)).toEqual(['ejemplo']);
    expect(segunda.siguienteCursor).toBeNull();
  });

  it('400: límite fuera de rango, cursor inexistente o parámetro desconocido', async () => {
    for (const consulta of [
      '?limite=0',
      '?limite=101',
      '?limite=abc',
      '?cursor=no-existe',
      '?pagina=2',
    ]) {
      const r = await GET(pedir(`/api/semestres${consulta}`), contexto);
      expect(r.status, consulta).toBe(400);
    }
    expect(listaQuerySchema.parse({}).limite).toBe(20);
  });

  it('las respuestas privadas nunca se guardan en caché', async () => {
    const r = await GET(pedir('/api/semestres'), contexto);
    expect(r.headers.get('cache-control')).toBe('no-store');
  });
});

describe('POST /api/semestres', () => {
  const crear = (cuerpo: unknown, opciones = {}) =>
    POST(pedir('/api/semestres', { metodo: 'POST', cuerpo, ...opciones }), contexto);

  it('201: crea el semestre en la cuenta de quien lo pide', async () => {
    const r = await crear(nuevo);
    const creado = await r.json();
    expect(r.status).toBe(201);
    expect(creado).toMatchObject({ ...nuevo, materias: [] });
    const beto = await (await GET(pedir('/api/semestres', { uid: 'beto' }), contexto)).json();
    expect(beto.items).toHaveLength(0);
  });

  it('400: meta fuera de 3,0 a 5,0, nombre vacío o campo desconocido (no se puede inyectar el uid)', async () => {
    for (const cuerpo of [
      { nombre: 'x', meta: 5.5 },
      { nombre: '  ', meta: 3 },
      { nombre: 'x', meta: 3, uid: 'beto' },
      { nombre: 'x' },
    ]) {
      const r = await crear(cuerpo);
      expect(r.status, JSON.stringify(cuerpo)).toBe(400);
      expect((await r.json()).detalles.length).toBeGreaterThan(0);
    }
  });

  it('400 con JSON roto y 415 si no es JSON', async () => {
    expect((await crear(undefined, { texto: '{roto' })).status).toBe(400);
    expect((await crear(undefined, { texto: 'x', tipo: 'text/plain' })).status).toBe(415);
  });

  it('401: sin sesión (antes de mirar el cuerpo)', async () => {
    expect((await crear(nuevo, { uid: null })).status).toBe(401);
  });

  it('403: petición desde otro sitio (CSRF), aunque traiga la cookie', async () => {
    const r = await crear(nuevo, { origen: 'https://malo.example' });
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ error: 'Origen no permitido.' });
  });

  it('201 con Bearer y sin Origin (Bruno, Postman)', async () => {
    const r = await crear(nuevo, { uid: null, bearer: 'beto', origen: null });
    expect(r.status).toBe(201);
  });

  it('409: al llegar a 20 semestres', async () => {
    for (let i = 0; i < 19; i++)
      expect((await crear({ ...nuevo, nombre: `S${i}` })).status).toBe(201);
    const r = await crear(nuevo);
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ error: 'Llegaste al máximo de 20 semestres.' });
  });

  it('429 con Retry-After al pasar de 60 escrituras por minuto desde la misma IP', async () => {
    const estados: number[] = [];
    for (let i = 0; i < 61; i++) {
      estados.push((await crear({ nombre: 'x', meta: 9 }, { ip: '9.9.9.9' })).status);
    }
    expect(estados.slice(0, 60).every((e) => e === 400)).toBe(true);
    expect(estados[60]).toBe(429);
    const r = await crear(nuevo, { ip: '9.9.9.9' });
    expect(Number(r.headers.get('retry-after'))).toBeGreaterThan(0);
  });
});
