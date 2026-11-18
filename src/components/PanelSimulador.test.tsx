import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContenedorMateria } from './ContenedorMateria';
import { ContenedorSimulador } from './ContenedorSimulador';
import { responderConSemestre } from './pruebas-de-datos';

afterEach(() => vi.unstubAllGlobals());

async function abrirSimulador() {
  const user = userEvent.setup();
  responderConSemestre();
  render(<ContenedorSimulador />);
  await screen.findByLabelText('Materia');
  return user;
}

const meta = () => screen.getByLabelText('Meta (3,0 a 5,0)');

describe('PanelSimulador · ¿qué nota necesito?', () => {
  it('con la meta del semestre (3,0) dice qué se necesita en la primera materia', async () => {
    await abrirSimulador();
    expect(
      screen.getByText(/Necesitas al menos 2,8 en el 40 % que falta para llegar a 3,0/),
    ).toBeInTheDocument();
  });

  it('cambiar de materia actualiza el mensaje', async () => {
    const user = await abrirSimulador();
    await user.selectOptions(screen.getByLabelText('Materia'), 'Álgebra lineal');
    expect(screen.getByText(/Necesitas al menos 4,2 en el 40 % que falta/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Materia'), 'Inglés II');
    expect(screen.getByText(/Ya están todas las notas: tu definitiva es 4,1/)).toBeInTheDocument();
  });

  it('una meta que ya no se puede alcanzar se avisa (criterio de aceptación 3)', async () => {
    const user = await abrirSimulador();
    await user.clear(meta());
    await user.type(meta(), '4.5');
    expect(
      screen.getByText(
        'La meta de 4,5 ya no es alcanzable: ni con 5,0 en lo que falta pasas de 3,89.',
      ),
    ).toBeInTheDocument();
  });

  it('una meta fuera de 3,0 a 5,0 se rechaza y no muestra ningún resultado', async () => {
    const user = await abrirSimulador();
    await user.clear(meta());
    await user.type(meta(), '5.5');
    expect(meta()).toHaveAccessibleDescription(/La meta no puede pasar de 5,0\./);
    expect(screen.queryByText(/Necesitas al menos/)).not.toBeInTheDocument();
  });

  it('explica cómo se calcula con un <details> nativo', async () => {
    const user = await abrirSimulador();
    const resumen = screen.getByText('¿Cómo se calcula?');
    expect(resumen.closest('details')).not.toHaveAttribute('open');
    await user.click(resumen);
    expect(resumen.closest('details')).toHaveAttribute('open');
    expect(screen.getByText(/décimas/)).toBeInTheDocument();
  });
});

describe('ContenedorMateria', () => {
  it('muestra el editor de la materia pedida', async () => {
    responderConSemestre();
    render(<ContenedorMateria materiaId="ingles-ii" />);
    expect(await screen.findByRole('heading', { name: /Inglés II/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Nota 3' })).toBeInTheDocument();
  });

  it('una materia que no existe lo dice y ofrece volver al resumen', async () => {
    responderConSemestre();
    render(<ContenedorMateria materiaId="no-existe" />);
    expect(
      await screen.findByRole('heading', { name: 'No encontramos esa materia' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al resumen' })).toHaveAttribute('href', '/');
  });
});
