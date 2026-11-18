'use client';

import { useRouter } from 'next/navigation';
import { useUsuario } from '@/hooks/useUsuario';
import { cerrarSesion, type UsuarioActual } from '@/lib/api-cliente';
import ui from './ui.module.css';
import estilos from './MenuDeCuenta.module.css';

function Contenido({ usuario }: { usuario: UsuarioActual | null }) {
  const router = useRouter();
  if (!usuario) return null;
  if (usuario.demo) {
    return (
      <p className={`${ui.insignia} ${estilos.cuenta}`} data-tono="info">
        Modo demostración
      </p>
    );
  }
  return (
    <div className={`${estilos.cuenta} no-imprimir`}>
      <span className={estilos.correo}>{usuario.correo ?? usuario.uid}</span>
      <button
        type="button"
        className={ui.boton}
        onClick={async () => {
          await cerrarSesion();
          router.replace('/login');
          router.refresh();
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}

/**
 * Quién tiene la sesión abierta y cómo salir; en modo demostración solo lo avisa. El espacio se
 * reserva desde el principio: si apareciera al llegar la respuesta, la cabecera cambiaría de altura
 * y empujaría toda la página (CLS).
 */
export function MenuDeCuenta() {
  const { usuario } = useUsuario();
  return (
    <div className={estilos.espacio}>
      <Contenido usuario={usuario} />
    </div>
  );
}
