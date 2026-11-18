'use client';

import { useId, useMemo } from 'react';
import type { DatosSemestre } from '@/hooks/useSemestreActual';
import { formatearNota } from '@/lib/formato';
import { resumirSemestre } from '@/services/semestre';
import { AvisoDeEjemplo } from './AvisoDeEjemplo';
import { BotonImprimir } from './BotonImprimir';
import { TarjetaResumen } from './TarjetaResumen';
import ui from './ui.module.css';
import estilos from './PanelResumen.module.css';

function Dato({ nombre, valor }: { nombre: string; valor: string | number }) {
  return (
    <div className={estilos.dato}>
      <dt>{nombre}</dt>
      <dd>{valor}</dd>
    </div>
  );
}

function leyenda(promedio: number | null): string {
  if (promedio === null) return 'Registra al menos una nota para ver tu promedio.';
  return promedio >= 3
    ? 'Vas por encima de 3,0, la nota para aprobar.'
    : 'Vas por debajo de 3,0, la nota para aprobar.';
}

/** Estado derivado: los promedios se calculan con `useMemo` a partir de las notas, no se guardan. */
export function PanelResumen({ datos }: { datos: DatosSemestre }) {
  const idResumen = useId();
  const idMaterias = useId();
  const { semestre } = datos;
  const resumen = useMemo(
    () => resumirSemestre(semestre.materias, semestre.meta),
    [semestre.materias, semestre.meta],
  );
  const { conteo, promedio } = resumen;
  return (
    <div className={estilos.panel}>
      <AvisoDeEjemplo datos={datos} />
      <section className={`${ui.tarjeta} ${estilos.resumen}`} aria-labelledby={idResumen}>
        <h2 id={idResumen}>Resumen de {semestre.nombre}</h2>
        <p className={estilos.cifra}>
          <span className="solo-lectores">Promedio ponderado por créditos: </span>
          {promedio === null ? '—' : formatearNota(promedio)}
        </p>
        <p className={ui.ayuda}>{leyenda(promedio)}</p>
        <dl className={estilos.datos}>
          <Dato
            nombre="Créditos con notas"
            valor={`${resumen.creditosConNotas} de ${resumen.creditosTotales}`}
          />
          <Dato nombre="Aprobando" valor={conteo.aprobando} />
          <Dato nombre="En riesgo" valor={conteo['en-riesgo']} />
          <Dato nombre="Perdidas" valor={conteo.perdida} />
        </dl>
        <BotonImprimir />
      </section>
      <section aria-labelledby={idMaterias} className={estilos.materias}>
        <h2 id={idMaterias}>Materias ({resumen.materias.length})</h2>
        <ul className={estilos.lista}>
          {resumen.materias.map((materia) => (
            <li key={materia.id}>
              <TarjetaResumen materia={materia} meta={resumen.meta} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
