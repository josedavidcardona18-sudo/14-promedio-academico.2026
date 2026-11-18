import { useEffect, useState } from 'react';
import { pedirUsuario, type UsuarioActual } from '@/lib/api-cliente';

/**
 * Quién es la persona (o `null` si no hay sesión). No bloquea nada: la API decide los permisos.
 * Con `activo = false` no pregunta nada (en `/login` no hay sesión que consultar, y un `401` de más
 * ensuciaría la consola de la página pública).
 */
export function useUsuario(activo = true): { cargando: boolean; usuario: UsuarioActual | null } {
  const [respuesta, setRespuesta] = useState<{ usuario: UsuarioActual | null } | null>(null);
  useEffect(() => {
    if (!activo) return;
    const control = new AbortController();
    pedirUsuario(control.signal).then(
      (usuario) => setRespuesta({ usuario }),
      () => {
        if (!control.signal.aborted) setRespuesta({ usuario: null });
      },
    );
    return () => control.abort();
  }, [activo]);
  return {
    cargando: activo && respuesta === null,
    usuario: activo ? (respuesta?.usuario ?? null) : null,
  };
}
