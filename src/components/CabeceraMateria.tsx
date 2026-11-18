import type { Ref } from 'react';
import type { EstadoMateria } from '@/domain/calculo';
import type { Materia } from '@/domain/tipos';
import { EstadoInsignia } from './EstadoInsignia';
import ui from './ui.module.css';
import estilos from './CabeceraMateria.module.css';

interface Props {
  idTitulo: string;
  materia: Materia;
  estado: EstadoMateria | undefined;
  alEditar: () => void;
  alEliminar: () => void;
  refEditar: Ref<HTMLButtonElement>;
}

/** El nombre de la materia va oculto en los botones para que los lectores de pantalla sepan a cuál se refieren. */
export function CabeceraMateria({
  idTitulo,
  materia,
  estado,
  alEditar,
  alEliminar,
  refEditar,
}: Props) {
  const { nombre, creditos } = materia;
  return (
    <header className={estilos.cabecera}>
      <div>
        <h3 id={idTitulo}>{nombre}</h3>
        <p className={ui.ayuda}>{creditos === 1 ? '1 crédito' : `${creditos} créditos`}</p>
      </div>
      {estado && <EstadoInsignia estado={estado} />}
      <div className={`${ui.acciones} no-imprimir`}>
        <button ref={refEditar} type="button" className={ui.boton} onClick={alEditar}>
          Editar <span className="solo-lectores">{nombre}</span>
        </button>
        <button type="button" className={`${ui.boton} ${ui.peligro}`} onClick={alEliminar}>
          Eliminar <span className="solo-lectores">{nombre}</span>
        </button>
      </div>
    </header>
  );
}
