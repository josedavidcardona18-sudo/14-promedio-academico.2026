// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pedir, reiniciarEntorno } from '@/app/api/pruebas-api';

vi.mock(
  '@/lib/firebase-admin',
  async () => (await import('@/app/api/pruebas-api')).moduloFirebaseFalso,
);
vi.mock('@/repositories', async () => (await import('@/app/api/pruebas-api')).moduloRepositorios);

beforeEach(reiniciarEntorno);
import { semestreConMateriasSchema } from '@/schemas/semestre';
import { DELETE, GET, PUT } from './route';

const llamar = (
  metodo: 'GET' | 'PUT' | 'DELETE',
  id: string,
  opciones: Parameters<typeof pedir>[1] = {},
) => {
  const manejador = { GET, PUT, DELETE }[metodo];
  return manejador(pedir(`/api/semestres/${id}`, { metodo, ...opciones }), {
    params: Promise.resolve({ id }),
  });
};

describe('GET /api/semestres/:id', () => {
  it('200: devuelve el semestre y cumple el contrato (esquema Zod)', async () => {
    const r = await llamar('GET', 'ejemplo');
    expect(r.status).toBe(200);
    expect(semestreConMateriasSchema.parse(await r.json()).materias).toHaveLength(4);
    expect(r.headers.get('cache-control')).toBe('no-store');
  });

  it('401: sin sesión', async () => {
    expect((await llamar('GET', 'ejemplo', { uid: null })).status).toBe(401);
  });

  it('404: un semestre que no existe, y también el de otra persona (no se revela que existe)', async () => {
    const inexistente = await llamar('GET', 'no-existe');
    const ajeno = await llamar('GET', 'ejemplo', { uid: 'beto' });
    expect([inexistente.status, ajeno.status]).toEqual([404, 404]);
    expect(await ajeno.json()).toEqual({ error: 'Semestre no encontrado.' });
  });

  it('400: un identificador con caracteres no permitidos', async () => {
    const r = await llamar('GET', '..%2Fetc');
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({
      error: 'Datos inválidos.',
      detalles: [{ campo: 'id', mensaje: 'Identificador inválido.' }],
    });
  });
});

describe('PUT /api/semestres/:id', () => {
  it('200: cambia el nombre y la meta sin tocar las materias', async () => {
    const r = await llamar('PUT', 'ejemplo', { cuerpo: { nombre: 'Renombrado', meta: 4 } });
    const cuerpo = await r.json();
    expect(r.status).toBe(200);
    expect(cuerpo).toMatchObject({ id: 'ejemplo', nombre: 'Renombrado', meta: 4 });
    expect(cuerpo.materias).toHaveLength(4);
  });

  it('400: una meta de 5,5 no se guarda', async () => {
    const r = await llamar('PUT', 'ejemplo', { cuerpo: { nombre: 'x', meta: 5.5 } });
    expect(r.status).toBe(400);
    const despues = await (await llamar('GET', 'ejemplo')).json();
    expect(despues.meta).toBe(3);
  });

  it('404: no se puede editar el semestre de otra persona ni uno inexistente', async () => {
    const cuerpo = { nombre: 'x', meta: 3 };
    expect((await llamar('PUT', 'ejemplo', { uid: 'beto', cuerpo })).status).toBe(404);
    expect((await llamar('PUT', 'nada', { cuerpo })).status).toBe(404);
    const intacto = await (await llamar('GET', 'ejemplo')).json();
    expect(intacto.nombre).toContain('ejemplo');
  });

  it('401 sin sesión y 403 desde otro origen', async () => {
    const cuerpo = { nombre: 'x', meta: 3 };
    expect((await llamar('PUT', 'ejemplo', { uid: null, cuerpo })).status).toBe(401);
    expect(
      (await llamar('PUT', 'ejemplo', { cuerpo, origen: 'https://malo.example' })).status,
    ).toBe(403);
  });
});

describe('DELETE /api/semestres/:id', () => {
  it('204 sin cuerpo; después el semestre y sus materias ya no existen', async () => {
    const r = await llamar('DELETE', 'ejemplo');
    expect(r.status).toBe(204);
    expect(await r.text()).toBe('');
    expect((await llamar('GET', 'ejemplo')).status).toBe(404);
  });

  it('404 si se borra dos veces; 404 y sin efecto si lo intenta otra persona', async () => {
    expect((await llamar('DELETE', 'ejemplo', { uid: 'beto' })).status).toBe(404);
    expect((await llamar('GET', 'ejemplo')).status).toBe(200);
    await llamar('DELETE', 'ejemplo');
    expect((await llamar('DELETE', 'ejemplo')).status).toBe(404);
  });

  it('401 sin sesión y 403 desde otro origen', async () => {
    expect((await llamar('DELETE', 'ejemplo', { uid: null })).status).toBe(401);
    expect((await llamar('DELETE', 'ejemplo', { origen: 'https://malo.example' })).status).toBe(
      403,
    );
  });
});
