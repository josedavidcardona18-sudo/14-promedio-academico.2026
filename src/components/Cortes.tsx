'use client';

import type { Accion } from '@/domain/reducer';
import { LIMITES } from '@/domain/constantes';
import { aTexto } from '@/domain/numeros';
import type { Corte, Materia } from '@/domain/tipos';
import type { ErroresCorte, ErroresMateria } from '@/domain/validacion';
import { CampoNumero } from './CampoNumero';
import { nombreDeCorte } from './textos';
import ui from './ui.module.css';
import estilos from './Cortes.module.css';

interface PropsFila {
  materiaId: string;
  corte: Corte;
  posicion: number;
  notaMaxima: number;
  errores: ErroresCorte | undefined;
  despachar: (accion: Accion) => void;
}

function FilaCorte({ materiaId, corte, posicion, notaMaxima, errores, despachar }: PropsFila) {
  return (
    <fieldset className={estilos.corte}>
      <legend className={estilos.leyenda}>{nombreDeCorte(posicion)}</legend>
      <div className={estilos.campos}>
        <CampoNumero
          etiqueta="Peso (%)"
          valor={corte.peso}
          vacioEs={0}
          error={errores?.peso}
          onCambio={(peso) =>
            despachar({ tipo: 'poner-peso', materiaId, corteId: corte.id, peso: peso ?? 0 })
          }
        />
        <CampoNumero
          etiqueta={`Nota (0–${aTexto(notaMaxima)})`}
          valor={corte.nota}
          error={errores?.nota}
          onCambio={(nota) => despachar({ tipo: 'poner-nota', materiaId, corteId: corte.id, nota })}
        />
      </div>
    </fieldset>
  );
}

interface Props {
  materia: Materia;
  errores: ErroresMateria;
  notaMaxima: number;
  despachar: (accion: Accion) => void;
}

export function Cortes({ materia, errores, notaMaxima, despachar }: Props) {
  const { id, cortes } = materia;
  return (
    <div className={estilos.cortes}>
      {cortes.map((corte, posicion) => (
        <FilaCorte
          key={corte.id}
          materiaId={id}
          corte={corte}
          posicion={posicion}
          notaMaxima={notaMaxima}
          errores={errores.cortes[corte.id]}
          despachar={despachar}
        />
      ))}
      <p className={ui.error} aria-live="polite">
        {errores.pesos && (
          <>
            <span aria-hidden="true">⚠ </span>
            {errores.pesos}
          </>
        )}
      </p>
      <div className={ui.acciones}>
        <button
          type="button"
          className={ui.boton}
          disabled={cortes.length >= LIMITES.maxCortes}
          onClick={() => despachar({ tipo: 'agregar-corte', materiaId: id })}
        >
          Agregar corte
        </button>
        <button
          type="button"
          className={ui.boton}
          disabled={cortes.length <= 1}
          onClick={() => despachar({ tipo: 'quitar-corte', materiaId: id })}
        >
          Quitar último corte
        </button>
      </div>
    </div>
  );
}
