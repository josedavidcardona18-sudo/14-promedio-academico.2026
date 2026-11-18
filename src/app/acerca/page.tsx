import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import estilos from './acerca.module.css';

export const metadata: Metadata = {
  title: 'Cómo se calcula',
  description:
    'Las fórmulas detrás de la calculadora: acumulado, promedio actual, definitiva, nota necesaria para aprobar y promedio ponderado por créditos.',
  alternates: { canonical: '/acerca' },
};

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{titulo}</h2>
      {children}
    </section>
  );
}

function Formula({ children }: { children: ReactNode }) {
  return <p className={estilos.formula}>{children}</p>;
}

function SeccionCortes() {
  return (
    <Seccion id="t-cortes" titulo="Notas por corte">
      <p>
        Cada materia se divide en cortes y cada corte vale un porcentaje de la nota final. Los
        porcentajes deben sumar 100 %. Por defecto son tres cortes de 30 %, 30 % y 40 %, pero puedes
        cambiarlos.
      </p>
      <Formula>acumulado = suma de (nota × porcentaje ÷ 100)</Formula>
      <p>
        <strong>Ejemplo:</strong> con 3,5 en el corte 1 (30 %) y 2,8 en el corte 2 (30 %), el
        acumulado es 3,5 × 0,30 + 2,8 × 0,30 = 1,89.
      </p>
    </Seccion>
  );
}

function SeccionActual() {
  return (
    <Seccion id="t-actual" titulo="Promedio actual y definitiva">
      <p>
        El <strong>promedio actual</strong> es el promedio de lo ya evaluado, sin contar lo que
        falta. La <strong>definitiva</strong> existe cuando ya tienes todas las notas.
      </p>
      <Formula>promedio actual = acumulado ÷ porcentaje evaluado × 100</Formula>
      <p>
        En el ejemplo: 1,89 ÷ 60 × 100 = 3,15. La definitiva se aproxima a dos decimales (la mitad
        hacia arriba) y ese valor es el que se compara con la nota mínima para aprobar.
      </p>
    </Seccion>
  );
}

function SeccionNecesaria() {
  return (
    <Seccion id="t-necesaria" titulo="¿Qué nota necesito?">
      <p>
        Con la meta que elijas (por defecto, la nota mínima para aprobar) se calcula qué promedio
        necesitas en los cortes que faltan:
      </p>
      <Formula>nota necesaria = (meta − acumulado) ÷ (porcentaje pendiente ÷ 100)</Formula>
      <p>
        El resultado se redondea <strong>hacia arriba</strong> al centésimo, para que esa nota sí
        alcance sin importar cómo aproxime tu institución. En el ejemplo, con meta 3,0 y 40 %
        pendiente: (3,0 − 1,89) ÷ 0,40 = 2,775, es decir, <strong>2,78</strong>.
      </p>
      <p>
        Si esa nota supera la máxima de la escala, la meta ya no es alcanzable y la calculadora te
        lo dice, junto con lo máximo que aún puedes lograr.
      </p>
    </Seccion>
  );
}

function SeccionEstados() {
  return (
    <Seccion id="t-estados" titulo="Estados de una materia">
      <ul>
        <li>
          <strong>Aprobación asegurada:</strong> el acumulado ya alcanza la mínima, aunque saques 0
          en lo que falta.
        </li>
        <li>
          <strong>Ya no alcanza para aprobar:</strong> ni con la nota máxima en lo que falta llegas
          a la mínima.
        </li>
        <li>
          <strong>Aprobada / Reprobada:</strong> ya están todas las notas y la definitiva se compara
          con la mínima.
        </li>
      </ul>
    </Seccion>
  );
}

function SeccionSemestre() {
  return (
    <Seccion id="t-semestre" titulo="Promedio del semestre">
      <p>
        Es un promedio ponderado por créditos de los promedios actuales de las materias que ya
        tienen notas:
      </p>
      <Formula>
        promedio = suma de (promedio actual × créditos) ÷ suma de créditos con notas
      </Formula>
    </Seccion>
  );
}

function SeccionDatos() {
  return (
    <Seccion id="t-privacidad" titulo="Tus datos">
      <p>
        No hay cuentas ni servidor: tus materias y notas se guardan solo en este navegador. Si
        borras los datos del sitio o usas otro dispositivo, no estarán. Estos cálculos son
        orientativos; la nota oficial la define el reglamento de tu institución.
      </p>
    </Seccion>
  );
}

export default function Acerca() {
  return (
    <article className={`contenedor ${estilos.articulo}`}>
      <h1>Cómo se calcula</h1>
      <p className={estilos.intro}>
        Todo se calcula en tu navegador con fórmulas sencillas. Aquí están, con un ejemplo, para que
        puedas comprobarlas a mano.
      </p>
      <SeccionCortes />
      <SeccionActual />
      <SeccionNecesaria />
      <SeccionEstados />
      <SeccionSemestre />
      <SeccionDatos />
      <p>
        <Link href="/">← Volver a la calculadora</Link>
      </p>
    </article>
  );
}
