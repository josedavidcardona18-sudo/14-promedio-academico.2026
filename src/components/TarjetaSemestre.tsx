'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import type { SemestreConMaterias, SemestreEntrada } from '@/schemas/semestre';
import { formatearNota } from '@/lib/formato';
import { DialogoConfirmar } from './DialogoConfirmar';
import { FormularioSemestre } from './FormularioSemestre';
import ui from './ui.module.css';
import estilos from './TarjetaSemestre.module.css';

interface Props {
  semestre: SemestreConMaterias;
  onEditar: (datos: SemestreEntrada) => Promise<void>;
  onEliminar: () => Promise<void>;
}

interface BotonesProps {
  semestre: SemestreConMaterias;
  onEditar: () => void;
  onEliminar: () => void;
}

function BotonesDeSemestre({ semestre, onEditar, onEliminar }: BotonesProps) {
  return (
    <div className={`${ui.acciones} no-imprimir`}>
      <Link href={`/?semestre=${encodeURIComponent(semestre.id)}`} className={ui.boton}>
        Ver resumen <span className="solo-lectores"> de {semestre.nombre}</span>
      </Link>
      <button type="button" className={ui.boton} onClick={onEditar}>
        Editar <span className="solo-lectores"> {semestre.nombre}</span>
      </button>
      <button type="button" className={`${ui.boton} ${ui.peligro}`} onClick={onEliminar}>
        Eliminar <span className="solo-lectores"> {semestre.nombre}</span>
      </button>
    </div>
  );
}

function ConfirmarEliminacion(props: {
  nombre: string;
  abierto: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  return (
    <DialogoConfirmar
      abierto={props.abierto}
      titulo={`¿Eliminar ${props.nombre}?`}
      descripcion="Se borrarán el semestre, sus materias y todas sus notas. No se puede deshacer."
      textoConfirmar="Sí, eliminar"
      onConfirmar={props.onConfirmar}
      onCerrar={props.onCerrar}
    />
  );
}

/** Un semestre de la cuenta: ver su resumen, cambiar nombre y meta, o eliminarlo (con confirmación). */
export function TarjetaSemestre({ semestre, onEditar, onEliminar }: Props) {
  const idTitulo = useId();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [fallo, setFallo] = useState('');

  async function eliminar() {
    setConfirmando(false);
    try {
      await onEliminar();
    } catch (error) {
      setFallo(error instanceof Error ? error.message : 'No se pudo eliminar.');
    }
  }

  return (
    <article className={`${ui.tarjeta} ${estilos.tarjeta}`} aria-labelledby={idTitulo}>
      <h3 id={idTitulo}>{semestre.nombre}</h3>
      <p className={ui.ayuda}>
        Meta {formatearNota(semestre.meta)} · {semestre.materias.length}{' '}
        {semestre.materias.length === 1 ? 'materia' : 'materias'}
      </p>
      {editando ? (
        <FormularioSemestre
          inicial={{ nombre: semestre.nombre, meta: semestre.meta }}
          etiquetaGuardar="Guardar cambios"
          onCancelar={() => setEditando(false)}
          onGuardar={async (datos) => {
            await onEditar(datos);
            setEditando(false);
          }}
        />
      ) : (
        <BotonesDeSemestre
          semestre={semestre}
          onEditar={() => setEditando(true)}
          onEliminar={() => setConfirmando(true)}
        />
      )}
      <p role="alert" className={ui.error}>
        {fallo}
      </p>
      <ConfirmarEliminacion
        nombre={semestre.nombre}
        abierto={confirmando}
        onConfirmar={eliminar}
        onCerrar={() => setConfirmando(false)}
      />
    </article>
  );
}
