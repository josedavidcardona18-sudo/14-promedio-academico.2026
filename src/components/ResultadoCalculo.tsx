import { useId } from 'react';
import { formatearNota, formatearPorcentaje } from '@/lib/formato';
import type { ResultadoMateria, Simulacion } from '@/services/promedios';
import { EstadoInsignia } from './EstadoInsignia';
import { mensajeSimulacion } from './textos';
import ui from './ui.module.css';
import estilos from './ResultadoCalculo.module.css';

interface Props {
  resultado: ResultadoMateria;
  simulacion: Simulacion;
  meta: number;
}

function Dato({ nombre, valor, detalle }: { nombre: string; valor: string; detalle?: string }) {
  return (
    <div className={estilos.dato}>
      <dt>{nombre}</dt>
      <dd>
        <strong>{valor}</strong>
        {detalle && <span className={ui.ayuda}> {detalle}</span>}
      </dd>
    </div>
  );
}

/** Presentación pura: los números llegan ya calculados y se anuncian con `aria-live` al cambiar. */
export function ResultadoCalculo({ resultado, simulacion, meta }: Props) {
  const idTitulo = useId();
  const mensaje = mensajeSimulacion(simulacion, meta);
  const { promedioActual, acumulado, definitiva, pesoEvaluado, pesoPendiente } = resultado;
  return (
    <section className={`${ui.tarjeta} ${estilos.resultado}`} aria-labelledby={idTitulo}>
      <h3 id={idTitulo}>Resultado</h3>
      <EstadoInsignia resultado={resultado} />
      <dl className={estilos.datos}>
        <Dato
          nombre="Promedio actual"
          valor={promedioActual === null ? '—' : formatearNota(promedioActual)}
          detalle={`de lo evaluado (${formatearPorcentaje(pesoEvaluado)})`}
        />
        <Dato nombre="Acumulado" valor={formatearNota(acumulado)} detalle="de 5,0 posibles" />
        <Dato
          nombre="Definitiva"
          valor={definitiva === null ? 'Pendiente' : formatearNota(definitiva)}
          detalle={
            definitiva === null ? `falta evaluar ${formatearPorcentaje(pesoPendiente)}` : undefined
          }
        />
      </dl>
      <p className={ui.mensaje} data-tono={mensaje.tono} aria-live="polite" aria-atomic="true">
        <span aria-hidden="true">{mensaje.icono}</span>
        <span>{mensaje.texto}</span>
      </p>
    </section>
  );
}
