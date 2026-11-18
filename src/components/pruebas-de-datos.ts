import { vi } from 'vitest';
import * as ejemplo from '@/app/api/ejemplo/route';
import { reiniciarEntorno } from '@/app/api/pruebas-api';
import * as yo from '@/app/api/auth/yo/route';
import * as semestres from '@/app/api/semestres/route';
import * as semestre from '@/app/api/semestres/[id]/route';
import * as materias from '@/app/api/semestres/[id]/materias/route';
import * as materia from '@/app/api/semestres/[id]/materias/[materiaId]/route';
import * as resumen from '@/app/api/semestres/[id]/resumen/route';

type Contexto = { params: Promise<{ id: string; materiaId: string }> };
type Manejador = (peticion: Request, contexto: Contexto) => Promise<Response>;
interface Modulo {
  GET?: Manejador;
  POST?: Manejador;
  PUT?: Manejador;
  DELETE?: Manejador;
}

const RUTAS: [RegExp, Modulo][] = [
  [/^\/api\/semestres$/, semestres],
  [/^\/api\/semestres\/([^/]+)$/, semestre],
  [/^\/api\/semestres\/([^/]+)\/resumen$/, resumen],
  [/^\/api\/semestres\/([^/]+)\/materias$/, materias],
  [/^\/api\/semestres\/([^/]+)\/materias\/([^/]+)$/, materia],
  [/^\/api\/ejemplo$/, ejemplo],
  [/^\/api\/auth\/yo$/, yo],
];

const METODOS = ['GET', 'POST', 'PUT', 'DELETE'] as const;

async function despachar(entrada: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(String(entrada), 'http://localhost');
  const peticion = new Request(url, {
    ...init,
    headers: { origin: 'http://localhost', ...Object.fromEntries(new Headers(init?.headers)) },
  });
  for (const [patron, modulo] of RUTAS) {
    const coincidencia = patron.exec(url.pathname);
    const metodo = METODOS.find((m) => m === peticion.method);
    const manejador = metodo && modulo[metodo];
    if (!coincidencia || !manejador) continue;
    const decodificar = (texto: string | undefined) => decodeURIComponent(texto ?? '');
    const params = { id: decodificar(coincidencia[1]), materiaId: decodificar(coincidencia[2]) };
    return manejador(peticion, { params: Promise.resolve(params) });
  }
  return new Response(JSON.stringify({ error: 'No existe.' }), { status: 404 });
}

/**
 * `fetch` de la interfaz conectado a los Route Handlers **reales** (servicio y repositorio en
 * memoria, modo demostración): la pantalla y la API se prueban juntas, sin inventar respuestas.
 * Cada archivo de prueba debe declarar `vi.mock('@/repositories', …)` con `moduloRepositorios`.
 */
export async function instalarServidorFalso(
  opciones: { sembrar?: string | null } = {},
): Promise<void> {
  vi.stubEnv('MODO_DEMO', '1');
  await reiniciarEntorno({ sembrar: opciones.sembrar === undefined ? 'demo' : opciones.sembrar });
  vi.stubGlobal('fetch', vi.fn(despachar));
}

/** `fetch` que siempre responde lo mismo, para forzar errores (500, 401, sin red). */
export function responderSiempre(cuerpo: unknown, estado = 200): void {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockImplementation(async () => new Response(JSON.stringify(cuerpo), { status: estado })),
  );
}

/** Estado de `next/navigation` para las pruebas: la ruta, la consulta y las llamadas a `router`. */
export const navegacion = {
  ruta: '/',
  parametros: new URLSearchParams(),
  replace: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
};

export function reiniciarNavegacion(ruta = '/', consulta = ''): void {
  navegacion.ruta = ruta;
  navegacion.parametros = new URLSearchParams(consulta);
  navegacion.replace.mockReset();
  navegacion.push.mockReset();
  navegacion.refresh.mockReset();
}

/** Sustituye a `next/navigation` con `vi.mock('next/navigation', …)`. */
export const moduloNavegacionFalso = {
  useRouter: () => ({
    replace: navegacion.replace,
    push: navegacion.push,
    refresh: navegacion.refresh,
  }),
  usePathname: () => navegacion.ruta,
  useSearchParams: () => navegacion.parametros,
};

interface MateriaDePrueba {
  nombre: string;
  creditos: number;
  notas: { nombre: string; valor: number | null; porcentaje: number }[];
}

async function escribir(ruta: string, cuerpo: unknown): Promise<Response> {
  return despachar(ruta, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
}

/** Crea un semestre (y sus materias) en la cuenta de demostración por la API real; devuelve su id. */
export async function sembrarSemestre(
  nombre: string,
  meta: number,
  materias: MateriaDePrueba[] = [],
): Promise<string> {
  const semestre = await (await escribir('/api/semestres', { nombre, meta })).json();
  for (const materia of materias) {
    await escribir(`/api/semestres/${semestre.id}/materias`, materia);
  }
  return semestre.id;
}
