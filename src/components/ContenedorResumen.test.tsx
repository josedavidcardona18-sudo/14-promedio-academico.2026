import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContenedorResumen } from './ContenedorResumen';
import {
  instalarServidorFalso,
  navegacion,
  reiniciarNavegacion,
  responderSiempre,
} from './pruebas-de-datos';

vi.mock('next/navigation', async () => (await import('./pruebas-de-datos')).moduloNavegacionFalso);
vi.mock(
  '@/lib/firebase-admin',
  async () => (await import('@/app/api/pruebas-api')).moduloFirebaseFalso,
);
vi.mock('@/repositories', async () => (await import('@/app/api/pruebas-api')).moduloRepositorios);

beforeEach(() => reiniciarNavegacion());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const tarjeta = (nombre: string) => within(screen.getByRole('article', { name: nombre }));

describe('ContenedorResumen · carga, datos y error', () => {
  it('muestra «cargando» y luego el promedio ponderado y el estado de cada materia', async () => {
    await instalarServidorFalso();
    render(<ContenedorResumen />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando tus materias');

    const resumen = await screen.findByRole('region', { name: /Resumen de 2026-2/ });
    expect(resumen).toHaveTextContent('3,37');
    expect(within(resumen).getByText('12 de 12')).toBeInTheDocument();
    expect(tarjeta('Cálculo diferencial').getByText('Aprobando')).toBeInTheDocument();
    expect(tarjeta('Álgebra lineal').getByText('En riesgo')).toBeInTheDocument();
    expect(tarjeta('Inglés II').getByText('Aprobada')).toBeInTheDocument();
  });

  it('cada materia dice qué necesita y enlaza a su pantalla de notas (conservando el semestre)', async () => {
    await instalarServidorFalso();
    render(<ContenedorResumen />);
    const calculo = await screen.findByRole('article', { name: 'Cálculo diferencial' });
    expect(
      within(calculo).getByText(/Necesitas al menos 2,8 en el 40 % que falta/),
    ).toBeInTheDocument();
    expect(
      within(calculo).getByRole('link', { name: 'Ver y editar notas de Cálculo diferencial' }),
    ).toHaveAttribute('href', '/materias/calculo-diferencial?semestre=ejemplo');
  });

  it('si la API falla muestra el error y «Reintentar» vuelve a pedir los datos', async () => {
    const user = userEvent.setup();
    responderSiempre({ error: 'Error interno.' }, 500);
    render(<ContenedorResumen />);

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('No pudimos cargar tus datos');
    expect(alerta).toHaveTextContent('El servidor no pudo completar la acción');

    await instalarServidorFalso();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('region', { name: /Resumen de/ })).toBeInTheDocument();
    expect(screen.queryByText('No pudimos cargar tus datos')).not.toBeInTheDocument();
  });

  it('sin conexión explica qué pasó, sin mostrar detalles técnicos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    render(<ContenedorResumen />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión con el servidor');
    expect(screen.getByRole('alert')).not.toHaveTextContent('Failed to fetch');
  });

  it('con la sesión vencida (401) lo dice y ofrece iniciar sesión, volviendo a esta página', async () => {
    reiniciarNavegacion('/simulador');
    responderSiempre({ error: 'Necesitas iniciar sesión.' }, 401);
    render(<ContenedorResumen />);
    expect(await screen.findByRole('heading', { name: 'Tu sesión venció' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/login?siguiente=%2Fsimulador',
    );
  });
});

