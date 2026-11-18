'use client';

import { useAcceso } from '@/hooks/useAcceso';
import { CampoTexto } from './CampoTexto';
import estilos from './FormularioLogin.module.css';
import ui from './ui.module.css';

const TEXTOS = {
  entrar: { accion: 'Entrar', enCurso: 'Entrando…', cambio: '¿No tienes cuenta? Crear una' },
  registrar: { accion: 'Crear cuenta', enCurso: 'Creando…', cambio: '¿Ya tienes cuenta? Entrar' },
} as const;

/** Inicio de sesión y registro con correo y contraseña; el servidor guarda la sesión en una cookie HttpOnly. */
export function FormularioLogin({ siguiente }: { siguiente: string }) {
  const acceso = useAcceso(siguiente);
  const textos = TEXTOS[acceso.modo];

  return (
    <form className={estilos.formulario} onSubmit={acceso.enviar} noValidate aria-label="Acceso">
      <CampoTexto
        etiqueta="Correo electrónico"
        valor={acceso.correo}
        onCambio={acceso.setCorreo}
        error={acceso.errores.correo}
        atributos={{ type: 'email', autoComplete: 'email', inputMode: 'email' }}
      />
      <CampoTexto
        etiqueta="Contraseña"
        valor={acceso.clave}
        onCambio={acceso.setClave}
        error={acceso.errores.clave}
        ayuda={acceso.modo === 'registrar' ? 'Mínimo 6 caracteres.' : undefined}
        atributos={{
          type: 'password',
          autoComplete: acceso.modo === 'entrar' ? 'current-password' : 'new-password',
        }}
      />
      <p role="alert" className={ui.error}>
        {acceso.general}
      </p>
      <div className={estilos.acciones}>
        <button type="submit" className={`${ui.boton} ${ui.primario}`} disabled={acceso.enviando}>
          {acceso.enviando ? textos.enCurso : textos.accion}
        </button>
        <button
          type="button"
          className={ui.boton}
          disabled={acceso.enviando}
          onClick={acceso.alternarModo}
        >
          {textos.cambio}
        </button>
      </div>
    </form>
  );
}
