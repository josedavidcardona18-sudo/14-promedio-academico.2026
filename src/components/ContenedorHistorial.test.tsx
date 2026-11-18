import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContenedorHistorial } from './ContenedorHistorial';
import {
  instalarServidorFalso,
  reiniciarNavegacion,
  responderSiempre,
  sembrarSemestre,
} from './pruebas-de-datos';

vi.mock('next/navigation', async () => (await import('./pruebas-de-datos')).moduloNavegacionFalso);
vi.mock(
  '@/lib/firebase-admin',
  async () => (await import('@/app/api/pruebas-api')).moduloFirebaseFalso,
);
vi.mock('@/repositories', async () => (await import('@/app/api/pruebas-api')).moduloRepositorios);

beforeEach(() => reiniciarNavegacion('/historial'));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const NOTA_FINAL = [{ nombre: 'Final', valor: 4, porcentaje: 100 }];
const conPromedio4 = [{ nombre: 'Física', creditos: 3, notas: NOTA_FINAL }];
const tarjeta = (nombre: string) => within(screen.getByRole('article', { name: nombre }));
const filas = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);
const celdas = (fila: HTMLElement) =>
  within(fila)
    .getAllByRole('cell')
    .map((c) => c.textContent);

async function abrir(preparar?: () => Promise<unknown>) {
  await instalarServidorFalso();
  await preparar?.();
  render(<ContenedorHistorial />);
  await screen.findByRole('heading', { name: 'Promedio por semestre' });
  return userEvent.setup();
}

describe('ContenedorHistorial · tabla y comparación', () => {
  it('lista los semestres del más reciente al más antiguo, con su promedio y el cambio', async () => {
    await abrir(() => sembrarSemestre('2027-1', 3.5, conPromedio4));
    const [reciente, antiguo] = filas();
    if (!reciente || !antiguo) throw new Error('faltan filas');
    expect(within(reciente).getByRole('rowheader')).toHaveTextContent('2027-1');
    expect(within(reciente).getByRole('rowheader')).toHaveTextContent('3 créditos');
    expect(celdas(reciente)).toEqual(['4,0', '▲ Sube 0,63']);
    expect(within(antiguo).getByRole('rowheader')).toHaveTextContent('12 créditos');
    expect(celdas(antiguo)).toEqual(['3,37', '—']);
  });

  it('la tabla tiene encabezados de columna y una región con nombre para quien la desplaza', async () => {
    await abrir(() => sembrarSemestre('2027-1', 3.5, conPromedio4));
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual([
      'Semestre',
      'Promedio',
      'Cambio',
    ]);
    expect(screen.getByRole('region', { name: 'Tabla de promedios por semestre' })).toHaveAttribute(
      'tabindex',
      '0',
    );
  });

  it('un semestre que baja se dice con palabras, no solo con color', async () => {
    await abrir(() =>
      sembrarSemestre('2027-1', 3.5, [
        {
          nombre: 'Física',
          creditos: 3,
          notas: [{ nombre: 'Final', valor: 2.5, porcentaje: 100 }],
        },
      ]),
    );
    const [reciente] = filas();
    if (!reciente) throw new Error('falta la fila');
    expect(celdas(reciente)[1]).toBe('▼ Baja 0,87');
  });

  it('compara dos semestres con una frase que dice cuál va por encima y por cuánto', async () => {
    const user = await abrir(() => sembrarSemestre('2027-1', 3.5, conPromedio4));
    expect(screen.getByRole('status')).toHaveTextContent(
      '2027-1 (4,0) frente a 2026-2 (datos de ejemplo) (3,37): 0,63 por encima.',
    );
    await user.selectOptions(screen.getByLabelText('Semestre A'), '2027-1');
    await user.selectOptions(screen.getByLabelText('Semestre B'), '2026-2 (datos de ejemplo)');
    expect(screen.getByRole('status')).toHaveTextContent('0,63 por debajo.');
  });

  it('pide dos semestres distintos y avisa si uno no tiene notas', async () => {
    const user = await abrir(() => sembrarSemestre('2027-1', 3.5));
    expect(screen.getByRole('status')).toHaveTextContent('todavía no tiene notas');
    await user.selectOptions(screen.getByLabelText('Semestre A'), '2027-1');
    expect(screen.getByRole('status')).toHaveTextContent('Elige dos semestres distintos');
  });

  it('con un solo semestre no hay nada que comparar', async () => {
    await abrir();
    expect(
      screen.queryByRole('heading', { name: 'Comparar dos semestres' }),
    ).not.toBeInTheDocument();
  });
});

