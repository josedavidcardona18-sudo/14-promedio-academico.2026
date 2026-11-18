'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import estilos from './NavegacionPrincipal.module.css';

const ENLACES = [
  { href: '/', texto: 'Resumen' },
  { href: '/simulador', texto: 'Simulador' },
  { href: '/historial', texto: 'Historial' },
] as const;

function Enlaces({ semestre }: { semestre: string | null }) {
  const ruta = usePathname();
  return (
    <ul className={estilos.lista}>
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
          >
            {texto}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Los enlaces conservan el semestre elegido (`?semestre=`) al moverse entre pantallas. */
function ConSemestreElegido() {
  return <Enlaces semestre={useSearchParams().get('semestre')} />;
}

export function NavegacionPrincipal() {
  return (
    <nav aria-label="Principal">
      <Suspense fallback={<Enlaces semestre={null} />}>
        <ConSemestreElegido />
      </Suspense>
    </nav>
  );
}
