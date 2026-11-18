import { modoDemo } from '@/lib/config';
import { UID_DEMO } from '@/lib/constantes';
import { obtenerFirestore } from '@/lib/firebase-admin';
import { crearAlmacenEnMemoria } from './almacen';
import { sembrarEjemplo } from './ejemplo';
import { crearAlmacenFirestore } from './firestore';
import { crearRepositorioSemestres, type RepositorioSemestres } from './semestres';

const CLAVE_DEMO = Symbol.for('promedio.repositorio.demo');
type ConDemo = typeof globalThis & { [CLAVE_DEMO]?: Promise<RepositorioSemestres> };

/** En memoria y con el semestre de ejemplo ya sembrado; se comparte entre peticiones (y recargas en desarrollo). */
function repositorioDemo(): Promise<RepositorioSemestres> {
  const global: ConDemo = globalThis;
  global[CLAVE_DEMO] ??= (async () => {
    const almacen = crearAlmacenEnMemoria();
    await sembrarEjemplo(almacen, UID_DEMO);
    return crearRepositorioSemestres({ almacen });
  })();
  return global[CLAVE_DEMO];
}

/** Las rutas piden el repositorio aquí: Firestore en producción, memoria solo en modo demostración. */
export async function obtenerRepositorio(): Promise<RepositorioSemestres> {
  if (modoDemo()) return repositorioDemo();
  return crearRepositorioSemestres({ almacen: crearAlmacenFirestore(obtenerFirestore()) });
}
