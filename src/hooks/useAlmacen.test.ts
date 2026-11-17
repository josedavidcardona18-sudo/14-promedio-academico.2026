import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { estadoInicial } from '@/domain/constantes';
import { estadoDeEjemplo } from '@/domain/ejemplo';
import { crearMateria } from '@/domain/reducer';
import { serializar } from '@/storage/serializar';
import { nuevoId } from './nuevoId';
import { useAlmacen, useHidratado } from './useAlmacen';

const CLAVE = 'promedio-academico:v1';

describe('useAlmacen', () => {
  it('empieza vacío cuando no hay nada guardado', () => {
    const { result } = renderHook(() => useAlmacen());
    expect(result.current.estado).toEqual(estadoInicial());
  });

  it('empieza con lo que ya estaba guardado', () => {
    window.localStorage.setItem(CLAVE, serializar(estadoDeEjemplo()));
    const { result } = renderHook(() => useAlmacen());
    expect(result.current.estado.materias).toHaveLength(4);
  });

  it('despachar actualiza el estado y lo guarda en localStorage', () => {
    const { result } = renderHook(() => useAlmacen());
    act(() => {
      result.current.despachar({
        tipo: 'agregar-materia',
        materia: crearMateria('a', 'Física', 3),
      });
    });
    expect(result.current.estado.materias.map((m) => m.nombre)).toEqual(['Física']);
    expect(window.localStorage.getItem(CLAVE)).toContain('Física');
  });

  it('dos acciones seguidas no se pisan (cada una parte de lo último guardado)', () => {
    const { result } = renderHook(() => useAlmacen());
    act(() => {
      result.current.despachar({ tipo: 'agregar-materia', materia: crearMateria('a', 'A', 3) });
      result.current.despachar({ tipo: 'agregar-materia', materia: crearMateria('b', 'B', 2) });
    });
    expect(result.current.estado.materias).toHaveLength(2);
  });

  it('se entera de los cambios hechos en otra pestaña', () => {
    const { result } = renderHook(() => useAlmacen());
    act(() => {
      window.localStorage.setItem(CLAVE, serializar(estadoDeEjemplo()));
      window.dispatchEvent(new StorageEvent('storage', { key: CLAVE }));
    });
    expect(result.current.estado.materias).toHaveLength(4);
  });
});

describe('render en el servidor', () => {
  it('no está hidratado y ve el estado vacío (así el HTML inicial no depende del navegador)', () => {
    function Sonda() {
      const hidratado = useHidratado();
      const { estado } = useAlmacen();
      return createElement('p', null, `${hidratado}-${estado.materias.length}`);
    }
    expect(renderToString(createElement(Sonda))).toContain('false-0');
  });
});

describe('useHidratado', () => {
  it('es true en el navegador', () => {
    expect(renderHook(() => useHidratado()).result.current).toBe(true);
  });
});

describe('nuevoId', () => {
  it('genera ids distintos', () => {
    expect(nuevoId()).not.toBe(nuevoId());
  });

  it('sin crypto.randomUUID (p. ej. HTTP sin cifrar) usa un id de respaldo', () => {
    vi.stubGlobal('crypto', {});
    const id = nuevoId();
    vi.unstubAllGlobals();
    expect(id).toMatch(/^m-[a-z0-9]+-[a-z0-9]+$/);
  });
});
