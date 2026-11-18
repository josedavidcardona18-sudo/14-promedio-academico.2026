'use client';

import { useRef, useState } from 'react';
import { resumirSemestre } from '@/domain/calculo';
import { estadoInicial } from '@/domain/constantes';
import { estadoDeEjemplo } from '@/domain/ejemplo';
import type { Accion } from '@/domain/reducer';
import { useAlmacen, useHidratado } from '@/hooks/useAlmacen';
import { AccionesDatos } from './AccionesDatos';
import { AgregarMateria } from './AgregarMateria';
import { ListaMaterias } from './ListaMaterias';
import { PanelEscala } from './PanelEscala';
import { ResumenSemestre } from './ResumenSemestre';
import estilos from './Calculadora.module.css';

function accionesDeDatos(despachar: (accion: Accion) => void, anunciar: (mensaje: string) => void) {
  return {
    cargarEjemplo: () => {
      despachar({ tipo: 'reemplazar', estado: estadoDeEjemplo() });
      anunciar('Datos de ejemplo cargados.');
    },
    borrarTodo: () => {
      despachar({ tipo: 'reemplazar', estado: estadoInicial() });
      anunciar('Se borraron todos los datos.');
    },
  };
}

export function Calculadora() {
  const { estado, despachar } = useAlmacen();
  const hidratado = useHidratado();
  const [anuncio, setAnuncio] = useState('');
  const refTituloMaterias = useRef<HTMLHeadingElement>(null);

  if (!hidratado) {
    return (
      <p className={estilos.cargando} role="status">
        Cargando tus materias…
      </p>
    );
  }

  const { materias, config } = estado;
  const { cargarEjemplo, borrarTodo } = accionesDeDatos(despachar, setAnuncio);
  const eliminada = (nombre: string) => {
    setAnuncio(`Materia «${nombre}» eliminada.`);
    requestAnimationFrame(() => refTituloMaterias.current?.focus());
  };

  return (
    <div className={estilos.calculadora}>
      <div role="status" className="solo-lectores">
        {anuncio}
      </div>
      <ResumenSemestre resumen={resumirSemestre(materias, config)} config={config} />
      <div className={`${estilos.herramientas} no-imprimir`}>
        <AgregarMateria despachar={despachar} anunciar={setAnuncio} />
        <PanelEscala config={config} despachar={despachar} />
      </div>
      <ListaMaterias
        materias={materias}
        config={config}
        despachar={despachar}
        alEliminar={eliminada}
        alCargarEjemplo={cargarEjemplo}
        refTitulo={refTituloMaterias}
      />
      <AccionesDatos
        hayMaterias={materias.length > 0}
        alCargarEjemplo={cargarEjemplo}
        alBorrarTodo={borrarTodo}
      />
    </div>
  );
}
