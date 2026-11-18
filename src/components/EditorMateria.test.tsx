import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SEMESTRE_DE_EJEMPLO } from '@/repositories/semestres';
import { EditorMateria } from './EditorMateria';

function primeraMateria() {
  const materia = SEMESTRE_DE_EJEMPLO.materias[0];
  if (!materia) throw new Error('falta la materia de ejemplo');
  return materia;
}

function preparar() {
  const user = userEvent.setup();
  const guardar = vi.fn();
  render(<EditorMateria materia={primeraMateria()} meta={3} guardarMateria={guardar} />);
  return { user, guardar };
}

const nota = (n: number) => screen.getByRole('group', { name: `Nota ${n}` });
const valorDe = (n: number) => within(nota(n)).getByLabelText('Nota (0,0 a 5,0)');
const porcentajeDe = (n: number) => within(nota(n)).getByLabelText('Porcentaje (%)');
const resultado = () => within(screen.getByRole('region', { name: 'Resultado' }));

describe('EditorMateria · resultados que se actualizan al escribir', () => {
  it('muestra el resultado inicial: promedio, acumulado y lo que se necesita', () => {
    preparar();
    expect(resultado().getByText('Promedio actual').closest('div')).toHaveTextContent('3,15');
    expect(resultado().getByText('Acumulado').closest('div')).toHaveTextContent('1,89');
    expect(resultado().getByText('Definitiva').closest('div')).toHaveTextContent('Pendiente');
    expect(
      resultado().getByText(/Necesitas al menos 2,8 en el 40 % que falta/),
    ).toBeInTheDocument();
  });

  it('al escribir la última nota calcula la definitiva y cambia el estado', async () => {
    const { user } = preparar();
    await user.type(valorDe(3), '5');
    expect(resultado().getByText('Definitiva').closest('div')).toHaveTextContent('3,89');
    expect(resultado().getByText('Aprobada')).toBeInTheDocument();
  });

  it('guarda el borrador solo cuando los datos son válidos', async () => {
    const { user, guardar } = preparar();
    await user.type(valorDe(3), '4');
    expect(guardar).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'calculo-diferencial', notas: expect.any(Array) }),
    );
    expect(
      screen.getByText('Cambios guardados como borrador en este navegador.'),
    ).toBeInTheDocument();
  });

  it('agrega y quita notas', async () => {
    const { user } = preparar();
    await user.click(screen.getByRole('button', { name: 'Agregar nota' }));
    expect(nota(4)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quitar la nota 4' }));
    expect(screen.queryByRole('group', { name: 'Nota 4' })).not.toBeInTheDocument();
  });
});

describe('EditorMateria · validación (esquema Zod compartido con el servidor)', () => {
  it('una nota de 5,5 se rechaza con su mensaje y no se calcula (criterio del documento)', async () => {
    const { user, guardar } = preparar();
    await user.type(valorDe(3), '5.5');

    expect(valorDe(3)).toHaveAttribute('aria-invalid', 'true');
    expect(valorDe(3)).toHaveAccessibleDescription(/La nota no puede pasar de 5,0\./);
    expect(screen.getByText(/Corrige los datos marcados/)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Resultado' })).not.toBeInTheDocument();
    expect(guardar).not.toHaveBeenCalledWith(
      expect.objectContaining({
        notas: expect.arrayContaining([expect.objectContaining({ valor: 5.5 })]),
      }),
    );
    expect(
      screen.getByText('Hay datos por corregir: el borrador no se actualizó.'),
    ).toBeInTheDocument();
  });

  it('porcentajes que suman 110 % se rechazan y el error se explica una sola vez (criterio 2)', async () => {
    const { user } = preparar();
    await user.clear(porcentajeDe(3));
    await user.type(porcentajeDe(3), '50');

    const mensaje = 'Los porcentajes suman 110 %; no pueden pasar de 100 %.';
    expect(screen.getAllByText(mensaje)).toHaveLength(1);
    expect(porcentajeDe(3)).toHaveAttribute('aria-invalid', 'true');
    expect(porcentajeDe(3)).toHaveAccessibleDescription(expect.stringContaining(mensaje));
    expect(screen.getByText(/Corrige los datos marcados/)).toBeInTheDocument();
  });

  it('la validación nativa del campo (Constraint Validation API) refleja el mensaje', async () => {
    const { user } = preparar();
    await user.type(valorDe(3), '6');
    const campo = valorDe(3);
    if (!(campo instanceof HTMLInputElement)) throw new Error('se esperaba un input');
    expect(campo.type).toBe('number');
    expect(campo.checkValidity()).toBe(false);
    expect(campo.validationMessage).toBe('La nota no puede pasar de 5,0.');

    await user.clear(campo);
    await user.type(campo, '4');
    expect(campo.checkValidity()).toBe(true);
    expect(campo.validationMessage).toBe('');
  });

  it('un nombre vacío en una nota se señala junto a su campo', async () => {
    const { user } = preparar();
    await user.clear(within(nota(1)).getByLabelText('Nombre'));
    expect(within(nota(1)).getByLabelText('Nombre')).toHaveAccessibleDescription(
      /Escribe el nombre de la nota\./,
    );
  });

  it('una nota vacía (sin valor) es válida: queda como pendiente', async () => {
    const { user } = preparar();
    await user.clear(valorDe(1));
    expect(valorDe(1)).not.toHaveAttribute('aria-invalid');
    expect(resultado().getByText('Acumulado').closest('div')).toHaveTextContent('0,84');
  });
});
