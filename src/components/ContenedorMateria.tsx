'use client';

import Link from 'next/link';
import { ID_SEMESTRE_DE_EJEMPLO } from '@/lib/constantes';
import { ConSemestre } from './ConSemestre';
import { EditorMateria } from './EditorMateria';
import ui from './ui.module.css';

function MateriaNoEncontrada() {
  return (
    <div className={ui.tarjeta} role="alert">
      <h2>No encontramos esa materia</h2>
      <p>Puede que se haya restablecido el ejemplo o que la dirección esté mal escrita.</p>
      <Link href="/">Volver al resumen</Link>
    </div>
  );
}

/** Contenedor de la ruta `/materias/[id]`: busca la materia y entrega el editor. */
export function ContenedorMateria({ materiaId }: { materiaId: string }) {
  return (
    <ConSemestre id={ID_SEMESTRE_DE_EJEMPLO}>
      {({ semestre, guardarMateria }) => {
        const materia = semestre.materias.find((m) => m.id === materiaId);
        if (!materia) return <MateriaNoEncontrada />;
        return (
          <>
            <h2>
              {materia.nombre} <span className={ui.ayuda}>· {materia.creditos} créditos</span>
            </h2>
            <EditorMateria
              key={materia.id}
              materia={materia}
              meta={semestre.meta}
              guardarMateria={guardarMateria}
            />
          </>
        );
      }}
    </ConSemestre>
  );
}
