import ui from './ui.module.css';
import estilos from './EstadosDeDatos.module.css';

/** Carga: esqueleto con el mismo espacio que el contenido, para que la página no salte (CLS). */
export function Esqueleto() {
  return (
    <div className={estilos.esqueleto} aria-busy="true">
      <p role="status" className="solo-lectores">
        Cargando tus materias…
      </p>
      <div className={estilos.bloqueGrande} aria-hidden="true" />
      <div className={estilos.rejilla} aria-hidden="true">
        <div className={estilos.bloque} />
        <div className={estilos.bloque} />
        <div className={estilos.bloque} />
      </div>
    </div>
  );
}

/** Error con reintento: el mensaje se anuncia y el foco puede llegar al botón. */
export function MensajeDeError({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar: () => void;
}) {
  return (
    <div className={`${ui.tarjeta} ${estilos.mensaje}`} role="alert">
      <h2>No pudimos cargar tus datos</h2>
      <p>{mensaje}</p>
      <div>
        <button type="button" className={`${ui.boton} ${ui.primario}`} onClick={onReintentar}>
          Reintentar
        </button>
      </div>
    </div>
  );
}
