'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { borrar } from '@/storage/almacen';
import { claveDeBorrador } from '@/storage/borrador';
import { ConSemestreActivo } from './ConSemestreActivo';
import { EditorMateria } from './EditorMateria';
import { EliminarMateria } from './EliminarMateria';
import ui from './ui.module.css';

const enlaceAlResumen = (semestreId: string) => `/?semestre=${encodeURIComponent(semestreId)}`;

function MateriaNoEncontrada({ semestreId }: { semestreId: string }) {
  return (
    <div className={ui.tarjeta} role="alert">
      <h2>No encontramos esa materia</h2>
      <p>Puede que la hayas eliminado o que la dirección esté mal escrita.</p>
      <Link href={enlaceAlResumen(semestreId)} className={ui.volver}>
        Volver al resumen
      </Link>
    </div>
  );
}

/** Contenedor de la ruta `/materias/[id]`: busca la materia y entrega el editor. */
export function ContenedorMateria({ materiaId }: { materiaId: string }) {
  const router = useRouter();
  // Al eliminar, la lista se refresca antes de navegar: sin esto asomaría un instante el aviso
  // «No encontramos esa materia» (y un lector de pantalla lo anunciaría).
  const [saliendo, setSaliendo] = useState(false);
  return (
    <ConSemestreActivo selector={false}>
      {({ semestre, acciones }) => {
        const materia = semestre.materias.find((m) => m.id === materiaId);
        if (!materia && saliendo)
          return <p role="status">Materia eliminada. Volviendo al resumen…</p>;
        if (!materia) return <MateriaNoEncontrada semestreId={semestre.id} />;
        return (
          <div className={ui.apilado}>
            <Link href={enlaceAlResumen(semestre.id)} className={ui.volver}>
              ← Volver al resumen de {semestre.nombre}
            </Link>
            <h2>
              {materia.nombre} <span className={ui.ayuda}>· {materia.creditos} créditos</span>
            </h2>
            <EditorMateria
              key={materia.id}
              semestreId={semestre.id}
              materia={materia}
              meta={semestre.meta}
              guardar={(m) => acciones.actualizarMateria(semestre.id, m)}
            />
            <EliminarMateria
              nombre={materia.nombre}
              onEliminar={async () => {
                setSaliendo(true);
                try {
                  await acciones.eliminarMateria(semestre.id, materia.id);
                } catch (error) {
                  setSaliendo(false);
                  throw error;
                }
                borrar(claveDeBorrador(semestre.id, materia.id));
                router.replace(enlaceAlResumen(semestre.id));
              }}
            />
          </div>
        );
      }}
    </ConSemestreActivo>
  );
}
