import { useState, type FormEvent } from 'react';

interface Validacion<T> {
  success: boolean;
  data?: T;
}

/**
 * Envío común de los formularios: los errores solo se muestran después del primer intento, se evita
 * el doble envío y el fallo del servidor (409, 429…) se muestra tal cual en una alerta.
 */
export function useEnvioDeFormulario<T>(
  validacion: Validacion<T>,
  accion: (datos: T) => Promise<void>,
  mensajeDeFallo: string,
) {
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState('');

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setIntentado(true);
    setFallo('');
    if (!validacion.success || validacion.data === undefined) return;
    setEnviando(true);
    try {
      await accion(validacion.data);
      setIntentado(false);
    } catch (error) {
      setFallo(error instanceof Error ? error.message : mensajeDeFallo);
    }
    setEnviando(false);
  }

  return { intentado, enviando, fallo, enviar };
}
