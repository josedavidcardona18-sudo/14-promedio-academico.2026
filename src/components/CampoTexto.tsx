import { useId, type ChangeEvent, type HTMLAttributes, type Ref } from 'react';
import ui from './ui.module.css';

interface Props {
  etiqueta: string;
  valor: string;
  onCambio: (texto: string) => void;
  error?: string | undefined;
  ayuda?: string | undefined;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  ref?: Ref<HTMLInputElement>;
}

function describirPor(id: string, ayuda: boolean, error: boolean): string | undefined {
  const ids = [ayuda && `${id}-ayuda`, error && `${id}-error`].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

/** Etiqueta visible + entrada + ayuda + error anunciado (aria-live) y enlazado (aria-describedby). */
export function CampoTexto({ etiqueta, valor, onCambio, error, ayuda, inputMode, ref }: Props) {
  const id = useId();
  return (
    <div className={ui.campo}>
      <label className={ui.etiqueta} htmlFor={id}>
        {etiqueta}
      </label>
      <input
        ref={ref}
        id={id}
        className={ui.entrada}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        spellCheck={false}
        value={valor}
        aria-invalid={error ? true : undefined}
        aria-describedby={describirPor(id, Boolean(ayuda), Boolean(error))}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onCambio(e.target.value)}
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
