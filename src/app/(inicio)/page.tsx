import type { Metadata } from 'next';
import { ContenedorResumen } from '@/components/ContenedorResumen';
import { DESCRIPCION, TITULO_INICIO } from '../sitio';
import estilos from '../paginas.module.css';

export const metadata: Metadata = {
  title: { absolute: TITULO_INICIO },
  description: DESCRIPCION,
  alternates: { canonical: '/' },
};

export default function Inicio() {
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Resumen del semestre</h1>
        <p className={`${estilos.intro} texto-legible`}>
          Tu promedio ponderado por créditos y, para cada materia, qué nota necesitas en lo que
          falta para aprobar.
        </p>
      </div>
      <ContenedorResumen />
    </div>
  );
}