describe('ContenedorResumen · semestres y materias', () => {
  it('sin semestres ofrece cargar datos de ejemplo', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso({ sembrar: null });
    render(<ContenedorResumen />);

    expect(
      await screen.findByRole('heading', { name: 'Aún no tienes semestres' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cargar datos de ejemplo' }));
    expect(await screen.findByRole('region', { name: /Resumen de 2026-2/ })).toBeInTheDocument();
  });

  it('sin semestres también se puede crear el primero, con validación junto a cada campo', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso({ sembrar: null });
    render(<ContenedorResumen />);
    await screen.findByRole('heading', { name: 'Aún no tienes semestres' });

    await user.click(screen.getByRole('button', { name: 'Crear semestre' }));
    expect(screen.getByLabelText('Nombre del semestre')).toHaveAccessibleDescription(
      'Escribe el nombre del semestre.',
    );

    await user.type(screen.getByLabelText('Nombre del semestre'), '2027-1');
    await user.click(screen.getByRole('button', { name: 'Crear semestre' }));
    expect(await screen.findByRole('region', { name: 'Resumen de 2027-1' })).toBeInTheDocument();
    expect(screen.getByText(/aún no tiene materias/)).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('?semestre= elige el semestre y el selector cambia la dirección', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso();
    const { POST } = await import('@/app/api/semestres/route');
    await POST(
      new Request('http://localhost/api/semestres', {
        method: 'POST',
        headers: { origin: 'http://localhost', 'content-type': 'application/json' },
        body: JSON.stringify({ nombre: '2027-1', meta: 3.5 }),
      }),
      {},
    );
    reiniciarNavegacion('/', 'semestre=ejemplo');
    render(<ContenedorResumen />);
    expect(await screen.findByRole('region', { name: /Resumen de 2026-2/ })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Semestre'), '2027-1');
    expect(navegacion.replace).toHaveBeenCalledWith(expect.stringMatching(/^\/\?semestre=/));
  });

  it('agregar una materia la crea y lleva a su pantalla de notas', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso();
    render(<ContenedorResumen />);
    await screen.findByRole('region', { name: /Resumen de/ });

    await user.click(screen.getByText('Agregar una materia'));
    await user.type(screen.getByLabelText('Nombre de la materia'), 'Física I');
    await user.click(screen.getByRole('button', { name: 'Crear materia' }));

    await waitFor(() => expect(navegacion.push).toHaveBeenCalledTimes(1));
    expect(navegacion.push).toHaveBeenCalledWith(
      expect.stringMatching(/^\/materias\/[\w-]+\?semestre=ejemplo$/),
    );
  });

  it('una materia sin nombre no se envía y el error queda junto al campo', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso();
    render(<ContenedorResumen />);
    await screen.findByRole('region', { name: /Resumen de/ });
    await user.click(screen.getByText('Agregar una materia'));
    await user.click(screen.getByRole('button', { name: 'Crear materia' }));
    expect(screen.getByLabelText('Nombre de la materia')).toHaveAccessibleDescription(
      /Escribe el nombre de la materia/,
    );
    expect(navegacion.push).not.toHaveBeenCalled();
  });

  it('si el servidor rechaza la acción (409) se muestra su mensaje', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso();
    render(<ContenedorResumen />);
    await screen.findByRole('region', { name: /Resumen de/ });
    const original = vi.mocked(fetch).getMockImplementation();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) =>
        init?.method === 'POST'
          ? new Response(JSON.stringify({ error: 'Llegaste al máximo de 30 materias.' }), {
              status: 409,
            })
          : original?.(entrada, init),
      ),
    );
    await user.click(screen.getByText('Agregar una materia'));
    await user.type(screen.getByLabelText('Nombre de la materia'), 'Una más');
    await user.click(screen.getByRole('button', { name: 'Crear materia' }));
    expect(await screen.findByText('Llegaste al máximo de 30 materias.')).toBeInTheDocument();
  });
});

describe('ContenedorResumen · imprimir', () => {
  it('«Imprimir resumen» usa window.print; si no existe, ofrece la alternativa', async () => {
    const user = userEvent.setup();
    await instalarServidorFalso();
    render(<ContenedorResumen />);
    await screen.findByRole('region', { name: /Resumen de/ });

    const imprimir = vi.fn();
    vi.stubGlobal('print', imprimir);
    await user.click(screen.getByRole('button', { name: 'Imprimir resumen' }));
    expect(imprimir).toHaveBeenCalledTimes(1);

    vi.stubGlobal('print', undefined);
    await user.click(screen.getByRole('button', { name: 'Imprimir resumen' }));
    await waitFor(() =>
      expect(screen.getByText(/usa una captura de pantalla/)).toBeInTheDocument(),
    );
  });
});
