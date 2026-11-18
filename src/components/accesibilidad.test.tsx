import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { violacionesDeAccesibilidad } from '../../vitest.axe';
import { SEMESTRE_DE_EJEMPLO } from '@/repositories/semestres';
import { ContenedorResumen } from './ContenedorResumen';
import { ContenedorSimulador } from './ContenedorSimulador';
import { EditorMateria } from './EditorMateria';
import { responderConSemestre } from './pruebas-de-datos';

afterEach(() => vi.unstubAllGlobals());

const calculo = SEMESTRE_DE_EJEMPLO.materias[0];
if (!calculo) throw new Error('falta la materia de ejemplo');

describe('Accesibilidad con axe (WCAG 2.2 AA y buenas prácticas)', () => {
  it('estado de carga', async () => {
    responderConSemestre();
    const { container } = render(<ContenedorResumen />);
    expect(await violacionesDeAccesibilidad(container)).toEqual([]);
  });

  it('resumen con datos', async () => {
    responderConSemestre();
    const { container } = render(<ContenedorResumen />);
    await screen.findByRole('region', { name: /Resumen de/ });
    expect(await violacionesDeAccesibilidad(container)).toEqual([]);
  });

  it('estado de error con reintento', async () => {
    responderConSemestre({ error: 'x' }, 500);
    const { container } = render(<ContenedorResumen />);
    await screen.findByRole('alert');
    expect(await violacionesDeAccesibilidad(container)).toEqual([]);
  });

  it('editor de materia, con y sin errores de validación', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <EditorMateria materia={calculo} meta={3} guardarMateria={vi.fn()} />,
    );
    expect(await violacionesDeAccesibilidad(container)).toEqual([]);
    await user.type(
      within(screen.getByRole('group', { name: 'Nota 3' })).getByLabelText('Nota (0,0 a 5,0)'),
      '9',
    );
    expect(await violacionesDeAccesibilidad(container)).toEqual([]);
  });

  it('simulador', async () => {
    responderConSemestre();
    const { container } = render(<ContenedorSimulador />);
    await waitFor(() => expect(screen.getByLabelText('Materia')).toBeInTheDocument());
    expect(await violacionesDeAccesibilidad(container)).toEqual([]);
  });
});
