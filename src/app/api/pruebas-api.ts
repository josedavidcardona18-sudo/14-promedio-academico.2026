import { reiniciarLimites } from '@/lib/limite';
import { crearAlmacenEnMemoria } from '@/repositories/almacen';
import { sembrarEjemplo } from '@/repositories/ejemplo';
import { crearRepositorioSemestres, type RepositorioSemestres } from '@/repositories/semestres';

/** Ayudas para probar los Route Handlers con sesión y repositorio falsos (sin red ni Firebase). */
export const SITIO = 'http://localhost';

const CUENTAS: Record<string, { uid: string; rol?: string }> = {
  ana: { uid: 'ana' },
  beto: { uid: 'beto' },
  root: { uid: 'root', rol: 'admin' },
};

function identificar(valor: string) {
  const cuenta = CUENTAS[valor];
  if (!cuenta) throw new Error('auth/argument-error');
  return {
    uid: cuenta.uid,
    email: `${cuenta.uid}@correo.co`,
    ...(cuenta.rol && { rol: cuenta.rol }),
  };
}

/** Sustituye a `@/lib/firebase-admin`: la cookie `sesion=ana` equivale a la sesión de Ana. */
export const moduloFirebaseFalso = {
  obtenerAuth: () => ({
    verifySessionCookie: async (valor: string) => identificar(valor),
    verifyIdToken: async (valor: string) => identificar(valor),
  }),
  obtenerFirestore: () => {
    throw new Error('Las pruebas no usan Firestore real.');
  },
};

let repositorioActual: RepositorioSemestres | undefined;

/** Sustituye a `@/repositories`. */
export const moduloRepositorios = {
  obtenerRepositorio: async (): Promise<RepositorioSemestres> => {
    if (!repositorioActual) throw new Error('Falta llamar a reiniciarEntorno().');
    return repositorioActual;
  },
};

/** Base nueva por prueba: solo Ana tiene el semestre de ejemplo (`sembrar: null` = nadie). */
export async function reiniciarEntorno({
  sembrar = 'ana',
}: { sembrar?: string | null } = {}): Promise<RepositorioSemestres> {
  reiniciarLimites();
  const almacen = crearAlmacenEnMemoria();
  if (sembrar) await sembrarEjemplo(almacen, sembrar);
  repositorioActual = crearRepositorioSemestres({ almacen });
  return repositorioActual;
}

interface Opciones {
  /** Quién inicia sesión; `null` = nadie. Por defecto, Ana. */
  uid?: string | null;
  metodo?: string;
  cuerpo?: unknown;
  /** Cuerpo ya serializado (para probar JSON roto). */
  texto?: string;
  tipo?: string;
  origen?: string | null;
  ip?: string;
  bearer?: string;
}

function cabecerasDe({
  uid = 'ana',
  metodo = 'GET',
  bearer,
  ip,
  ...resto
}: Opciones): Record<string, string> {
  const cabeceras: Record<string, string> = {};
  const origen = resto.origen === undefined ? SITIO : resto.origen;
  if (uid && !bearer) cabeceras['cookie'] = `sesion=${uid}`;
  if (bearer) cabeceras['authorization'] = `Bearer ${bearer}`;
  if (metodo !== 'GET' && origen) cabeceras['origin'] = origen;
  if (ip) cabeceras['x-forwarded-for'] = ip;
  return cabeceras;
}

export function pedir(ruta: string, opciones: Opciones = {}): Request {
  const { metodo = 'GET', cuerpo, texto, tipo = 'application/json' } = opciones;
  const cabeceras = cabecerasDe(opciones);
  const conCuerpo = cuerpo !== undefined || texto !== undefined;
  if (conCuerpo) cabeceras['content-type'] = tipo;
  return new Request(`${SITIO}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    ...(conCuerpo && { body: texto ?? JSON.stringify(cuerpo) }),
  });
}

export const materiaValida = {
  nombre: 'Física',
  creditos: 3,
  notas: [{ nombre: 'Parcial 1', valor: 4, porcentaje: 30 }],
};
