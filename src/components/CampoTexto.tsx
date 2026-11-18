import { useId, type ChangeEvent, type InputHTMLAttributes, type Ref } from 'react';
import ui from './ui.module.css';

interface Props {
  etiqueta: string;
  valor: string;
  /** Recibe el texto y el propio `<input>` (para leer `validity` de la Constraint Validation API). */
  onCambio: (texto: string, entrada: HTMLInputElement) => void;
  error?: string | undefined;
  ayuda?: string | undefined;
  /** Marca el campo como inválido sin mostrar texto propio (el texto lo da otro elemento). */
  invalido?: boolean;
  /** `id` de otro elemento que también describe al campo (p. ej. el error de un grupo). */
  descritoPor?: string | undefined;
  atributos?: InputHTMLAttributes<HTMLInputElement>;
  ref?: Ref<HTMLInputElement>;
}

function describirPor(...ids: (string | false | undefined)[]): string | undefined {
  const validos = ids.filter(Boolean);
  return validos.length > 0 ? validos.join(' ') : undefined;
}

/** Etiqueta visible + entrada + ayuda + error anunciado (aria-live) y enlazado (aria-describedby). */
export function CampoTexto({
  etiqueta,
  valor,
  onCambio,
  error,
  ayuda,
  invalido,
  descritoPor,
  atributos,
  ref,
}: Props) {
  const id = useId();
  return (
    <div className={ui.campo}>
      <label className={ui.etiqueta} htmlFor={id}>
        {etiqueta}
      </label>
      <input
        type="text"
        autoComplete="off"
        spellCheck={false}
        {...atributos}
        ref={ref}
        id={id}
        className={ui.entrada}
        value={valor}
        aria-invalid={error || invalido ? true : undefined}
        aria-describedby={describirPor(ayuda && `${id}-ayuda`, error && `${id}-error`, descritoPor)}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onCambio(e.target.value, e.currentTarget)}
      />
      {ayuda && (
        <p id={`${id}-ayuda`} className={ui.ayuda}>
          {ayuda}
        </p>
      )}
      <p id={`${id}-error`} className={ui.error} aria-live="polite">
        {error && (
          <>
            <span aria-hidden="true">⚠ </span>
            {error}
          </>
        )}
      </p>
    </div>
  );
}
