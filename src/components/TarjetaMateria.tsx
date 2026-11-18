'use client';

import { useId, useRef, useState } from 'react';
import { analizarMateria, type ResultadoMateria as ResultadoDeMateria } from '@/domain/calculo';
import type { Accion } from '@/domain/reducer';
import type { Config, Materia } from '@/domain/tipos';
import { hayErrores, type ErroresMateria } from '@/domain/validacion';
import { CabeceraMateria } from './CabeceraMateria';
import { Cortes } from './Cortes';
import { DialogoConfirmar } from './DialogoConfirmar';
import { FormMateria } from './FormMateria';
import { ResultadoMateria } from './ResultadoMateria';
import { Simulador } from './Simulador';
import ui from './ui.module.css';
import estilos from './TarjetaMateria.module.css';

interface Props {
  materia: Materia;
  config: Config;
  despachar: (accion: Accion) => void;
  alEliminar: (nombre: string) => void;
}

interface PropsBloque {
  materia: Materia;
  config: Config;
  errores: ErroresMateria;
  resultado: ResultadoDeMateria | null;
}

function BloqueResultado({ materia, config, errores, resultado }: PropsBloque) {
  if (!resultado || hayErrores(errores)) return <AvisoDeErrores />;
  return (
    <>
      <ResultadoMateria resultado={resultado} config={config} />
      <div className="no-imprimir">
        <Simulador materia={materia} config={config} />
      </div>
    </>
  );
}

interface PropsEditor {
  materia: Materia;
  despachar: (accion: Accion) => void;
  alTerminar: () => void;
}

function EditorMateria({ materia, despachar, alTerminar }: PropsEditor) {
  return (
    <FormMateria
      textoBoton="Guardar cambios"
      inicial={{ nombre: materia.nombre, creditos: materia.creditos }}
      onGuardar={(nombre, creditos) => {
        despachar({ tipo: 'actualizar-materia', id: materia.id, nombre, creditos });
        alTerminar();
      }}
      onCancelar={alTerminar}
    />
  );
}

function AvisoDeErrores() {
  return (
    <p className={ui.mensaje} data-tono="aviso" role="status">
      <span aria-hidden="true">⚠</span>
      <span>Corrige los datos marcados para ver el resultado de esta materia.</span>
    </p>
  );
}

export function TarjetaMateria({ materia, config, despachar, alEliminar }: Props) {
  const idTitulo = useId();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const botonEditar = useRef<HTMLButtonElement>(null);
  const { errores, resultado } = analizarMateria(materia, config);

  function confirmarEliminar() {
    setConfirmando(false);
    despachar({ tipo: 'eliminar-materia', id: materia.id });
    alEliminar(materia.nombre);
  }

  function cerrarEdicion() {
    setEditando(false);
    requestAnimationFrame(() => botonEditar.current?.focus());
  }

  return (
    <article className={`${ui.tarjeta} ${estilos.tarjeta}`} aria-labelledby={idTitulo}>
      <CabeceraMateria
        idTitulo={idTitulo}
        materia={materia}
        estado={resultado?.estado}
        alEditar={() => setEditando(true)}
        alEliminar={() => setConfirmando(true)}
        refEditar={botonEditar}
      />
      {editando && (
        <EditorMateria materia={materia} despachar={despachar} alTerminar={cerrarEdicion} />
      )}
      <Cortes
        materia={materia}
        errores={errores}
        notaMaxima={config.notaMaxima}
        despachar={despachar}
      />
      <BloqueResultado materia={materia} config={config} errores={errores} resultado={resultado} />
      <DialogoConfirmar
        abierto={confirmando}
        titulo={`¿Eliminar «${materia.nombre}»?`}
        descripcion="Se borrarán sus cortes y notas. No se puede deshacer."
        textoConfirmar="Sí, eliminar"
        onConfirmar={confirmarEliminar}
        onCerrar={() => setConfirmando(false)}
      />
    </article>
  );
}
