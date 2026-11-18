// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pedir, reiniciarEntorno } from '@/app/api/pruebas-api';

vi.mock(
  '@/lib/firebase-admin',
  async () => (await import('@/app/api/pruebas-api')).moduloFirebaseFalso,
);
vi.mock('@/repositories', async () => (await import('@/app/api/pruebas-api')).moduloRepositorios);

beforeEach(reiniciarEntorno);
import { GET } from './route';

const pedirResumen = (id: string, consulta = '', opciones: Parameters<typeof pedir>[1] = {}) =>
  GET(pedir(`/api/semestres/${id}/resumen${consulta}`, opciones), {
    params: Promise.resolve({ id }),
  });

describe('GET /api/semestres/:id/resumen', () => {
  it('200: promedios calculados en el servidor, ponderados por créditos', async () => {
    const r = await pedirResumen('ejemplo');
    const cuerpo = await r.json();
    expect(r.status).toBe(200);
    expect(cuerpo).toMatchObject({
      semestreId: 'ejemplo',
      meta: 3,
      promedio: 3.37,
      creditosConNotas: 12,
      creditosTotales: 12,
      conteo: { aprobando: 3, 'en-riesgo': 1, perdida: 0, 'sin-notas': 0 },
    });
    expect(cuerpo.materias).toHaveLength(4);
  });

  it('200: la meta de la consulta cambia lo que pide cada materia', async () => {
    const cuerpo = await (await pedirResumen('ejemplo', '?meta=4')).json();
    const porId = (id: string) => cuerpo.materias.find((m: { id: string }) => m.id === id);
    expect(cuerpo.meta).toBe(4);
    expect(porId('programacion-web').simulacion).toEqual({
      tipo: 'necesaria',
      requerida: 3.5,
      pesoPendiente: 40,
    });
    // Cálculo ya no llega a 4,0 ni con 5,0 en lo que falta (máximo 3,89).
    expect(porId('calculo-diferencial').simulacion).toEqual({
      tipo: 'imposible',
      maximoPosible: 3.89,
    });
  });

  it('400: una meta fuera de 3,0 a 5,0 o que no es un número', async () => {
    for (const [meta, mensaje] of [
      ['5.5', 'La meta no puede pasar de 5,0.'],
      ['2', 'La meta no puede ser menor que 3,0.'],
      ['abc', 'Escribe un número.'],
    ] as const) {
      const r = await pedirResumen('ejemplo', `?meta=${meta}`);
      expect(r.status).toBe(400);
      expect((await r.json()).detalles).toEqual([{ campo: 'meta', mensaje }]);
    }
  });

  it('404: un semestre que no existe o que es de otra persona; 401 sin sesión', async () => {
    expect((await pedirResumen('otro')).status).toBe(404);
    expect((await pedirResumen('ejemplo', '', { uid: 'beto' })).status).toBe(404);
    expect((await pedirResumen('ejemplo', '', { uid: null })).status).toBe(401);
  });
});

describe('integración ruta → servicio → repositorio (criterio de aceptación 1)', () => {
  it('con 4,0 (30 %) y 3,0 (30 %), el simulador pide 2,3 en el 40 % restante', async () => {
    const { POST } = await import('../../route');
    const { POST: crearMateria } = await import('../materias/route');
    const semestre = await (
      await POST(
        pedir('/api/semestres', { metodo: 'POST', cuerpo: { nombre: '2026-2', meta: 3 } }),
        {},
      )
    ).json();
    await crearMateria(
      pedir(`/api/semestres/${semestre.id}/materias`, {
        metodo: 'POST',
        cuerpo: {
          nombre: 'Física',
          creditos: 3,
          notas: [
            { nombre: 'Parcial 1', valor: 4, porcentaje: 30 },
            { nombre: 'Parcial 2', valor: 3, porcentaje: 30 },
          ],
        },
      }),
      { params: Promise.resolve({ id: semestre.id }) },
    );

    const cuerpo = await (await pedirResumen(semestre.id)).json();

    expect(cuerpo.materias[0].simulacion).toEqual({
      tipo: 'necesaria',
      requerida: 2.3,
      pesoPendiente: 40,
    });
    expect(cuerpo.materias[0].resultado.estado).toBe('aprobando');
    expect(cuerpo.promedio).toBe(3.5);
  });

  it('con una meta imposible avisa de que ya no es alcanzable (criterio 3)', async () => {
    const cuerpo = await (await pedirResumen('ejemplo', '?meta=5')).json();
    const algebra = cuerpo.materias.find((m: { id: string }) => m.id === 'algebra-lineal');
    expect(algebra.simulacion.tipo).toBe('imposible');
  });
});
