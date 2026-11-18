import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { violacionesDeAccesibilidad } from '../../vitest.axe';
import { Calculadora } from './Calculadora';

type Usuario = ReturnType<typeof userEvent.setup>;

function preparar() {
  const user = userEvent.setup();
  const vista = render(<Calculadora />);
  return { user, ...vista };
}

async function cargarEjemplo(user: Usuario) {
  await user.click(screen.getByRole('button', { name: 'Cargar datos de ejemplo' }));
}

const tarjeta = (nombre: string) => within(screen.getByRole('article', { name: nombre }));
const notaDelCorte = (nombre: string, n: number) =>
  within(tarjeta(nombre).getByRole('group', { name: `Corte ${n}` })).getByLabelText(/^Nota/);
const pesoDelCorte = (nombre: string, n: number) =>
  within(tarjeta(nombre).getByRole('group', { name: `Corte ${n}` })).getByLabelText(/^Peso/);
const resumen = () => within(screen.getByRole('region', { name: 'Resumen del semestre' }));

describe('Calculadora · estado vacío', () => {
  it('invita a agregar materias o cargar un ejemplo, y no muestra promedio', () => {
    preparar();
    expect(screen.getByRole('heading', { level: 2, name: 'Mis materias' })).toBeInTheDocument();
    expect(screen.getByText(/Aún no has agregado materias/)).toBeInTheDocument();
    expect(resumen().getByText(/Agrega materias y registra al menos una nota/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Borrar todos los datos' })).toBeDisabled();
  });
});

describe('Calculadora · agregar materias', () => {
  it('agrega una materia con 3 cortes y anuncia el resultado', async () => {
    const { user } = preparar();
    await user.type(screen.getByLabelText('Nombre de la materia'), 'Física I');
    await user.clear(screen.getByLabelText('Créditos'));
    await user.type(screen.getByLabelText('Créditos'), '4');
    await user.click(screen.getByRole('button', { name: 'Agregar materia' }));
    const fisica = tarjeta('Física I');
    expect(fisica.getByText('4 créditos')).toBeInTheDocument();
    expect(fisica.getByText('Sin notas')).toBeInTheDocument();
    expect(fisica.getAllByRole('group')).toHaveLength(3);
    expect(screen.getByText('Materia «Física I» agregada.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de la materia')).toHaveValue('');
    expect(screen.getByLabelText('Nombre de la materia')).toHaveFocus();
  });

  it('sin nombre muestra el error junto al campo, lo marca y lleva el foco allí', async () => {
    const { user } = preparar();
    await user.click(screen.getByRole('button', { name: 'Agregar materia' }));
    const campo = screen.getByLabelText('Nombre de la materia');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveFocus();
    expect(campo).toHaveAccessibleDescription(/Escribe el nombre de la materia/);
  });

  it('créditos inválidos se rechazan con un mensaje claro', async () => {
    const { user } = preparar();
    await user.type(screen.getByLabelText('Nombre de la materia'), 'Química');
    await user.clear(screen.getByLabelText('Créditos'));
    await user.type(screen.getByLabelText('Créditos'), '2,5');
    await user.click(screen.getByRole('button', { name: 'Agregar materia' }));
    expect(screen.getByLabelText('Créditos')).toHaveAccessibleDescription(
      /número entero entre 1 y 20/,
    );
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});

describe('Calculadora · cálculo con datos de ejemplo', () => {
  it('muestra el promedio ponderado por créditos y el simulador de la nota necesaria', async () => {
    const { user } = preparar();
    await cargarEjemplo(user);
    expect(resumen().getByText(/3,37/)).toBeInTheDocument();
    expect(resumen().getByText('12 de 12')).toBeInTheDocument();
    expect(
      tarjeta('Cálculo diferencial').getByText(
        'Necesitas sacar al menos 2,78 en el Corte 3 (vale 40 % de la nota) para llegar a 3,0.',
      ),
    ).toBeInTheDocument();
    expect(tarjeta('Inglés II').getByText('Aprobada')).toBeInTheDocument();
  });

  it('al registrar la última nota calcula la definitiva y cambia el estado', async () => {
    const { user } = preparar();
    await cargarEjemplo(user);
    await user.type(notaDelCorte('Cálculo diferencial', 3), '5');
    const calculo = tarjeta('Cálculo diferencial');
    expect(calculo.getByText('Definitiva').closest('div')).toHaveTextContent('3,89');
    expect(calculo.getByText('Aprobada')).toBeInTheDocument();
  });

  it('acepta coma decimal y no la borra mientras se escribe', async () => {
    const { user } = preparar();
    await cargarEjemplo(user);
    const campo = notaDelCorte('Álgebra lineal', 3);
    await user.type(campo, '4,5');
    expect(campo).toHaveValue('4,5');
    expect(tarjeta('Álgebra lineal').getByText('Aprobada')).toBeInTheDocument();
  });

  it('una meta propia cambia el mensaje del simulador', async () => {
    const { user } = preparar();
    await cargarEjemplo(user);
    const web = tarjeta('Programación web');
    await user.type(web.getByLabelText(/Nota que quiero sacar/), '4,5');
    expect(web.getByText(/al menos 4,73 en el Corte 3/)).toBeInTheDocument();
    await user.clear(web.getByLabelText(/Nota que quiero sacar/));
    await user.type(web.getByLabelText(/Nota que quiero sacar/), '9');
    expect(web.getByText(/La meta debe estar entre 0 y 5/)).toBeInTheDocument();
  });
});

describe('Calculadora · datos inválidos', () => {
  it('una nota fuera de rango se señala y esa materia deja de contar en el promedio', async () => {
    const { user } = preparar();
    await cargarEjemplo(user);
    const campo = notaDelCorte('Cálculo diferencial', 3);
    await user.type(campo, '6');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription(/La nota debe estar entre 0 y 5\./);
    expect(
      tarjeta('Cálculo diferencial').getByText(/Corrige los datos marcados/),
    ).toBeInTheDocument();
    expect(resumen().getByText(/1 materia tiene datos por corregir/)).toBeInTheDocument();
  });

  it('un texto que no es número se avisa en el propio campo', async () => {
    const { user } = preparar();
    await cargarEjemplo(user);
    const campo = notaDelCorte('Inglés II', 1);
    await user.clear(campo);
    await user.type(campo, 'abc');
    expect(campo).toHaveAccessibleDescription(/Escribe un número/);
  });

  it('si los porcentajes no suman 100 lo dice y no calcula', async () => {
    const { user } = preparar();
    await cargarEjemplo(user);
    const peso = pesoDelCorte('Cálculo diferencial', 1);
    await user.clear(peso);
    await user.type(peso, '20');
    expect(
      tarjeta('Cálculo diferencial').getByText(/Los porcentajes suman 90 %; deben sumar 100 %\./),
    ).toBeInTheDocument();
    expect(
      tarjeta('Cálculo diferencial').getByText(/Corrige los datos marcados/),
    ).toBeInTheDocument();
  });

  it('agregar y quitar cortes respeta los límites', async () => {
    const { user } = preparar();
    await cargarEjemplo(user);
    const calculo = tarjeta('Cálculo diferencial');
    await user.click(calculo.getByRole('button', { name: 'Agregar corte' }));
    expect(calculo.getAllByRole('group')).toHaveLength(4);
    await user.click(calculo.getByRole('button', { name: 'Quitar último corte' }));
    await user.click(calculo.getByRole('button', { name: 'Quitar último corte' }));
    await user.click(calculo.getByRole('button', { name: 'Quitar último corte' }));
    expect(calculo.getAllByRole('group')).toHaveLength(1);
    expect(calculo.getByRole('button', { name: 'Quitar último corte' })).toBeDisabled();
  });
});

describe('Calculadora · editar y eliminar', () => {
  it('edita el nombre y los créditos de una materia', async () => {
    const { user } = preparar();
    await cargarEjemplo(user);
    await user.click(screen.getByRole('button', { name: 'Editar Inglés II' }));
    const form = tarjeta('Inglés II');
    const nombre = form.getByLabelText('Nombre de la materia');
    await user.clear(nombre);
    await user.type(nombre, 'Inglés III');
    await user.click(form.getByRole('button', { name: 'Guardar cambios' }));
    expect(screen.getByRole('article', { name: 'Inglés III' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Editar Inglés III' })).toHaveFocus(),
    );
  });

  it('pide confirmación antes de eliminar y devuelve el foco a la lista', async () => {
    const { user } = preparar();
    await cargarEjemplo(user);
    await user.click(screen.getByRole('button', { name: 'Eliminar Inglés II' }));
    const dialogo = screen.getByRole('dialog', { name: '¿Eliminar «Inglés II»?' });
    expect(dialogo).toHaveAccessibleDescription(/No se puede deshacer/);
    await user.click(within(dialogo).getByRole('button', { name: 'Sí, eliminar' }));
    expect(screen.queryByRole('article', { name: 'Inglés II' })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Mis materias/ })).toHaveFocus(),
    );
  });

  it('cancelar no elimina nada', async () => {
    const { user } = preparar();
    await cargarEjemplo(user);
    await user.click(screen.getByRole('button', { name: 'Eliminar Inglés II' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('article', { name: 'Inglés II' })).toBeInTheDocument();
  });

  it('borrar todo y reemplazar por el ejemplo piden confirmación', async () => {
    const { user } = preparar();
    await cargarEjemplo(user);
    await user.click(screen.getByRole('button', { name: 'Cargar datos de ejemplo' }));
    expect(screen.getByRole('dialog', { name: /Reemplazar tus materias/ })).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Borrar todos los datos' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Sí, borrar todo' }),
    );
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByText(/Aún no has agregado materias/)).toBeInTheDocument();
  });
});

describe('Calculadora · escala de notas', () => {
  it('no guarda una escala imposible y recalcula con una válida', async () => {
    const { user } = preparar();
    await cargarEjemplo(user);
    const minima = screen.getByLabelText('Nota mínima para aprobar');
    await user.clear(minima);
    await user.type(minima, '6');
    expect(minima).toHaveAccessibleDescription(/no puede superar la nota máxima/);
    expect(resumen().getByText(/mínima para aprobar \(3,0\)/)).toBeInTheDocument();
    const maxima = screen.getByLabelText('Nota máxima');
    await user.clear(maxima);
    await user.type(maxima, '10');
    expect(minima).not.toHaveAttribute('aria-invalid');
    expect(resumen().getByText(/mínima para aprobar \(6,0\)/)).toBeInTheDocument();
    expect(screen.getAllByLabelText('Nota (0–10)').length).toBeGreaterThan(0);
  });

  it('al cargar el ejemplo vuelve a la escala 0–5 y los campos lo reflejan', async () => {
    const { user } = preparar();
    await cargarEjemplo(user);
    await user.clear(screen.getByLabelText('Nota máxima'));
    await user.type(screen.getByLabelText('Nota máxima'), '10');
    await user.click(screen.getByRole('button', { name: 'Borrar todos los datos' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Sí, borrar todo' }),
    );
    await cargarEjemplo(user);
    expect(screen.getByLabelText('Nota máxima')).toHaveValue('5');
  });
});

describe('Calculadora · persistencia', () => {
  it('lo que se registra sigue ahí al volver a abrir la página', async () => {
    const primera = preparar();
    await cargarEjemplo(primera.user);
    primera.unmount();
    preparar();
    expect(screen.getByRole('article', { name: 'Cálculo diferencial' })).toBeInTheDocument();
    expect(resumen().getByText(/3,37/)).toBeInTheDocument();
  });
});

describe('Calculadora · accesibilidad (axe)', () => {
  it('sin violaciones en el estado vacío', async () => {
    const { container } = preparar();
    expect(await violacionesDeAccesibilidad(container)).toEqual([]);
  });

  it('sin violaciones con datos de ejemplo', async () => {
    const { user, container } = preparar();
    await cargarEjemplo(user);
    expect(await violacionesDeAccesibilidad(container)).toEqual([]);
  });

  it('sin violaciones con errores de validación visibles', async () => {
    const { user, container } = preparar();
    await cargarEjemplo(user);
    await user.type(notaDelCorte('Cálculo diferencial', 3), '9');
    await user.click(screen.getByRole('button', { name: 'Agregar materia' }));
    expect(await violacionesDeAccesibilidad(container)).toEqual([]);
  });

  it('sin violaciones al editar una materia y con el diálogo abierto', async () => {
    const { user, container } = preparar();
    await cargarEjemplo(user);
    await user.click(screen.getByRole('button', { name: 'Editar Inglés II' }));
    expect(await violacionesDeAccesibilidad(container)).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'Eliminar Inglés II' }));
    expect(await violacionesDeAccesibilidad(container)).toEqual([]);
  });
});
