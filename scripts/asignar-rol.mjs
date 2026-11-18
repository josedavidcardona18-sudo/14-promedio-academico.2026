// Asigna el rol de una persona (custom claim `rol`) con el Admin SDK de Firebase.
//
//   node --env-file=.env.local scripts/asignar-rol.mjs ana@correo.com admin
//   node --env-file=.env.local scripts/asignar-rol.mjs ana@correo.com estudiante
//
// Hace falta porque los custom claims NO se pueden poner desde la consola de Firebase. El rol queda
// en el token que Firebase entrega al iniciar sesión: la persona debe cerrar sesión y volver a
// entrar para que `GET /api/auth/yo` lo muestre. Las credenciales salen de las variables de entorno
// del servidor (FIREBASE_*), las mismas de `.env.local`; este archivo nunca las imprime.
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { pathToFileURL } from 'node:url';

export const ROLES = ['estudiante', 'admin'];

/** Pone el rol y devuelve lo necesario para informar. `auth` es el `Auth` del Admin SDK. */
export async function asignarRol(auth, correo, rol) {
  if (!ROLES.includes(rol)) throw new Error(`El rol debe ser uno de: ${ROLES.join(', ')}.`);
  const persona = await auth.getUserByEmail(correo);
  const anteriores = persona.customClaims ?? {};
  await auth.setCustomUserClaims(persona.uid, { ...anteriores, rol });
  return { uid: persona.uid, correo: persona.email ?? correo, rol };
}

/** Convierte los `\n` literales (como en Vercel) y las comillas del `.env` en una clave PEM. */
export function leerClave(crudo) {
  const sinComillas = crudo.trim().replace(/^(["'])([\s\S]*)\1$/, '$2');
  return `${sinComillas.replace(/\\n/g, '\n').trim()}\n`;
}

function iniciarAdmin(env) {
  const {
    FIREBASE_PROJECT_ID: projectId,
    FIREBASE_CLIENT_EMAIL: clientEmail,
    FIREBASE_PRIVATE_KEY: clave,
  } = env;
  if (!projectId || !clientEmail || !clave) {
    throw new Error(
      'Faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY (usa --env-file=.env.local).',
    );
  }
  const app =
    getApps()[0] ??
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey: leerClave(clave) }) });
  return getAuth(app);
}

const decir = (texto) => process.stdout.write(`${texto}\n`);
const avisar = (texto) => process.stderr.write(`${texto}\n`);

async function principal(argumentos) {
  const [correo, rol] = argumentos;
  if (!correo || !rol) {
    avisar('Uso: node --env-file=.env.local scripts/asignar-rol.mjs <correo> <estudiante|admin>');
    return 1;
  }
  if (!ROLES.includes(rol)) {
    avisar(`El rol debe ser uno de: ${ROLES.join(', ')}.`);
    return 1;
  }
  try {
    const resultado = await asignarRol(iniciarAdmin(process.env), correo, rol);
    decir(
      `Listo: ${resultado.correo} (uid ${resultado.uid}) ahora tiene el rol «${resultado.rol}».`,
    );
    decir('Esa persona debe cerrar sesión y volver a entrar para que el cambio se refleje.');
    return 0;
  } catch (error) {
    avisar(`No se pudo asignar el rol: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await principal(process.argv.slice(2));
}
