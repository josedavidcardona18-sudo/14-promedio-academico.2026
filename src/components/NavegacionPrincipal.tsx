'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import estilos from './NavegacionPrincipal.module.css';

const ENLACES = [
  { href: '/', texto: 'Resumen' },
  { href: '/simulador', texto: 'Simulador' },
] as const;

export function NavegacionPrincipal() {
  const ruta = usePathname();
  return (
    <nav aria-label="Principal">
      <ul className={estilos.lista}>
        {ENLACES.map(({ href, texto }) => (
          <li key={href}>
            <Link
              href={href}
              className={estilos.enlace}
              aria-current={ruta === href ? 'page' : undefined}
            >
              {texto}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
