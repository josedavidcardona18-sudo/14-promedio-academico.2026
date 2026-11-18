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

describe('configFirebase · cómo llega la clave desde Vercel o un .env', () => {
  const pem = '-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n';
  const con = (clave: string) => configFirebase({ ...completo, FIREBASE_PRIVATE_KEY: clave });

  it('con saltos de línea reales (pegada tal cual en Vercel) queda igual', () => {
    expect(con(pem)?.privateKey).toBe(pem);
  });

  it('con \\n literales y con las comillas del .env, también se entiende', () => {
    const escapada = pem.replaceAll('\n', '\\n');
    expect(con(`"${escapada}"`)?.privateKey).toBe(pem);
    expect(con(`'${escapada}'`)?.privateKey).toBe(pem);
    expect(con(`  ${escapada}  `)?.privateKey).toBe(pem);
  });

  it('una clave vacía o solo de espacios cuenta como «sin configurar»', () => {
    expect(con('   ')).toBeNull();
    expect(con('')).toBeNull();
  });

  it('siempre termina en un único salto de línea, como un PEM normal', () => {
    expect(con(pem.trim())?.privateKey).toBe(pem);
    expect(con(`${pem}\n\n`)?.privateKey).toBe(pem);
  });

  it('recorta espacios en el proyecto y en el correo', () => {
    const config = configFirebase({
      ...completo,
      FIREBASE_PROJECT_ID: ' mi-proyecto\n',
      FIREBASE_CLIENT_EMAIL: ' servicio@mi-proyecto.iam.gserviceaccount.com ',
    });
    expect(config).toMatchObject({
      projectId: 'mi-proyecto',
      clientEmail: 'servicio@mi-proyecto.iam.gserviceaccount.com',
    });
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

  it('en producción, con credenciales de Firebase, MODO_DEMO=1 se ignora (no abre la API de datos reales)', () => {
    expect(modoDemo({ MODO_DEMO: '1', NODE_ENV: 'production', ...completo })).toBe(false);
  });

  it('en desarrollo sí se puede forzar el modo demostración aunque haya credenciales', () => {
    expect(modoDemo({ MODO_DEMO: '1', NODE_ENV: 'development', ...completo })).toBe(true);
  });

  it('en producción sin Firebase NO queda abierta: se cierra', () => {
    expect(modoDemo({ NODE_ENV: 'production' })).toBe(false);
    expect(modoDemo({ NODE_ENV: 'test' })).toBe(false);
  });
});
