'use client';

import { useState } from 'react';
import type { DatosSemestre } from '@/hooks/useSemestreActual';
import { DialogoConfirmar } from './DialogoConfirmar';
import ui from './ui.module.css';
import estilos from './AvisoDeEjemplo.module.css';

/** Deja claro que son datos de ejemplo y que lo que se edite queda como borrador en este navegador. */
export function AvisoDeEjemplo({ datos }: { datos: DatosSemestre }) {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <aside className={`${ui.tarjeta} ${estilos.aviso} no-imprimir`} aria-label="Datos de ejemplo">
      <p>
        <strong>Estás viendo datos de ejemplo.</strong>{' '}
        {datos.hayBorrador
          ? 'Tus cambios están guardados como borrador en este navegador.'
          : 'Cuando edites una materia, tus cambios se guardan como borrador en este navegador.'}
      </p>
      {datos.hayBorrador && (
        <div>
          <button type="button" className={ui.boton} onClick={() => setConfirmando(true)}>
            Restablecer datos de ejemplo
          </button>
        </div>
      )}
      <DialogoConfirmar
        abierto={confirmando}
        titulo="¿Restablecer los datos de ejemplo?"
        descripcion="Se perderán los cambios que hiciste en este navegador. No se puede deshacer."
        textoConfirmar="Sí, restablecer"
        onConfirmar={() => {
          setConfirmando(false);
          datos.restablecer();
        }}
        onCerrar={() => setConfirmando(false)}
      />
    </aside>
  );
}
