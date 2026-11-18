import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: false },
};

export default function NoEncontrada() {
  return (
    <div className="contenedor texto-legible">
      <h1>Página no encontrada</h1>
      <p>La dirección que buscas no existe o cambió de lugar.</p>
      <p>
        <Link href="/">Ir a la calculadora</Link>
      </p>
    </div>
  );
}
