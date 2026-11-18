import { crearRepositorioDeEjemplo, type RepositorioSemestres } from './semestres';

/** Las rutas piden el repositorio aquí: en el Hito 3 devolverá el de Firestore. */
export function obtenerRepositorio(): RepositorioSemestres {
  return crearRepositorioDeEjemplo();
}
