'use client';

import { useEffect, useId, useRef } from 'react';
import ui from './ui.module.css';
import estilos from './DialogoConfirmar.module.css';

interface Props {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  textoConfirmar: string;
  onConfirmar: () => void;
  onCerrar: () => void;
}

/** `<dialog>` nativo: atrapa el foco, se cierra con Esc y devuelve el foco a quien lo abrió. */
export function DialogoConfirmar({
  abierto,
  titulo,
  descripcion,
  textoConfirmar,
  onConfirmar,
  onCerrar,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className={estilos.dialogo}
      aria-labelledby={`${id}-titulo`}
      aria-describedby={`${id}-texto`}
      onClose={onCerrar}
    >
      <p id={`${id}-titulo`} className={estilos.titulo}>
        {titulo}
      </p>
      <p id={`${id}-texto`}>{descripcion}</p>
      <div className={ui.acciones}>
        <button type="button" className={ui.boton} onClick={() => ref.current?.close()}>
          Cancelar
        </button>
        <button type="button" className={`${ui.boton} ${ui.peligroSolido}`} onClick={onConfirmar}>
          {textoConfirmar}
        </button>
      </div>
    </dialog>
  );
}
