import type { Metadata } from 'next';
import { Calculadora } from '@/components/Calculadora';
import { DESCRIPCION, TITULO_INICIO } from './sitio';
import estilos from './page.module.css';

export const metadata: Metadata = {
  title: { absolute: TITULO_INICIO },
  description: DESCRIPCION,
  alternates: { canonical: '/' },
};

export default function Inicio() {
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Calculadora de promedio académico</h1>
        <p className={`${estilos.intro} texto-legible`}>
          Registra tus materias y las notas de cada corte. Verás tu promedio del semestre y, para
          cada materia, qué nota necesitas en lo que falta para aprobar.
        </p>
      </div>
      <Calculadora />
    </div>
  );
}
