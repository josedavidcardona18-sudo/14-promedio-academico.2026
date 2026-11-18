/**
 * Destino al que volver después de iniciar sesión (`/login?siguiente=/simulador`). Solo se aceptan
 * rutas de este mismo sitio: cualquier otra cosa (`//malo.com`, `https://…`, `/\malo.com`) se
 * descarta para que el inicio de sesión no sirva de redirección abierta.
 */
export function rutaSegura(valor: string | string[] | undefined): string {
  if (typeof valor !== 'string') return '/';
  const empiezaEnRuta =
    valor.startsWith('/') && !valor.startsWith('//') && !valor.startsWith('/\\');
  if (!empiezaEnRuta || /[\u0000-\u001f]/.test(valor)) return '/';
  return valor.startsWith('/login') ? '/' : valor;
}
