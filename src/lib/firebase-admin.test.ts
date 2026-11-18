// @vitest-environment node
import { generateKeyPairSync } from 'node:crypto';
import { deleteApp, getApps } from 'firebase-admin/app';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { obtenerAuth, obtenerFirestore } from './firebase-admin';

/**
 * Estas pruebas usan el Admin SDK **de verdad** (sin simularlo) con una clave RSA generada al
 * momento: comprueban que el formato en que Vercel guarda la clave se entiende y que el SDK arranca.
 * No hacen ninguna llamada de red (Firebase solo la hace al verificar un token o leer un documento).
 */
const { privateKey: pem } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

function definir(clave: string | undefined) {
  vi.stubEnv('FIREBASE_PROJECT_ID', 'proyecto-de-prueba');
  vi.stubEnv(
    'FIREBASE_CLIENT_EMAIL',
    'firebase-adminsdk-x@proyecto-de-prueba.iam.gserviceaccount.com',
  );
  vi.stubEnv('FIREBASE_PRIVATE_KEY', clave ?? '');
}

beforeEach(() => vi.unstubAllEnvs());
afterEach(async () => {
  await Promise.all(getApps().map((app) => deleteApp(app)));
  vi.unstubAllEnvs();
});

describe('firebase-admin · arranque con la configuración de servidor', () => {
  it('sin variables responde 503 «no está configurado» (y no cae en un 500)', () => {
    definir(undefined);
    expect(() => obtenerAuth()).toThrowError(
      expect.objectContaining({
        status: 503,
        message: 'El servicio de cuentas no está configurado.',
      }),
    );
  });

  it('con la clave tal como la guarda Vercel (saltos de línea reales) arranca Auth y Firestore', () => {
    definir(pem);
    expect(obtenerAuth().verifySessionCookie).toBeTypeOf('function');
    expect(obtenerFirestore().collection).toBeTypeOf('function');
  });

  it('con la clave en una línea con \\n literales y con comillas del .env también arranca', () => {
    definir(`"${pem.replaceAll('\n', '\\n')}"`);
    expect(obtenerAuth().createSessionCookie).toBeTypeOf('function');
  });

  it('una clave corrupta falla con un error de credencial (que el registro anota con su código)', () => {
    definir('-----BEGIN PRIVATE KEY-----\\nesto no es una clave\\n-----END PRIVATE KEY-----\\n');
    expect(() => obtenerAuth()).toThrowError(
      expect.objectContaining({ code: 'app/invalid-credential' }),
    );
  });

  it('reutiliza la misma aplicación en llamadas siguientes (no inicializa dos veces)', () => {
    definir(pem);
    obtenerAuth();
    obtenerFirestore();
    expect(getApps()).toHaveLength(1);
  });
});
