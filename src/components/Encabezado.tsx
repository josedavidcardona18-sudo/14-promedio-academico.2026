import Link from 'next/link';
import { NavegacionPrincipal } from './NavegacionPrincipal';
import estilos from './Encabezado.module.css';

export function Encabezado() {
  return (
    <header className={`${estilos.encabezado} no-imprimir`}>
      <div className={estilos.interior}>
        <Link href="/" className={estilos.marca}>
          <span className={estilos.logo} aria-hidden="true">
            ✓
          </span>
          Promedio académico
        </Link>
        <NavegacionPrincipal />
      </div>
    </header>
  );
}
