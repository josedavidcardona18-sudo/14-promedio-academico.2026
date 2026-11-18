// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pedir, reiniciarEntorno } from '@/app/api/pruebas-api';

vi.mock(
  '@/lib/firebase-admin',
  async () => (await import('@/app/api/pruebas-api')).moduloFirebaseFalso,
);
vi.mock('@/repositories', async () => (await import('@/app/api/pruebas-api')).moduloRepositorios);

beforeEach(reiniciarEntorno);
import { materiaValida } from '@/app/api/pruebas-api';
import { DELETE, GET, PUT } from './route';

const manejadores = { GET, PUT, DELETE };

const llamar = (
  metodo: keyof typeof manejadores,
  materiaId: string,
  opciones: Parameters<typeof pedir>[1] = {},
  id = 'ejemplo',
) =>
  manejadores[metodo](
    pedir(`/api/semestres/${id}/materias/${materiaId}`, { metodo, ...opciones }),
    { params: Promise.resolve({ id, materiaId }) },
  );

describe('GET /api/semestres/:id/materias/:materiaId', () => {
  it('200: una materia del semestre', async () => {
    const r = await llamar('GET', 'ingles-ii');
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ id: 'ingles-ii', nombre: 'Inglés II', creditos: 2 });
  });

  it('404: materia inexistente, semestre ajeno; 401 sin sesión; 400 con id inválido', async () => {
    expect((await llamar('GET', 'nada')).status).toBe(404);
    expect((await llamar('GET', 'ingles-ii', { uid: 'beto' })).status).toBe(404);
    expect((await llamar('GET', 'ingles-ii', { uid: null })).status).toBe(401);
    expect((await llamar('GET', 'a%20b')).status).toBe(400);
  });
});

describe('PUT /api/semestres/:id/materias/:materiaId', () => {
  it('200: reemplaza la materia y el resumen refleja el cambio', async () => {
    const cuerpo = {
      ...materiaValida,
      notas: [{ nombre: 'Final', valor: 5, porcentaje: 100 }],
    };
    const r = await llamar('PUT', 'ingles-ii', { cuerpo });
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ id: 'ingles-ii', ...cuerpo });
    const leida = await (await llamar('GET', 'ingles-ii')).json();
    expect(leida.notas).toEqual(cuerpo.notas);
  });

  it('400: guardar una nota de 5,5 no cambia nada (criterio de aceptación)', async () => {
    const cuerpo = { ...materiaValida, notas: [{ nombre: 'Final', valor: 5.5, porcentaje: 40 }] };
    const r = await llamar('PUT', 'ingles-ii', { cuerpo });
    expect(r.status).toBe(400);
    expect((await r.json()).detalles).toEqual([
      { campo: 'notas.0.valor', mensaje: 'La nota no puede pasar de 5,0.' },
    ]);
    const intacta = await (await llamar('GET', 'ingles-ii')).json();
    expect(intacta.notas).toHaveLength(3);
  });

  it('404, 401 y 403 en los casos de siempre', async () => {
    expect((await llamar('PUT', 'nada', { cuerpo: materiaValida })).status).toBe(404);
    expect((await llamar('PUT', 'ingles-ii', { cuerpo: materiaValida, uid: 'beto' })).status).toBe(
      404,
    );
    expect((await llamar('PUT', 'ingles-ii', { cuerpo: materiaValida, uid: null })).status).toBe(
      401,
    );
    expect(
      (await llamar('PUT', 'ingles-ii', { cuerpo: materiaValida, origen: 'https://malo.example' }))
        .status,
    ).toBe(403);
  });
});

describe('DELETE /api/semestres/:id/materias/:materiaId', () => {
  it('204 y la materia desaparece; las demás siguen', async () => {
    expect((await llamar('DELETE', 'ingles-ii')).status).toBe(204);
    expect((await llamar('GET', 'ingles-ii')).status).toBe(404);
    expect((await llamar('GET', 'algebra-lineal')).status).toBe(200);
  });

  it('404 al repetir o al intentar con la cuenta de otra persona; 401 sin sesión', async () => {
    expect((await llamar('DELETE', 'ingles-ii', { uid: 'beto' })).status).toBe(404);
    expect((await llamar('GET', 'ingles-ii')).status).toBe(200);
    await llamar('DELETE', 'ingles-ii');
    expect((await llamar('DELETE', 'ingles-ii')).status).toBe(404);
    expect((await llamar('DELETE', 'algebra-lineal', { uid: null })).status).toBe(401);
  });
});
