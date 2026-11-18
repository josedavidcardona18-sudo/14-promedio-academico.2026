'use client';

import { useRouter } from 'next/navigation';
import { useUsuario } from '@/hooks/useUsuario';
import { cerrarSesion } from '@/lib/api-cliente';
import ui from './ui.module.css';
import estilos from './MenuDeCuenta.module.css';

/** Quién tiene la sesión abierta y cómo salir; en modo demostración solo lo avisa. */
export function MenuDeCuenta() {
  const router = useRouter();
  const { usuario } = useUsuario();
  if (!usuario) return null;
  if (usuario.demo)
    return (
      <p className={`${ui.insignia} ${estilos.cuenta}`} data-tono="info">
        Modo demostración
      </p>
    );
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
