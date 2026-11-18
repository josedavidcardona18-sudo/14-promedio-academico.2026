'use client';

import type { Ref } from 'react';
import type { Accion } from '@/domain/reducer';
import type { Config, Materia } from '@/domain/tipos';
import { TarjetaMateria } from './TarjetaMateria';
import ui from './ui.module.css';
import estilos from './ListaMaterias.module.css';

interface Props {
  materias: Materia[];
  config: Config;
  despachar: (accion: Accion) => void;
  alEliminar: (nombre: string) => void;
  alCargarEjemplo: () => void;
  refTitulo: Ref<HTMLHeadingElement>;
}

export function ListaMaterias({
  materias,
  config,
  despachar,
  alEliminar,
  alCargarEjemplo,
  refTitulo,
}: Props) {
  return (
    <section aria-labelledby="titulo-materias" className={estilos.seccion}>
      <h2 id="titulo-materias" ref={refTitulo} tabIndex={-1}>
        Mis materias{materias.length > 0 && ` (${materias.length})`}
      </h2>
      {materias.length === 0 ? (
        <div className={`${ui.tarjeta} ${estilos.vacio}`}>
          <p>
            Aún no has agregado materias. Agrégalas con el formulario o mira cómo funciona con datos
            de ejemplo.
          </p>
          <div className="no-imprimir">
            <button
              type="button"
              className={`${ui.boton} ${ui.primario}`}
              onClick={alCargarEjemplo}
            >
              Cargar datos de ejemplo
            </button>
          </div>
        </div>
      ) : (
        <ul className={estilos.lista}>
          {materias.map((materia) => (
            <li key={materia.id} className={estilos.item}>
              <TarjetaMateria
                materia={materia}
                config={config}
                despachar={despachar}
                alEliminar={alEliminar}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
