import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { violacionesDeAccesibilidad } from '../../vitest.axe';
import { SEMESTRE_DE_EJEMPLO } from '@/repositories/ejemplo';
import { ContenedorHistorial } from './ContenedorHistorial';
import { ContenedorMateria } from './ContenedorMateria';
import { ContenedorResumen } from './ContenedorResumen';
import { ContenedorSimulador } from './ContenedorSimulador';
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

beforeEach(() => reiniciarNavegacion('/', 'semestre=ejemplo'));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const revisar = async (contenedor: HTMLElement) =>
  expect(await violacionesDeAccesibilidad(contenedor)).toEqual([]);

const calculo = SEMESTRE_DE_EJEMPLO.materias[0];
if (!calculo) throw new Error('falta la materia de ejemplo');

describe('Accesibilidad con axe (WCAG 2.2 AA y buenas prácticas)', () => {
  it('estado de carga', async () => {
    await instalarServidorFalso();
    const { container } = render(<ContenedorResumen />);
    await revisar(container);
  });

  it('resumen con datos y formulario de nueva materia abierto', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso();
    const { container } = render(<ContenedorResumen />);
    await screen.findByRole('region', { name: /Resumen de/ });
    await revisar(container);
    await user.click(screen.getByText('Agregar una materia'));
    await user.click(screen.getByRole('button', { name: 'Crear materia' }));
    await revisar(container);
  });

  it('estado de error con reintento y sesión vencida', async () => {
    responderSiempre({ error: 'x' }, 500);
    const error = render(<ContenedorResumen />);
    await screen.findByRole('alert');
    await revisar(error.container);
    error.unmount();

    responderSiempre({ error: 'x' }, 401);
    const vencida = render(<ContenedorResumen />);
    await screen.findByRole('heading', { name: 'Tu sesión venció' });
    await revisar(vencida.container);
  });

  it('estado vacío, también con errores de validación', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso({ sembrar: null });
    const { container } = render(<ContenedorResumen />);
    await screen.findByRole('heading', { name: 'Aún no tienes semestres' });
    await revisar(container);
    await user.click(screen.getByRole('button', { name: 'Crear semestre' }));
    await revisar(container);
  });

  it('editor de materia, con y sin errores de validación', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso();
    reiniciarNavegacion('/materias/calculo-diferencial', 'semestre=ejemplo');
    const { container } = render(<ContenedorMateria materiaId={calculo.id} />);
    await screen.findByRole('heading', { name: /Cálculo diferencial/ });
    await revisar(container);
    await user.type(
      within(screen.getByRole('group', { name: 'Nota 3' })).getByLabelText('Nota (0,0 a 5,0)'),
      '9',
    );
    await revisar(container);
  });

  it('simulador', async () => {
    await instalarServidorFalso();
    const { container } = render(<ContenedorSimulador />);
    await waitFor(() => expect(screen.getByLabelText('Materia')).toBeInTheDocument());
    await revisar(container);
  });

  it('historial con varios semestres y un semestre en edición', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso();
    await sembrarSemestre('2027-1', 3.5, [
      { nombre: 'Física', creditos: 3, notas: [{ nombre: 'Final', valor: 4, porcentaje: 100 }] },
    ]);
    const { container } = render(<ContenedorHistorial />);
    await screen.findByRole('heading', { name: 'Promedio por semestre' });
    await revisar(container);
    await user.click(screen.getByRole('button', { name: /Editar 2027-1/ }));
    await revisar(container);
  });
});
