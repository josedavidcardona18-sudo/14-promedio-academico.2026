import { describe, expect, it } from 'vitest';
import { configFirebase, modoDemo } from './config';

const completo = {
  FIREBASE_PROJECT_ID: 'mi-proyecto',
  FIREBASE_CLIENT_EMAIL: 'servicio@mi-proyecto.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n',
};

describe('configFirebase', () => {
  it('sin las tres variables no hay configuración', () => {
    expect(configFirebase({})).toBeNull();
    expect(configFirebase({ ...completo, FIREBASE_PRIVATE_KEY: undefined })).toBeNull();
    expect(configFirebase({ ...completo, FIREBASE_CLIENT_EMAIL: '' })).toBeNull();
  });

  it('convierte los \\n literales de Vercel en saltos de línea reales', () => {
    const config = configFirebase(completo);
    expect(config?.privateKey).toBe(
      '-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n',
    );
    expect(config?.projectId).toBe('mi-proyecto');
  });
});

describe('modoDemo', () => {
  it('es explícito con MODO_DEMO=1 y se apaga con MODO_DEMO=0', () => {
    expect(modoDemo({ MODO_DEMO: '1', NODE_ENV: 'production' })).toBe(true);
    expect(modoDemo({ MODO_DEMO: '0', NODE_ENV: 'development' })).toBe(false);
  });

  it('en desarrollo y sin Firebase, funciona sin cuentas', () => {
    expect(modoDemo({ NODE_ENV: 'development' })).toBe(true);
  });

  it('en desarrollo con Firebase configurado, usa las cuentas reales', () => {
    expect(modoDemo({ NODE_ENV: 'development', ...completo })).toBe(false);
  });

  it('en producción sin Firebase NO queda abierta: se cierra', () => {
    expect(modoDemo({ NODE_ENV: 'production' })).toBe(false);
    expect(modoDemo({ NODE_ENV: 'test' })).toBe(false);
  });
});
