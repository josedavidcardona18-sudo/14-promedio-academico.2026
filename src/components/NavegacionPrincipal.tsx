'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import estilos from './NavegacionPrincipal.module.css';

const ENLACES = [
  { href: '/', texto: 'Resumen' },
  { href: '/simulador', texto: 'Simulador' },
  { href: '/historial', texto: 'Historial' },
] as const;

interface PropiedadesDeLaLista {
  id: string;
  abierto: boolean;
  alElegir: () => void;
}

function Enlaces({
  semestre,
  id,
  abierto,
  alElegir,
}: PropiedadesDeLaLista & { semestre: string | null }) {
  const ruta = usePathname();
  return (
    <ul id={id} className={estilos.lista} data-abierto={abierto}>
      {ENLACES.map(({ href, texto }) => (
        <li key={href}>
          <Link
            href={
              semestre && href !== '/historial'
                ? `${href}?semestre=${encodeURIComponent(semestre)}`
                : href
            }
            className={estilos.enlace}
            aria-current={ruta === href ? 'page' : undefined}
            // Sin precarga: en escritorio los enlaces están a la vista y Next bajaría el JS de las
            // otras pantallas de antemano, gastando el presupuesto de 200 kB.
            prefetch={false}
            onClick={alElegir}
          >
            {texto}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Los enlaces conservan el semestre elegido (`?semestre=`) al moverse entre pantallas. */
function ConSemestreElegido(props: PropiedadesDeLaLista) {
  return <Enlaces semestre={useSearchParams().get('semestre')} {...props} />;
}

/**
 * Navegación principal. En pantallas estrechas es un menú colapsable (patrón «disclosure» del WAI:
 * un botón con `aria-expanded` y `aria-controls`); desde 768 px los enlaces se ven siempre.
 * Teclado: Esc cierra y devuelve el foco al botón, y el menú se cierra al elegir un enlace o al
 * mover el foco fuera (así no queda tapando lo que se enfoca después, WCAG 2.4.11).
 */
export function NavegacionPrincipal() {
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const idLista = useId();

  function alTeclear(evento: KeyboardEvent<HTMLElement>) {
    if (evento.key !== 'Escape' || !abierto) return;
    setAbierto(false);
    boton.current?.focus();
  }

  function alMoverElFoco(evento: FocusEvent<HTMLElement>) {
    const destino = evento.relatedTarget;
    if (destino instanceof Node && !evento.currentTarget.contains(destino)) setAbierto(false);
  }

  const lista = { id: idLista, abierto, alElegir: () => setAbierto(false) };
  return (
    <nav
      aria-label="Principal"
      className={estilos.nav}
      onKeyDown={alTeclear}
      onBlur={alMoverElFoco}
    >
      <button
        ref={boton}
        type="button"
        className={estilos.boton}
        aria-expanded={abierto}
        aria-controls={idLista}
        onClick={() => setAbierto((actual) => !actual)}
      >
        <span aria-hidden="true">{abierto ? '✕' : '☰'}</span> Menú
      </button>
      <Suspense fallback={<Enlaces semestre={null} {...lista} />}>
        <ConSemestreElegido {...lista} />
      </Suspense>
    </nav>
  );
}
