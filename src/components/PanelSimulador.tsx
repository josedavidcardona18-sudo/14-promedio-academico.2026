'use client';

import { useId, useMemo, useState } from 'react';
import type { DatosSemestre } from '@/hooks/useSemestreActual';
import { metaSchema, type Materia } from '@/schemas/semestre';
import { simularNota } from '@/services/promedios';
import { CampoNumero } from './CampoNumero';
import { mensajeSimulacion, type Mensaje } from './textos';
import ui from './ui.module.css';
import estilos from './PanelSimulador.module.css';

function ComoSeCalcula() {
  return (
    <details className={estilos.detalles}>
      <summary>¿Cómo se calcula?</summary>
      <p>
        Cada nota pesa un porcentaje. Se suman las notas ya registradas por su porcentaje y se
        calcula cuánto falta para llegar a la meta:
      </p>
      <p className={estilos.formula}>nota necesaria = (meta − acumulado) ÷ porcentaje pendiente</p>
      <p>
        Se hace con números enteros (décimas), así que no hay errores de coma flotante, y el
        resultado se redondea hacia arriba a la décima siguiente: es la nota más baja que de verdad
        alcanza. Los promedios se muestran truncados a 2 decimales, sin aproximar hacia arriba.
      </p>
    </details>
  );
}

function SelectorDeMateria(props: {
  materias: readonly Materia[];
  valor: string;
  onCambio: (id: string) => void;
}) {
  const id = useId();
  return (
    <div className={ui.campo}>
      <label className={ui.etiqueta} htmlFor={id}>
        Materia
      </label>
      <select
        id={id}
        className={ui.entrada}
        value={props.valor}
        onChange={(e) => props.onCambio(e.target.value)}
      >
        {props.materias.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}

function MensajeEnVivo({ mensaje }: { mensaje: Mensaje | null }) {
  return (
    <p
      className={`${ui.mensaje} ${estilos.mensaje}`}
      data-tono={mensaje?.tono}
      aria-live="polite"
      aria-atomic="true"
    >
      {mensaje && (
        <>
          <span aria-hidden="true">{mensaje.icono}</span>
          <span>{mensaje.texto}</span>
        </>
      )}
    </p>
  );
}

function calcularMensaje(materia: Materia | undefined, meta: number | null): Mensaje | null {
  return materia && meta !== null
    ? mensajeSimulacion(simularNota(materia.notas, meta), meta)
    : null;
}

/** Estado derivado: el mensaje se calcula con `useMemo` a partir de la materia y la meta elegidas. */
export function PanelSimulador({ datos }: { datos: DatosSemestre }) {
  const { semestre } = datos;
  const [materiaId, setMateriaId] = useState(semestre.materias[0]?.id ?? '');
  const [meta, setMeta] = useState<number | null>(semestre.meta);
  const materia = semestre.materias.find((m) => m.id === materiaId) ?? semestre.materias[0];
  const validacion = metaSchema.safeParse(meta);
  const metaValida = validacion.success ? validacion.data : null;
  const mensaje = useMemo(() => calcularMensaje(materia, metaValida), [materia, metaValida]);

  return (
    <div className={estilos.panel}>
      <form className={`${ui.tarjeta} ${estilos.formulario}`} onSubmit={(e) => e.preventDefault()}>
        <SelectorDeMateria
          materias={semestre.materias}
          valor={materia?.id ?? ''}
          onCambio={setMateriaId}
        />
        <CampoNumero
          etiqueta="Meta (3,0 a 5,0)"
          valor={meta}
          min={3}
          max={5}
          paso={0.1}
          ayuda="Para aprobar basta con 3,0."
          error={validacion.error?.issues[0]?.message}
          onCambio={setMeta}
        />
      </form>
      <div className={estilos.salida}>
        <MensajeEnVivo mensaje={mensaje} />
        <ComoSeCalcula />
      </div>
    </div>
  );
}
