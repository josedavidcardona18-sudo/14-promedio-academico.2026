'use client';

import type { Nota } from '@/schemas/semestre';
import { CampoNumero } from './CampoNumero';
import { CampoTexto } from './CampoTexto';
import ui from './ui.module.css';
import estilos from './FilaNota.module.css';

interface Props {
  posicion: number;
  nota: Nota;
  errores: Record<string, string>;
  /** `id` del mensaje de error de la suma de porcentajes, si hoy suman más de 100 %. */
  idErrorSuma: string | undefined;
  onCambio: (nota: Nota) => void;
  onQuitar: () => void;
}

/** Una nota de la materia: nombre, valor (opcional) y porcentaje. Cada campo muestra su propio error. */
export function FilaNota({ posicion, nota, errores, idErrorSuma, onCambio, onQuitar }: Props) {
  const error = (campo: string) => errores[`notas.${posicion}.${campo}`];
  return (
    <fieldset className={estilos.fila}>
      <legend className={estilos.leyenda}>Nota {posicion + 1}</legend>
      <div className={estilos.nombre}>
        <CampoTexto
          etiqueta="Nombre"
          valor={nota.nombre}
          error={error('nombre')}
          onCambio={(nombre) => onCambio({ ...nota, nombre })}
        />
      </div>
      <CampoNumero
        etiqueta="Nota (0,0 a 5,0)"
        valor={nota.valor}
        min={0}
        max={5}
        paso={0.1}
        ayuda="Vacía si aún no la tienes."
        error={error('valor')}
        onCambio={(valor) => onCambio({ ...nota, valor })}
      />
      <CampoNumero
        etiqueta="Porcentaje (%)"
        valor={nota.porcentaje}
        vacioEs={0}
        min={0}
        max={100}
        paso={0.1}
        error={error('porcentaje')}
        invalido={idErrorSuma !== undefined}
        descritoPor={idErrorSuma}
        onCambio={(porcentaje) => onCambio({ ...nota, porcentaje: porcentaje ?? 0 })}
      />
      <button
        type="button"
        className={`${ui.boton} ${ui.peligro} ${estilos.quitar}`}
        onClick={onQuitar}
      >
        Quitar <span className="solo-lectores">la nota {posicion + 1}</span>
      </button>
    </fieldset>
  );
}
