import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ContenedorHistorial } from '@/components/ContenedorHistorial';
import { Esqueleto } from '@/components/EstadosDeDatos';
import estilos from '../paginas.module.css';

export const metadata: Metadata = {
  title: 'Historial de semestres',
  description:
    'Compara tus semestres, mira cómo cambia tu promedio y administra tus semestres: crear, editar y eliminar.',
  alternates: { canonical: '/historial' },
};

export default function Historial() {
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Historial de semestres</h1>
        <p className={`${estilos.intro} texto-legible`}>
          Mira cómo cambia tu promedio de un semestre a otro y administra tus semestres.
        </p>
      </div>
      <Suspense fallback={<Esqueleto />}>
        <ContenedorHistorial />
      </Suspense>
    </div>
  );
}
