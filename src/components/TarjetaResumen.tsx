import Link from 'next/link';
import { useId } from 'react';
import { formatearNota } from '@/lib/formato';
import type { ResumenMateria } from '@/services/semestre';
import { EstadoInsignia } from './EstadoInsignia';
import { mensajeSimulacion } from './textos';
import ui from './ui.module.css';
import estilos from './TarjetaResumen.module.css';

/** Presentación pura de una materia en el resumen: no calcula nada, solo muestra lo que recibe. */
export function TarjetaResumen({ materia, meta }: { materia: ResumenMateria; meta: number }) {
  const idTitulo = useId();
  const { resultado, simulacion, nombre, creditos } = materia;
  const mensaje = mensajeSimulacion(simulacion, meta);
  return (
    <article className={`${ui.tarjeta} ${estilos.tarjeta}`} aria-labelledby={idTitulo}>
      <header className={estilos.cabecera}>
        <h3 id={idTitulo}>{nombre}</h3>
        <p className={ui.ayuda}>{creditos === 1 ? '1 crédito' : `${creditos} créditos`}</p>
        <EstadoInsignia resultado={resultado} />
      </header>
      <p className={estilos.promedio}>
        <span className={ui.ayuda}>Promedio actual</span>
        <strong>
          {resultado.promedioActual === null ? '—' : formatearNota(resultado.promedioActual)}
        </strong>
      </p>
      <p className={ui.mensaje} data-tono={mensaje.tono}>
        <span aria-hidden="true">{mensaje.icono}</span>
        <span>{mensaje.texto}</span>
      </p>
      <Link
        href={`/materias/${materia.id}`}
        className={`${ui.boton} ${estilos.enlace} no-imprimir`}
      >
        Ver y editar notas <span className="solo-lectores">de {nombre}</span>
      </Link>
    </article>
  );
}
