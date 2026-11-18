'use client';

import { useState } from 'react';
import { DialogoConfirmar } from './DialogoConfirmar';
import ui from './ui.module.css';
import estilos from './AccionesDatos.module.css';

type Pendiente = 'ejemplo' | 'borrar' | null;

interface Props {
  hayMaterias: boolean;
  alCargarEjemplo: () => void;
  alBorrarTodo: () => void;
}

const TEXTOS = {
  ejemplo: {
    titulo: '¿Reemplazar tus materias por datos de ejemplo?',
    descripcion: 'Tus materias y notas actuales se perderán. No se puede deshacer.',
    boton: 'Sí, reemplazar',
  },
  borrar: {
    titulo: '¿Borrar todos tus datos?',
    descripcion:
      'Se eliminarán todas tus materias y notas de este navegador. No se puede deshacer.',
    boton: 'Sí, borrar todo',
  },
} as const;

export function AccionesDatos({ hayMaterias, alCargarEjemplo, alBorrarTodo }: Props) {
  const [pendiente, setPendiente] = useState<Pendiente>(null);
  const texto = TEXTOS[pendiente ?? 'borrar'];

  function confirmar() {
    if (pendiente === 'ejemplo') alCargarEjemplo();
    if (pendiente === 'borrar') alBorrarTodo();
    setPendiente(null);
  }

  return (
    <section className={`${estilos.acciones} no-imprimir`} aria-labelledby="titulo-datos">
      <h2 id="titulo-datos">Tus datos</h2>
      <p className={ui.ayuda}>
        Se guardan solo en este navegador. Nada se envía a ningún servidor.
      </p>
      <div className={ui.acciones}>
        {hayMaterias && (
          <button type="button" className={ui.boton} onClick={() => setPendiente('ejemplo')}>
            Cargar datos de ejemplo
          </button>
        )}
        <button
          type="button"
          className={`${ui.boton} ${ui.peligro}`}
          disabled={!hayMaterias}
          onClick={() => setPendiente('borrar')}
        >
          Borrar todos los datos
        </button>
        <button type="button" className={ui.boton} onClick={() => window.print()}>
          Imprimir
        </button>
      </div>
      <DialogoConfirmar
        abierto={pendiente !== null}
        titulo={texto.titulo}
        descripcion={texto.descripcion}
        textoConfirmar={texto.boton}
        onConfirmar={confirmar}
        onCerrar={() => setPendiente(null)}
      />
    </section>
  );
}
