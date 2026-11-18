import ui from './ui.module.css';

interface Props {
  fallo: string;
  enviando: boolean;
  etiqueta: string;
  enCurso: string;
  onCancelar?: (() => void) | undefined;
}

/** Pie común de los formularios: el fallo del servidor como alerta, cancelar (si hay) y enviar. */
export function AccionesDeFormulario({ fallo, enviando, etiqueta, enCurso, onCancelar }: Props) {
  return (
    <>
      <p role="alert" className={ui.error}>
        {fallo}
      </p>
      <div className={ui.acciones}>
        {onCancelar && (
          <button type="button" className={ui.boton} onClick={onCancelar} disabled={enviando}>
            Cancelar
          </button>
        )}
        <button type="submit" className={`${ui.boton} ${ui.primario}`} disabled={enviando}>
          {enviando ? enCurso : etiqueta}
        </button>
      </div>
    </>
  );
}
