'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import estilos from './EstadosDeDatos.module.css';
import ui from './ui.module.css';

/** La API respondió 401: la cookie venció o fue revocada. Se explica y se ofrece volver a entrar. */
export function SesionVencida() {
  const ruta = usePathname();
  return (
    <div className={`${ui.tarjeta} ${estilos.mensaje}`} role="alert">
      <h2>Tu sesión venció</h2>
      <p>Por seguridad, la sesión se cierra después de un tiempo. Inicia sesión para seguir.</p>
      <div>
        <Link
          href={`/login?siguiente=${encodeURIComponent(ruta)}`}
          className={`${ui.boton} ${ui.primario}`}
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
