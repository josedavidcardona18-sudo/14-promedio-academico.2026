import { useId } from 'react';
import type { ResumenSemestre as Resumen } from '@/domain/calculo';
import { formatear } from '@/domain/numeros';
import type { Config } from '@/domain/tipos';
import ui from './ui.module.css';
import estilos from './ResumenSemestre.module.css';

interface Props {
  resumen: Resumen;
  config: Config;
}

function leyenda(promedio: number | null, minima: number): string {
  if (promedio === null)
    return 'Agrega materias y registra al menos una nota para ver tu promedio.';
  const posicion = promedio >= minima ? 'por encima de' : 'por debajo de';
  return `Vas ${posicion} la nota mínima para aprobar (${formatear(minima)}).`;
}

function Dato({ nombre, valor }: { nombre: string; valor: string | number }) {
  return (
    <div className={estilos.dato}>
      <dt>{nombre}</dt>
      <dd>{valor}</dd>
    </div>
  );
}

export function ResumenSemestre({ resumen, config }: Props) {
  const idTitulo = useId();
  const { promedio, conteo, creditosConNotas, creditosTotales, materiasConErrores } = resumen;
  const avance = promedio === null ? 0 : Math.min(100, (promedio / config.notaMaxima) * 100);
  const marcaMinima = (config.notaMinima / config.notaMaxima) * 100;
  return (
    <section className={`${ui.tarjeta} ${estilos.resumen}`} aria-labelledby={idTitulo}>
      <h2 id={idTitulo}>Resumen del semestre</h2>
      <div className={estilos.principal}>
        <p className={estilos.cifra}>
          <span className="solo-lectores">Promedio ponderado por créditos: </span>
          {promedio === null ? '—' : formatear(promedio)}
        </p>
        <p className={ui.ayuda}>{leyenda(promedio, config.notaMinima)}</p>
        <div className={estilos.barra} aria-hidden="true">
          <span className={estilos.avance} style={{ inlineSize: `${avance}%` }} />
          <span className={estilos.marca} style={{ insetInlineStart: `${marcaMinima}%` }} />
        </div>
      </div>
      <dl className={estilos.datos}>
        <Dato nombre="Créditos con notas" valor={`${creditosConNotas} de ${creditosTotales}`} />
        <Dato nombre="Aprobadas o aseguradas" valor={conteo.aprobada + conteo.asegurada} />
        <Dato nombre="En curso" valor={conteo['en-curso'] + conteo['sin-notas']} />
        <Dato nombre="Sin posibilidad" valor={conteo['sin-salida'] + conteo.reprobada} />
      </dl>
      {materiasConErrores > 0 && (
        <p className={ui.mensaje} data-tono="aviso" role="status">
          <span aria-hidden="true">⚠</span>
          <span>
            {materiasConErrores === 1
              ? '1 materia tiene datos por corregir y no cuenta en el promedio.'
              : `${materiasConErrores} materias tienen datos por corregir y no cuentan en el promedio.`}
          </span>
        </p>
      )}
    </section>
  );
}
