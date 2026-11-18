import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  configCliente,
  ErrorDeCuenta,
  mensajeDeCuenta,
  obtenerIdToken,
  reiniciarClienteParaPruebas,
} from './firebase-cliente';

const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({ nombre: 'app' })),
  getApps: vi.fn<() => unknown[]>(() => []),
  getApp: vi.fn(),
  initializeAuth: vi.fn(() => ({ nombre: 'auth' })),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
}));
vi.mock('@firebase/app', () => ({
  initializeApp: sdk.initializeApp,
  getApps: sdk.getApps,
  getApp: sdk.getApp,
}));
vi.mock('@firebase/auth', () => ({
  initializeAuth: sdk.initializeAuth,
  inMemoryPersistence: 'memoria',
  signInWithEmailAndPassword: sdk.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: sdk.createUserWithEmailAndPassword,
}));

const credenciales = { correo: 'ana@correo.co', clave: '123456' };

function configurar() {
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'clave-publica');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'x.firebaseapp.com');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'x');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_APP_ID', '1:2:web:3');
}

beforeEach(() => {
  vi.unstubAllEnvs();
  reiniciarClienteParaPruebas();
  for (const f of Object.values(sdk)) f.mockClear();
  sdk.getApps.mockReturnValue([]);
});

describe('configCliente', () => {
  it('es null si falta cualquiera de las cuatro variables públicas', () => {
    expect(configCliente()).toBeNull();
    configurar();
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_APP_ID', '');
    expect(configCliente()).toBeNull();
  });

  it('con todas, arma la configuración web', () => {
    configurar();
    expect(configCliente()).toEqual({
      apiKey: 'clave-publica',
      authDomain: 'x.firebaseapp.com',
      projectId: 'x',
      appId: '1:2:web:3',
    });
  });
});

describe('obtenerIdToken', () => {
  it('sin configuración explica que el inicio de sesión no está listo (y no carga nada)', async () => {
    await expect(obtenerIdToken('entrar', credenciales)).rejects.toBeInstanceOf(ErrorDeCuenta);
    expect(sdk.initializeApp).not.toHaveBeenCalled();
  });

  it('entrar: inicia sesión sin guardar nada en el navegador y entrega el idToken', async () => {
    configurar();
    sdk.signInWithEmailAndPassword.mockResolvedValue({
      user: { getIdToken: async () => 'token-1' },
    });
    expect(await obtenerIdToken('entrar', credenciales)).toBe('token-1');
    expect(sdk.initializeAuth).toHaveBeenCalledWith({ nombre: 'app' }, { persistence: 'memoria' });
    expect(sdk.signInWithEmailAndPassword).toHaveBeenCalledWith(
      { nombre: 'auth' },
      'ana@correo.co',
      '123456',
    );
  });

  it('registrar: crea la cuenta; y reutiliza la app ya iniciada', async () => {
    configurar();
    sdk.getApps.mockReturnValue([{}]);
    sdk.getApp.mockReturnValue({ nombre: 'existente' });
    sdk.createUserWithEmailAndPassword.mockResolvedValue({
      user: { getIdToken: async () => 't2' },
    });
    expect(await obtenerIdToken('registrar', credenciales)).toBe('t2');
    expect(sdk.initializeApp).not.toHaveBeenCalled();
    expect(sdk.initializeAuth).toHaveBeenCalledWith(
      { nombre: 'existente' },
      { persistence: 'memoria' },
    );
  });
});

describe('mensajeDeCuenta', () => {
  it('traduce los códigos de Firebase sin revelar cuál campo falló (usuario o contraseña)', () => {
    for (const codigo of [
      'auth/invalid-credential',
      'auth/wrong-password',
      'auth/user-not-found',
    ]) {
      expect(mensajeDeCuenta({ code: codigo })).toBe('Correo o contraseña incorrectos.');
    }
    expect(mensajeDeCuenta({ code: 'auth/email-already-in-use' })).toContain(
      'Ya existe una cuenta',
    );
    expect(mensajeDeCuenta({ code: 'auth/network-request-failed' })).toContain('conexión');
  });

  it('los errores de configuración del proyecto dicen qué revisar en la consola de Firebase', () => {
    expect(mensajeDeCuenta({ code: 'auth/operation-not-allowed' })).toContain('Método de acceso');
    expect(mensajeDeCuenta({ code: 'auth/invalid-api-key' })).toContain('NEXT_PUBLIC_FIREBASE_');
    expect(mensajeDeCuenta({ code: 'auth/configuration-not-found' })).toContain('Authentication');
    expect(mensajeDeCuenta({ code: 'auth/unauthorized-domain' })).toContain('Dominios autorizados');
  });

  it('un error desconocido da un mensaje genérico, nunca el texto interno', () => {
    expect(mensajeDeCuenta(new Error('secreto interno'))).toBe(
      'No pudimos completar la acción. Inténtalo de nuevo.',
    );
    expect(mensajeDeCuenta(new ErrorDeCuenta('Falta configurar.'))).toBe('Falta configurar.');
  });
});
