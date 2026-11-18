import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MenuDeCuenta } from './MenuDeCuenta';
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

describe('MenuDeCuenta', () => {
  it('en modo demostración lo avisa y no ofrece cerrar sesión', async () => {
    await instalarServidorFalso();
    render(<MenuDeCuenta />);
    expect(await screen.findByText('Modo demostración')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument();
  });

  it('con una sesión real muestra el correo y «Cerrar sesión» borra la sesión y lleva a /login', async () => {
    const user = userEvent.setup();
    const fetchFalso = vi.fn(async (_entrada: RequestInfo | URL, init?: RequestInit) =>
      init?.method === 'DELETE'
        ? new Response(null, { status: 204 })
        : new Response(
            JSON.stringify({ uid: 'ana', correo: 'ana@correo.co', rol: 'estudiante', demo: false }),
          ),
    );
    vi.stubGlobal('fetch', fetchFalso);
    render(<MenuDeCuenta />);

    expect(await screen.findByText('ana@correo.co')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await waitFor(() => expect(navegacion.replace).toHaveBeenCalledWith('/login'));
    expect(fetchFalso).toHaveBeenCalledWith(
      '/api/auth/sesion',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(navegacion.refresh).toHaveBeenCalled();
  });

  it('sin sesión (401) no muestra nada', async () => {
    responderSiempre({ error: 'Necesitas iniciar sesión.' }, 401);
    const { container } = render(<MenuDeCuenta />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
