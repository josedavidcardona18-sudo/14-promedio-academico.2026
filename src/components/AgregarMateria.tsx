'use client';

import { useId } from 'react';
import { crearMateria, type Accion } from '@/domain/reducer';
import { nuevoId } from '@/hooks/nuevoId';
import { FormMateria } from './FormMateria';
import ui from './ui.module.css';
import estilos from './AgregarMateria.module.css';

interface Props {
  despachar: (accion: Accion) => void;
  anunciar: (mensaje: string) => void;
}

export function AgregarMateria({ despachar, anunciar }: Props) {
  const idTitulo = useId();
  return (
    <section className={`${ui.tarjeta} ${estilos.agregar}`} aria-labelledby={idTitulo}>
      <h2 id={idTitulo}>Agregar materia</h2>
      <FormMateria
        textoBoton="Agregar materia"
        onGuardar={(nombre, creditos) => {
          despachar({
            tipo: 'agregar-materia',
            materia: crearMateria(nuevoId(), nombre, creditos),
          });
          anunciar(`Materia «${nombre.trim()}» agregada.`);
        }}
      />
    </section>
  );
}
