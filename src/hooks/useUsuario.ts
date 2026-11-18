import { useEffect, useState } from 'react';
import { pedirUsuario, type UsuarioActual } from '@/lib/api-cliente';

/** Quién es la persona (o `null` si no hay sesión). No bloquea nada: la API decide los permisos. */
export function useUsuario(): { cargando: boolean; usuario: UsuarioActual | null } {
  const [respuesta, setRespuesta] = useState<{ usuario: UsuarioActual | null } | null>(null);
  useEffect(() => {
    const control = new AbortController();
    pedirUsuario(control.signal).then(
      (usuario) => setRespuesta({ usuario }),
      () => {
        if (!control.signal.aborted) setRespuesta({ usuario: null });
      },
    );
    return () => control.abort();
  }, []);
  return { cargando: respuesta === null, usuario: respuesta?.usuario ?? null };
}
