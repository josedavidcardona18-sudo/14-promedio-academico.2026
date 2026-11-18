import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { claveDeBorrador } from '@/storage/borrador';
import { ContenedorMateria } from './ContenedorMateria';
import { ContenedorSimulador } from './ContenedorSimulador';
import { instalarServidorFalso, navegacion, reiniciarNavegacion } from './pruebas-de-datos';

vi.mock('next/navigation', async () => (await import('./pruebas-de-datos')).moduloNavegacionFalso);
vi.mock(
  '@/lib/firebase-admin',
  async () => (await import('@/app/api/pruebas-api')).moduloFirebaseFalso,
);
vi.mock('@/repositories', async () => (await import('@/app/api/pruebas-api')).moduloRepositorios);

beforeEach(() => reiniciarNavegacion('/simulador', 'semestre=ejemplo'));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function abrirSimulador() {
  const user = userEvent.setup();
  await instalarServidorFalso();
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

  it('un semestre sin materias lo explica y lleva a agregarlas', async () => {
    await instalarServidorFalso({ sembrar: null });
    const { POST } = await import('@/app/api/semestres/route');
    const creado = await POST(
      new Request('http://localhost/api/semestres', {
        method: 'POST',
        headers: { origin: 'http://localhost', 'content-type': 'application/json' },
        body: JSON.stringify({ nombre: 'Vacío', meta: 3 }),
      }),
      {},
    );
    reiniciarNavegacion('/simulador', `semestre=${(await creado.json()).id}`);
    render(<ContenedorSimulador />);
    expect(await screen.findByText(/aún no tiene materias/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Agrega una' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/\?semestre=/),
    );
  });
});

describe('ContenedorMateria', () => {
  it('muestra el editor de la materia pedida y enlaza de vuelta al resumen del semestre', async () => {
    await instalarServidorFalso();
    reiniciarNavegacion('/materias/ingles-ii', 'semestre=ejemplo');
    render(<ContenedorMateria materiaId="ingles-ii" />);
    expect(await screen.findByRole('heading', { name: /Inglés II/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Nota 3' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver al resumen de 2026-2/ })).toHaveAttribute(
      'href',
      '/?semestre=ejemplo',
    );
  });

  it('una materia que no existe lo dice y ofrece volver al resumen', async () => {
    await instalarServidorFalso();
    reiniciarNavegacion('/materias/no-existe', 'semestre=ejemplo');
    render(<ContenedorMateria materiaId="no-existe" />);
    expect(
      await screen.findByRole('heading', { name: 'No encontramos esa materia' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al resumen' })).toHaveAttribute(
      'href',
      '/?semestre=ejemplo',
    );
  });

  it('guarda los cambios en la cuenta: al volver a abrir la materia, siguen ahí', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso();
    reiniciarNavegacion('/materias/calculo-diferencial', 'semestre=ejemplo');
    const { unmount } = render(<ContenedorMateria materiaId="calculo-diferencial" />);
    await screen.findByRole('heading', { name: /Cálculo diferencial/ });
    const tercera = within(screen.getByRole('group', { name: 'Nota 3' })).getByLabelText(
      'Nota (0,0 a 5,0)',
    );
    await user.type(tercera, '4.5');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await screen.findByText('Cambios guardados en tu cuenta.');
    unmount();

    render(<ContenedorMateria materiaId="calculo-diferencial" />);
    await screen.findByRole('heading', { name: /Cálculo diferencial/ });
    const recargada = within(screen.getByRole('group', { name: 'Nota 3' })).getByLabelText(
      'Nota (0,0 a 5,0)',
    );
    expect(recargada).toHaveValue(4.5);
  });

  it('eliminar la materia pide confirmación y, al confirmar, vuelve al resumen', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso();
    reiniciarNavegacion('/materias/ingles-ii', 'semestre=ejemplo');
    render(<ContenedorMateria materiaId="ingles-ii" />);
    await screen.findByRole('heading', { name: /Inglés II/ });

    await user.click(screen.getByRole('button', { name: 'Eliminar materia' }));
    const dialogo = screen.getByRole('dialog', { name: '¿Eliminar Inglés II?' });
    await user.click(within(dialogo).getByRole('button', { name: 'Sí, eliminar' }));

    expect(navegacion.replace).toHaveBeenCalledWith('/?semestre=ejemplo');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Materia eliminada. Volviendo al resumen…',
    );
    expect(
      screen.queryByRole('heading', { name: 'No encontramos esa materia' }),
    ).not.toBeInTheDocument();
    const { GET } = await import('@/app/api/semestres/[id]/materias/[materiaId]/route');
    const r = await GET(new Request('http://localhost/api/semestres/ejemplo/materias/ingles-ii'), {
      params: Promise.resolve({ id: 'ejemplo', materiaId: 'ingles-ii' }),
    });
    expect(r.status).toBe(404);
  });

  it('al eliminar también se borra su borrador local', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso();
    reiniciarNavegacion('/materias/ingles-ii', 'semestre=ejemplo');
    window.localStorage.setItem(claveDeBorrador('ejemplo', 'ingles-ii'), '{"viejo":true}');
    render(<ContenedorMateria materiaId="ingles-ii" />);
    await screen.findByRole('heading', { name: /Inglés II/ });
    await user.click(screen.getByRole('button', { name: 'Eliminar materia' }));
    await user.click(
      within(screen.getByRole('dialog', { name: '¿Eliminar Inglés II?' })).getByRole('button', {
        name: 'Sí, eliminar',
      }),
    );
    await waitFor(() => expect(navegacion.replace).toHaveBeenCalled());
    expect(window.localStorage.getItem(claveDeBorrador('ejemplo', 'ingles-ii'))).toBeNull();
  });

  it('si el servidor falla al eliminar, la materia sigue y se muestra el error (sin «No encontramos»)', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso();
    reiniciarNavegacion('/materias/ingles-ii', 'semestre=ejemplo');
    render(<ContenedorMateria materiaId="ingles-ii" />);
    await screen.findByRole('heading', { name: /Inglés II/ });
    const original = vi.mocked(fetch).getMockImplementation();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) =>
        init?.method === 'DELETE'
          ? new Response(JSON.stringify({ error: 'Error interno.' }), { status: 500 })
          : original?.(entrada, init),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Eliminar materia' }));
    await user.click(
      within(screen.getByRole('dialog', { name: '¿Eliminar Inglés II?' })).getByRole('button', {
        name: 'Sí, eliminar',
      }),
    );
    expect(await screen.findByText(/El servidor no pudo completar la acción/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Inglés II/ })).toBeInTheDocument();
    expect(navegacion.replace).not.toHaveBeenCalled();
  });
});
