import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SEMESTRE_DE_EJEMPLO } from '@/repositories/ejemplo';
import type { Materia } from '@/schemas/semestre';
import { claveDeBorrador } from '@/storage/borrador';
import { EditorMateria } from './EditorMateria';

function primeraMateria(): Materia {
  const materia = SEMESTRE_DE_EJEMPLO.materias[0];
  if (!materia) throw new Error('falta la materia de ejemplo');
  return materia;
}

const original = primeraMateria();

/** Hace de «cuenta»: al guardar, la materia guardada cambia (como cuando la API refresca la lista). */
function Envoltura({ guardar }: { guardar: (m: Materia) => Promise<void> }) {
  const [guardada, setGuardada] = useState<Materia>(original);
  return (
    <EditorMateria
      semestreId="ejemplo"
      materia={guardada}
      meta={3}
      guardar={async (m) => {
        await guardar(m);
        setGuardada(m);
      }}
    />
  );
}

function preparar(guardar: (m: Materia) => Promise<void> = vi.fn().mockResolvedValue(undefined)) {
  const user = userEvent.setup();
  render(<Envoltura guardar={guardar} />);
  return { user, guardar };
}

const nota = (n: number) => screen.getByRole('group', { name: `Nota ${n}` });
const valorDe = (n: number) => within(nota(n)).getByLabelText('Nota (0,0 a 5,0)');
const porcentajeDe = (n: number) => within(nota(n)).getByLabelText('Porcentaje (%)');
const resultado = () => within(screen.getByRole('region', { name: 'Resultado' }));
const guardarCambios = () => screen.getByRole('button', { name: 'Guardar cambios' });

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

  it('agrega y quita notas', async () => {
    const { user } = preparar();
    await user.click(screen.getByRole('button', { name: 'Agregar nota' }));
    expect(nota(4)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quitar la nota 4' }));
    expect(screen.queryByRole('group', { name: 'Nota 4' })).not.toBeInTheDocument();
  });
});

describe('EditorMateria · guardado explícito y borrador', () => {
  it('sin cambios no hay nada que guardar ni descartar', () => {
    preparar();
    expect(guardarCambios()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Descartar cambios' })).toBeDisabled();
  });

  it('escribir deja un borrador en este navegador, pero NO envía nada a la cuenta', async () => {
    const { user, guardar } = preparar();
    await user.type(valorDe(3), '4');
    expect(guardar).not.toHaveBeenCalled();
    expect(screen.getByText(/Tienes cambios sin guardar/)).toBeInTheDocument();
    expect(window.localStorage.getItem(claveDeBorrador('ejemplo', original.id))).toContain(
      '"valor":4',
    );
  });

  it('«Guardar cambios» envía la materia completa y borra el borrador', async () => {
    const { user, guardar } = preparar();
    await user.type(valorDe(3), '4');
    await user.click(guardarCambios());

    await waitFor(() =>
      expect(screen.getByText('Cambios guardados en tu cuenta.')).toBeInTheDocument(),
    );
    expect(guardar).toHaveBeenCalledWith({
      id: original.id,
      nombre: 'Cálculo diferencial',
      creditos: 4,
      notas: [
        { nombre: 'Primer corte', valor: 3.5, porcentaje: 30 },
        { nombre: 'Segundo corte', valor: 2.8, porcentaje: 30 },
        { nombre: 'Tercer corte', valor: 4, porcentaje: 40 },
      ],
    });
    expect(window.localStorage.getItem(claveDeBorrador('ejemplo', original.id))).toBeNull();
    expect(guardarCambios()).toBeDisabled();
  });

  it('si el servidor rechaza el guardado muestra el motivo y conserva lo escrito', async () => {
    const { user } = preparar(
      vi.fn().mockRejectedValue(new Error('Tu sesión venció. Inicia sesión de nuevo.')),
    );
    await user.type(valorDe(3), '4');
    await user.click(guardarCambios());
    expect(await screen.findByRole('alert')).toHaveTextContent('Tu sesión venció');
    expect(valorDe(3)).toHaveValue(4);
    expect(guardarCambios()).toBeEnabled();
  });

  it('«Descartar cambios» vuelve a lo guardado y borra el borrador', async () => {
    const { user } = preparar();
    await user.type(valorDe(3), '4');
    await user.click(screen.getByRole('button', { name: 'Descartar cambios' }));
    expect(valorDe(3)).toHaveValue(null);
    expect(window.localStorage.getItem(claveDeBorrador('ejemplo', original.id))).toBeNull();
  });

  it('al volver a abrir la materia recupera el borrador que no se guardó', async () => {
    const { user } = preparar();
    await user.type(valorDe(3), '4');
    document.body.innerHTML = '';
    preparar();
    expect(valorDe(3)).toHaveValue(4);
    expect(screen.getByText(/Tienes cambios sin guardar/)).toBeInTheDocument();
  });

  it('se puede cambiar el nombre y los créditos de la materia', async () => {
    const { user, guardar } = preparar();
    await user.clear(screen.getByLabelText('Nombre de la materia'));
    await user.type(screen.getByLabelText('Nombre de la materia'), 'Cálculo I');
    await user.clear(screen.getByLabelText('Créditos (1 a 20)'));
    await user.type(screen.getByLabelText('Créditos (1 a 20)'), '5');
    await user.click(guardarCambios());
    await waitFor(() =>
      expect(guardar).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Cálculo I', creditos: 5 }),
      ),
    );
  });
});

describe('EditorMateria · validación (esquema Zod compartido con el servidor)', () => {
  it('una nota de 5,5 se rechaza con su mensaje, no se calcula y no se puede guardar (criterio del documento)', async () => {
    const { user, guardar } = preparar();
    await user.type(valorDe(3), '5.5');

    expect(valorDe(3)).toHaveAttribute('aria-invalid', 'true');
    expect(valorDe(3)).toHaveAccessibleDescription(/La nota no puede pasar de 5,0\./);
    expect(screen.getByText(/Corrige los datos marcados/)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Resultado' })).not.toBeInTheDocument();
    expect(
      screen.getByText('Hay datos por corregir: no se puede guardar todavía.'),
    ).toBeInTheDocument();
    expect(guardarCambios()).toBeDisabled();
    expect(guardar).not.toHaveBeenCalled();
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

  it('un nombre de materia vacío y créditos en 0 se señalan junto a su campo', async () => {
    const { user } = preparar();
    await user.clear(screen.getByLabelText('Nombre de la materia'));
    await user.clear(screen.getByLabelText('Créditos (1 a 20)'));
    await user.type(screen.getByLabelText('Créditos (1 a 20)'), '0');
    expect(screen.getByLabelText('Nombre de la materia')).toHaveAccessibleDescription(
      /Escribe el nombre de la materia/,
    );
    expect(screen.getByLabelText('Créditos (1 a 20)')).toHaveAccessibleDescription(
      /Mínimo 1 crédito/,
    );
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