describe('ContenedorHistorial · administrar semestres', () => {
  it('crea un semestre y aparece en la lista y en la tabla', async () => {
    const user = await abrir();
    await user.click(screen.getByText('Nuevo semestre'));
    await user.type(screen.getByLabelText('Nombre del semestre'), '2027-1');
    await user.click(screen.getByRole('button', { name: 'Crear semestre' }));
    expect(await screen.findByRole('heading', { name: '2027-1', level: 3 })).toBeInTheDocument();
    expect(filas()).toHaveLength(2);
    expect(screen.getByLabelText('Nombre del semestre')).toHaveValue('');
  });

  it('edita el nombre y la meta de un semestre', async () => {
    const user = await abrir();
    await user.click(screen.getByRole('button', { name: /Editar 2026-2/ }));
    const formulario = tarjeta('2026-2 (datos de ejemplo)');
    await user.clear(formulario.getByLabelText('Nombre del semestre'));
    await user.type(formulario.getByLabelText('Nombre del semestre'), 'Semestre 4');
    await user.click(formulario.getByRole('button', { name: 'Guardar cambios' }));
    expect(
      await screen.findByRole('heading', { name: 'Semestre 4', level: 3 }),
    ).toBeInTheDocument();
    expect(tarjeta('Semestre 4').queryByLabelText('Nombre del semestre')).not.toBeInTheDocument();
  });

  it('una meta fuera de rango no se envía y el error queda junto al campo', async () => {
    const user = await abrir();
    await user.click(screen.getByRole('button', { name: /Editar 2026-2/ }));
    const formulario = tarjeta('2026-2 (datos de ejemplo)');
    const meta = formulario.getByLabelText('Meta de promedio (3,0 a 5,0)');
    await user.clear(meta);
    await user.type(meta, '5.5');
    await user.click(formulario.getByRole('button', { name: 'Guardar cambios' }));
    expect(meta).toHaveAccessibleDescription(/La meta no puede pasar de 5,0\./);
  });

  it('cancelar la edición cierra el formulario sin cambiar nada', async () => {
    const user = await abrir();
    await user.click(screen.getByRole('button', { name: /Editar 2026-2/ }));
    await user.click(
      tarjeta('2026-2 (datos de ejemplo)').getByRole('button', { name: 'Cancelar' }),
    );
    expect(
      tarjeta('2026-2 (datos de ejemplo)').queryByLabelText('Nombre del semestre'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Editar 2026-2/ })).toBeInTheDocument();
  });

  it('eliminar pide confirmación; al confirmar el semestre desaparece', async () => {
    const user = await abrir(() => sembrarSemestre('2027-1', 3.5));
    await user.click(screen.getByRole('button', { name: /Eliminar 2027-1/ }));
    const dialogo = screen.getByRole('dialog', { name: '¿Eliminar 2027-1?' });
    expect(dialogo).toHaveTextContent('No se puede deshacer');
    await user.click(within(dialogo).getByRole('button', { name: 'Sí, eliminar' }));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: '2027-1' })).not.toBeInTheDocument(),
    );
    expect(filas()).toHaveLength(1);
  });

  it('cancelar la confirmación no elimina nada', async () => {
    const user = await abrir(() => sembrarSemestre('2027-1', 3.5));
    await user.click(screen.getByRole('button', { name: /Eliminar 2027-1/ }));
    await user.click(
      within(screen.getByRole('dialog', { name: '¿Eliminar 2027-1?' })).getByRole('button', {
        name: 'Cancelar',
      }),
    );
    expect(screen.getByRole('heading', { name: '2027-1', level: 3 })).toBeInTheDocument();
  });

  it('si el servidor falla al eliminar, lo dice y el semestre sigue', async () => {
    const user = await abrir(() => sembrarSemestre('2027-1', 3.5));
    const original = vi.mocked(fetch).getMockImplementation();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) =>
        init?.method === 'DELETE'
          ? new Response(JSON.stringify({ error: 'Error interno.' }), { status: 500 })
          : original?.(entrada, init),
      ),
    );
    await user.click(screen.getByRole('button', { name: /Eliminar 2027-1/ }));
    await user.click(
      within(screen.getByRole('dialog', { name: '¿Eliminar 2027-1?' })).getByRole('button', {
        name: 'Sí, eliminar',
      }),
    );
    expect(await screen.findByText(/El servidor no pudo completar la acción/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '2027-1', level: 3 })).toBeInTheDocument();
  });

  it('al llegar a 20 semestres avisa y no ofrece crear más', async () => {
    const user = await abrir(async () => {
      for (let i = 0; i < 19; i++) await sembrarSemestre(`S${i}`, 3);
    });
    await user.click(screen.getByText('Nuevo semestre'));
    expect(screen.getByText(/Llegaste al máximo de 20 semestres/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre del semestre')).not.toBeInTheDocument();
  });

  it('cada semestre enlaza a su resumen', async () => {
    await abrir();
    expect(screen.getByRole('link', { name: /Ver resumen de 2026-2/ })).toHaveAttribute(
      'href',
      '/?semestre=ejemplo',
    );
  });
});

describe('ContenedorHistorial · estados', () => {
  it('sin semestres invita a crear uno o a cargar el ejemplo', async () => {
    await instalarServidorFalso({ sembrar: null });
    render(<ContenedorHistorial />);
    expect(
      await screen.findByRole('heading', { name: 'Aún no tienes semestres' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cargar datos de ejemplo' })).toBeInTheDocument();
  });

  it('con la sesión vencida lo dice y ofrece iniciar sesión', async () => {
    responderSiempre({ error: 'Necesitas iniciar sesión.' }, 401);
    render(<ContenedorHistorial />);
    expect(await screen.findByRole('heading', { name: 'Tu sesión venció' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/login?siguiente=%2Fhistorial',
    );
  });
});
