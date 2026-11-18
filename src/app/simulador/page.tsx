import type { Metadata } from 'next';
import { ContenedorSimulador } from '@/components/ContenedorSimulador';
import estilos from '../paginas.module.css';

export const metadata: Metadata = {
  title: 'Simulador: ¿qué nota necesito?',
  description:
    'Elige una materia y una meta de 3,0 a 5,0 y mira qué nota necesitas en lo que falta para alcanzarla.',
  alternates: { canonical: '/simulador' },
};

export default function Simulador() {
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>¿Qué nota necesito?</h1>
        <p className={`${estilos.intro} texto-legible`}>
          Elige una materia y la meta que quieres alcanzar. Te decimos cuánto debes sacar en lo que
          falta, o si la meta ya no es alcanzable.
        </p>
      </div>
      <ContenedorSimulador />
    </div>
  );
}
