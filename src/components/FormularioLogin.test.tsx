import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { violacionesDeAccesibilidad } from '../../vitest.axe';
import { ErrorDeApi } from '@/lib/api-cliente';
import { FormularioLogin } from './FormularioLogin';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  obtenerIdToken: vi.fn(),
  abrirSesion: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
vi.mock('@/lib/firebase-cliente', async (original) => ({
  ...(await original<typeof import('@/lib/firebase-cliente')>()),
  obtenerIdToken: mocks.obtenerIdToken,
}));
vi.mock('@/lib/api-cliente', async (original) => ({
  ...(await original<typeof import('@/lib/api-cliente')>()),
  abrirSesion: mocks.abrirSesion,
}));

beforeEach(() => {
  for (const f of Object.values(mocks)) f.mockReset();
});

async function llenar(correo: string, clave: string) {
  const user = userEvent.setup();
  if (correo) await user.type(screen.getByLabelText('Correo electrónico'), correo);
  if (clave) await user.type(screen.getByLabelText('Contraseña'), clave);
  return user;
}
const enviar = (user: ReturnType<typeof userEvent.setup>, nombre = 'Entrar') =>
  user.click(screen.getByRole('button', { name: nombre }));

describe('FormularioLogin', () => {
  it('entra: cambia el token por la cookie y lleva a la página pedida', async () => {
    mocks.obtenerIdToken.mockResolvedValue('token');
    render(<FormularioLogin siguiente="/historial" />);
    await enviar(await llenar('ana@correo.co', '123456'));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/historial'));
    expect(mocks.obtenerIdToken).toHaveBeenCalledWith('entrar', {
      correo: 'ana@correo.co',
      clave: '123456',
    });
    expect(mocks.abrirSesion).toHaveBeenCalledWith('token');
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it('valida antes de enviar: cada error queda junto a su campo y no se llama a Firebase', async () => {
    render(<FormularioLogin siguiente="/" />);
    await enviar(await llenar('sin-arroba', '123'));
    expect(screen.getByLabelText('Correo electrónico')).toHaveAccessibleDescription(
      /Escribe un correo válido/,
    );
    expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription(
      /al menos 6 caracteres/,
    );
    expect(mocks.obtenerIdToken).not.toHaveBeenCalled();
  });

  it('muestra el error de la cuenta como alerta y deja reintentar', async () => {
    mocks.obtenerIdToken.mockRejectedValue({ code: 'auth/invalid-credential' });
    render(<FormularioLogin siguiente="/" />);
    await enviar(await llenar('ana@correo.co', '123456'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('muestra el mensaje del servidor si no acepta la sesión', async () => {
    mocks.obtenerIdToken.mockResolvedValue('token');
    mocks.abrirSesion.mockRejectedValue(new ErrorDeApi('Tu inicio de sesión es muy antiguo.', 401));
    render(<FormularioLogin siguiente="/" />);
    await enviar(await llenar('ana@correo.co', '123456'));
    expect(await screen.findByRole('alert')).toHaveTextContent('muy antiguo');
  });

  it('cambia a crear cuenta, avisa del mínimo de contraseña y registra', async () => {
    mocks.obtenerIdToken.mockResolvedValue('token');
    render(<FormularioLogin siguiente="/" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '¿No tienes cuenta? Crear una' }));
    expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription('Mínimo 6 caracteres.');
    await user.type(screen.getByLabelText('Correo electrónico'), 'nuevo@correo.co');
    await user.type(screen.getByLabelText('Contraseña'), '123456');
    await enviar(user, 'Crear cuenta');
    await waitFor(() =>
      expect(mocks.obtenerIdToken).toHaveBeenCalledWith('registrar', expect.anything()),
    );
  });

  it('no tiene violaciones de accesibilidad (axe)', async () => {
    const { container } = render(<FormularioLogin siguiente="/" />);
    expect(await violacionesDeAccesibilidad(container)).toEqual([]);
  });
});
