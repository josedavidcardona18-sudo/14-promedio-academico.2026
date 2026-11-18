import type { FirebaseOptions } from '@firebase/app';
import type { Auth } from '@firebase/auth';
import type { Credenciales } from '@/schemas/credenciales';

/** Un error de cuentas ya explicado para la persona. */
export class ErrorDeCuenta extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorDeCuenta';
  }
}

/** Solo la configuración **pública** de la app web de Firebase (no es un secreto). */
export function configCliente(): FirebaseOptions | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  return apiKey && authDomain && projectId && appId
    ? { apiKey, authDomain, projectId, appId }
    : null;
}

const MENSAJES: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'Escribe un correo válido.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Prueba iniciar sesión.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  // Errores de configuración del proyecto de Firebase: útiles para quien lo está montando.
  'auth/operation-not-allowed':
    'El acceso con correo y contraseña no está activado en Firebase (Authentication → Método de acceso).',
  'auth/invalid-api-key':
    'La configuración de Firebase no es válida: revisa las variables NEXT_PUBLIC_FIREBASE_*.',
  'auth/configuration-not-found':
    'Firebase Authentication no está configurado en este proyecto (Authentication → Comenzar).',
  'auth/unauthorized-domain':
    'Este dominio no está autorizado en Firebase (Authentication → Configuración → Dominios autorizados).',
};

export function mensajeDeCuenta(error: unknown): string {
  if (error instanceof ErrorDeCuenta) return error.message;
  const codigo =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  return MENSAJES[codigo] ?? 'No pudimos completar la acción. Inténtalo de nuevo.';
}

let instancia: Promise<Auth> | undefined;

/** Carga el SDK de Firebase solo cuando alguien intenta iniciar sesión, nunca en las demás páginas. */
function obtenerAuthCliente(): Promise<Auth> {
  instancia ??= (async () => {
    const config = configCliente();
    if (!config) throw new ErrorDeCuenta('El inicio de sesión no está configurado todavía.');
    const [{ getApp, getApps, initializeApp }, { initializeAuth, inMemoryPersistence }] =
      await Promise.all([import('@firebase/app'), import('@firebase/auth')]);
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    // Sin almacenamiento del navegador: la sesión real es la cookie HttpOnly que crea el servidor.
    return initializeAuth(app, { persistence: inMemoryPersistence });
  })();
  return instancia;
}

/** Inicia sesión (o crea la cuenta) en Firebase y entrega el `idToken` para cambiarlo por la cookie. */
export async function obtenerIdToken(
  modo: 'entrar' | 'registrar',
  { correo, clave }: Credenciales,
): Promise<string> {
  const auth = await obtenerAuthCliente();
  const { createUserWithEmailAndPassword, signInWithEmailAndPassword } =
    await import('@firebase/auth');
  const entrar = modo === 'entrar' ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
  const { user } = await entrar(auth, correo, clave);
  return user.getIdToken();
}

export function reiniciarClienteParaPruebas(): void {
  instancia = undefined;
}
