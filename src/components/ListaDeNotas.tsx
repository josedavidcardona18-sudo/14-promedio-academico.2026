'use client';

import { useId } from 'react';
import { LIMITES, type Nota } from '@/schemas/semestre';
import { FilaNota } from './FilaNota';
import ui from './ui.module.css';
import estilos from './ListaDeNotas.module.css';

interface Props {
  notas: Nota[];
  errores: Record<string, string>;
  onCambiar: (notas: Nota[]) => void;
}

/** Agrega, quita y edita las notas; el error de la suma de porcentajes se muestra una sola vez. */
export function ListaDeNotas({ notas, errores, onCambiar }: Props) {
  const idSuma = useId();
  const errorSuma = errores['notas'];
  return (
    <div className={estilos.lista}>
      {notas.map((nota, posicion) => (
        <FilaNota
          key={posicion}
          posicion={posicion}
          nota={nota}
          errores={errores}
          idErrorSuma={errorSuma ? idSuma : undefined}
          onCambio={(nueva) => onCambiar(notas.map((n, i) => (i === posicion ? nueva : n)))}
          onQuitar={() => onCambiar(notas.filter((_, i) => i !== posicion))}
        />
      ))}
      <p id={idSuma} className={ui.error} aria-live="polite">
        {errorSuma && (
          <>
            <span aria-hidden="true">⚠ </span>
            {errorSuma}
          </>
        )}
      </p>
      <div>
        <button
          type="button"
          className={ui.boton}
          disabled={notas.length >= LIMITES.maxNotasPorMateria}
          onClick={() =>
            onCambiar([
              ...notas,
              { nombre: `Nota ${notas.length + 1}`, valor: null, porcentaje: 0 },
            ])
          }
        >
          Agregar nota
        </button>
      </div>
    </div>
  );
}
