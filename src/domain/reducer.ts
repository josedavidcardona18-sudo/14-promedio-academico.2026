import { LIMITES } from './constantes';
import type { Config, Corte, Estado, Materia } from './tipos';
import { limpiarNombre } from './validacion';

export type AccionDeMateria =
  | { tipo: 'agregar-materia'; materia: Materia }
  | { tipo: 'actualizar-materia'; id: string; nombre: string; creditos: number }
  | { tipo: 'eliminar-materia'; id: string }
  | { tipo: 'configurar'; config: Config }
  | { tipo: 'reemplazar'; estado: Estado };

export type AccionDeCorte =
  | { tipo: 'poner-nota'; materiaId: string; corteId: string; nota: number | null }
  | { tipo: 'poner-peso'; materiaId: string; corteId: string; peso: number }
  | { tipo: 'agregar-corte'; materiaId: string }
  | { tipo: 'quitar-corte'; materiaId: string };

export type Accion = AccionDeMateria | AccionDeCorte;

/** Una materia nueva: 3 cortes de 30 %, 30 % y 40 %, todavía sin notas. */
export function crearMateria(id: string, nombre: string, creditos: number): Materia {
  const cortes: Corte[] = [30, 30, 40].map((peso, i) => ({ id: `c${i + 1}`, peso, nota: null }));
  return { id, nombre: limpiarNombre(nombre), creditos, cortes };
}

function siguienteIdDeCorte(cortes: Corte[]): string {
  const usados = new Set(cortes.map((c) => c.id));
  let n = cortes.length + 1;
  while (usados.has(`c${n}`)) n += 1;
  return `c${n}`;
}

function sobreMateria(estado: Estado, id: string, cambiar: (m: Materia) => Materia): Estado {
  if (!estado.materias.some((m) => m.id === id)) return estado;
  return { ...estado, materias: estado.materias.map((m) => (m.id === id ? cambiar(m) : m)) };
}

function sobreCorte(materia: Materia, id: string, cambiar: (c: Corte) => Corte): Materia {
  return { ...materia, cortes: materia.cortes.map((c) => (c.id === id ? cambiar(c) : c)) };
}

function reducirCorte(estado: Estado, accion: AccionDeCorte): Estado {
  switch (accion.tipo) {
    case 'poner-nota':
      return sobreMateria(estado, accion.materiaId, (m) =>
        sobreCorte(m, accion.corteId, (c) => ({ ...c, nota: accion.nota })),
      );
    case 'poner-peso':
      return sobreMateria(estado, accion.materiaId, (m) =>
        sobreCorte(m, accion.corteId, (c) => ({ ...c, peso: accion.peso })),
      );
    case 'agregar-corte':
      return sobreMateria(estado, accion.materiaId, (m) =>
        m.cortes.length >= LIMITES.maxCortes
          ? m
          : {
              ...m,
              cortes: [...m.cortes, { id: siguienteIdDeCorte(m.cortes), peso: 0, nota: null }],
            },
      );
    case 'quitar-corte':
      return sobreMateria(estado, accion.materiaId, (m) =>
        m.cortes.length <= 1 ? m : { ...m, cortes: m.cortes.slice(0, -1) },
      );
  }
}

function reducirMateria(estado: Estado, accion: AccionDeMateria): Estado {
  switch (accion.tipo) {
    case 'agregar-materia':
      return { ...estado, materias: [...estado.materias, accion.materia] };
    case 'actualizar-materia':
      return sobreMateria(estado, accion.id, (m) => ({
        ...m,
        nombre: limpiarNombre(accion.nombre),
        creditos: accion.creditos,
      }));
    case 'eliminar-materia':
      return { ...estado, materias: estado.materias.filter((m) => m.id !== accion.id) };
    case 'configurar':
      return { ...estado, config: { ...accion.config } };
    case 'reemplazar':
      return accion.estado;
  }
}

function esAccionDeCorte(accion: Accion): accion is AccionDeCorte {
  return (
    accion.tipo === 'poner-nota' ||
    accion.tipo === 'poner-peso' ||
    accion.tipo === 'agregar-corte' ||
    accion.tipo === 'quitar-corte'
  );
}

export function reducir(estado: Estado, accion: Accion): Estado {
  return esAccionDeCorte(accion) ? reducirCorte(estado, accion) : reducirMateria(estado, accion);
}
