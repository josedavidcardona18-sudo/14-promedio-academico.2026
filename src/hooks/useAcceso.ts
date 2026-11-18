import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { abrirSesion, ErrorDeApi } from '@/lib/api-cliente';
import { mensajeDeCuenta, obtenerIdToken } from '@/lib/firebase-cliente';
import { credencialesSchema } from '@/schemas/credenciales';

export type Modo = 'entrar' | 'registrar';
export type ErroresDeAcceso = Partial<Record<'correo' | 'clave', string>>;

function erroresPorCampo(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const errores: ErroresDeAcceso = {};
  for (const { path, message } of error.issues) {
    const campo = path[0];
    if ((campo === 'correo' || campo === 'clave') && !errores[campo]) errores[campo] = message;
  }
  return errores;
}

/** Estado y envío del formulario de acceso: valida con Zod, entra en Firebase y abre la sesión. */
export function useAcceso(siguiente: string) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>('entrar');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [errores, setErrores] = useState<ErroresDeAcceso>({});
  const [general, setGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const credenciales = credencialesSchema.safeParse({ correo, clave });
    setGeneral('');
    setErrores(credenciales.success ? {} : erroresPorCampo(credenciales.error));
    if (!credenciales.success) return;
    setEnviando(true);
    try {
      await abrirSesion(await obtenerIdToken(modo, credenciales.data));
      router.replace(siguiente);
      router.refresh();
    } catch (error) {
      setGeneral(error instanceof ErrorDeApi ? error.message : mensajeDeCuenta(error));
      setEnviando(false);
    }
  }

  return {
    modo,
    alternarModo: () => setModo((actual) => (actual === 'entrar' ? 'registrar' : 'entrar')),
    correo,
    setCorreo,
    clave,
    setClave,
    errores,
    general,
    enviando,
    enviar,
  };
}
