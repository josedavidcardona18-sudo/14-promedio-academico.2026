import type { Metadata } from 'next';
import Link from 'next/link';
import { FormularioLogin } from '@/components/FormularioLogin';
import { modoDemo } from '@/lib/config';
import { rutaSegura } from '@/lib/redireccion';
import estilos from '../paginas.module.css';
import ui from '@/components/ui.module.css';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description: 'Entra a tu cuenta para ver y editar tus semestres, materias y notas.',
  // Una página de acceso no tiene nada que ofrecer en un buscador.
  robots: { index: false, follow: false },
};

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ siguiente?: string | string[] }>;
}) {
  const siguiente = rutaSegura((await searchParams).siguiente);
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Entrar a tu cuenta</h1>
        <p className={`${estilos.intro} texto-legible`}>
          Tus semestres y notas son privados: solo tú los ves.
        </p>
      </div>
      {modoDemo() && (
        <p className={`${ui.tarjeta} texto-legible`}>
          Esta copia funciona en <strong>modo demostración</strong>: no necesitas cuenta.{' '}
          <Link href={siguiente}>Continuar sin iniciar sesión</Link>
        </p>
      )}
      <FormularioLogin siguiente={siguiente} />
    </div>
  );
}
