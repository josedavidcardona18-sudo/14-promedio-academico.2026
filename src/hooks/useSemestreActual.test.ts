import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SEMESTRE_DE_EJEMPLO } from '@/repositories/semestres';
import { claveDeBorrador, serializarBorrador } from '@/storage/borrador';
import { useSemestre } from './useSemestre';
import { useSemestreActual } from './useSemestreActual';

const responder = (cuerpo: unknown, estado = 200) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(cuerpo), { status: estado })),
  );

afterEach(() => vi.unstubAllGlobals());

describe('useSemestre · carga, error y reintento', () => {
  it('empieza cargando y pasa a listo con los datos de la API', async () => {
    responder(SEMESTRE_DE_EJEMPLO);
    const { result } = renderHook(() => useSemestre('ejemplo'));
    expect(result.current.estado.tipo).toBe('cargando');
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    const estado = result.current.estado;
    expect(estado.tipo === 'listo' && estado.semestre.materias).toHaveLength(4);
  });

  it('si la API falla, muestra el error y permite reintentar', async () => {
    responder({ error: 'Error interno.' }, 500);
    const { result } = renderHook(() => useSemestre('ejemplo'));
    await waitFor(() => expect(result.current.estado.tipo).toBe('error'));
    expect(result.current.estado).toMatchObject({
      mensaje: expect.stringContaining('no pudo entregar'),
    });

    responder(SEMESTRE_DE_EJEMPLO);
    act(() => result.current.reintentar());
    expect(result.current.estado.tipo).toBe('cargando');
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
  });

  it('cambiar de semestre vuelve a pedir y vuelve a mostrar «cargando»', async () => {
    responder(SEMESTRE_DE_EJEMPLO);
    const { result, rerender } = renderHook(({ id }) => useSemestre(id), {
      initialProps: { id: 'ejemplo' },
    });
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    rerender({ id: 'otro' });
    expect(result.current.estado.tipo).toBe('cargando');
  });
});

describe('useSemestreActual · API + borrador', () => {
  it('sin borrador usa las materias de la API', async () => {
    responder(SEMESTRE_DE_EJEMPLO);
    const { result } = renderHook(() => useSemestreActual('ejemplo'));
    expect(result.current.tipo).toBe('cargando');
    await waitFor(() => expect(result.current.tipo).toBe('listo'));
    const actual = result.current;
    expect(actual.tipo === 'listo' && actual.datos.hayBorrador).toBe(false);
  });

  it('guardar una materia crea el borrador y las pantallas pasan a usarlo', async () => {
    responder(SEMESTRE_DE_EJEMPLO);
    const { result } = renderHook(() => useSemestreActual('ejemplo'));
    await waitFor(() => expect(result.current.tipo).toBe('listo'));
    const inicial = result.current;
    if (inicial.tipo !== 'listo') throw new Error('se esperaba listo');
    const original = inicial.datos.semestre.materias[0];
    if (!original) throw new Error('falta la primera materia');

    act(() => inicial.datos.guardarMateria({ ...original, creditos: 2 }));

    const despues = result.current;
    expect(despues.tipo === 'listo' && despues.datos.hayBorrador).toBe(true);
    expect(despues.tipo === 'listo' && despues.datos.semestre.materias[0]?.creditos).toBe(2);
    expect(window.localStorage.getItem(claveDeBorrador('ejemplo'))).toContain('"creditos":2');
  });

  it('restablecer borra el borrador y vuelve a los datos de ejemplo', async () => {
    window.localStorage.setItem(claveDeBorrador('ejemplo'), serializarBorrador([]));
    responder(SEMESTRE_DE_EJEMPLO);
    const { result } = renderHook(() => useSemestreActual('ejemplo'));
    await waitFor(() => expect(result.current.tipo).toBe('vacio'));
    const actual = result.current;
    if (actual.tipo !== 'vacio') throw new Error('se esperaba vacío');

    act(() => actual.datos.restablecer());

    await waitFor(() => expect(result.current.tipo).toBe('listo'));
    expect(window.localStorage.getItem(claveDeBorrador('ejemplo'))).toBeNull();
  });

  it('un borrador corrupto se ignora y se usan los datos de la API', async () => {
    window.localStorage.setItem(claveDeBorrador('ejemplo'), '{roto');
    responder(SEMESTRE_DE_EJEMPLO);
    const { result } = renderHook(() => useSemestreActual('ejemplo'));
    await waitFor(() => expect(result.current.tipo).toBe('listo'));
    const actual = result.current;
    expect(actual.tipo === 'listo' && actual.datos.hayBorrador).toBe(false);
  });

  it('propaga el error con la función de reintento', async () => {
    responder({ error: 'x' }, 404);
    const { result } = renderHook(() => useSemestreActual('ejemplo'));
    await waitFor(() => expect(result.current.tipo).toBe('error'));
    const actual = result.current;
    expect(actual.tipo === 'error' && actual.mensaje).toBe('No encontramos ese semestre.');
    expect(actual.tipo === 'error' && typeof actual.reintentar).toBe('function');
  });
});
