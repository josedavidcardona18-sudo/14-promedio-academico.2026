import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { configFirebase } from './config';
import { ErrorHttp } from './errores';

/**
 * Único lugar que inicializa el Admin SDK. Solo corre en el servidor (Route Handlers y servicios):
 * la clave privada vive en variables de entorno del servidor y jamás llega al navegador.
 */
function aplicacion(): App {
  const existente = getApps()[0];
  if (existente) return existente;
  const config = configFirebase();
  if (!config) throw new ErrorHttp(503, 'El servicio de cuentas no está configurado.');
  return initializeApp({ credential: cert(config) });
}

export const obtenerAuth = (): Auth => getAuth(aplicacion());
export const obtenerFirestore = (): Firestore => getFirestore(aplicacion());
