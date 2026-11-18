'use client';

import { useState } from 'react';
import { DialogoConfirmar } from './DialogoConfirmar';
import ui from './ui.module.css';

interface Props {
  nombre: string;
  onEliminar: () => Promise<void>;
}

/** Eliminar pide confirmación: borrar notas por un clic accidental no se puede deshacer. */
export function EliminarMateria({ nombre, onEliminar }: Props) {
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
    <div className="no-imprimir">
      <button
        type="button"
        className={`${ui.boton} ${ui.peligro}`}
        onClick={() => setConfirmando(true)}
      >
        Eliminar materia
      </button>
      <p role="alert" className={ui.error}>
        {fallo}
      </p>
      <DialogoConfirmar
        abierto={confirmando}
        titulo={`¿Eliminar ${nombre}?`}
        descripcion="Se borrarán la materia y todas sus notas. No se puede deshacer."
        textoConfirmar="Sí, eliminar"
        onConfirmar={eliminar}
        onCerrar={() => setConfirmando(false)}
      />
    </div>
  );
}
