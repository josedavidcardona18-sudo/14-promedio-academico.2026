import type { SemestreConMaterias } from '@/schemas/semestre';
import { formatearCentesimas, formatearNota } from '@/lib/formato';
import { diferenciaDePromedios, tendenciaDe } from '@/services/comparacion';
import { resumirSemestre } from '@/services/semestre';
import estilos from './TablaHistorial.module.css';

const PALABRA = { sube: 'Sube', baja: 'Baja', igual: 'Igual' } as const;
const FLECHA = { sube: '▲', baja: '▼', igual: '=' } as const;

function Cambio({ centesimas }: { centesimas: number | null }) {
  if (centesimas === null) return <span className={estilos.sinDato}>—</span>;
  const tendencia = tendenciaDe(centesimas);
  return (
    <span className={estilos.cambio} data-tendencia={tendencia}>
      <span aria-hidden="true">{FLECHA[tendencia]} </span>
      {PALABRA[tendencia]}
      {centesimas !== 0 && ` ${formatearCentesimas(centesimas)}`}
    </span>
  );
}

/** Del más reciente al más antiguo; «Cambio» compara cada semestre con el anterior a él. */
export function TablaHistorial({ semestres }: { semestres: readonly SemestreConMaterias[] }) {
  const filas = semestres.map((semestre) => ({
    semestre,
    resumen: resumirSemestre(semestre.materias, semestre.meta),
  }));
  return (
    <div
      className={estilos.envoltura}
      role="region"
      aria-label="Tabla de promedios por semestre"
      tabIndex={0}
    >
      <table className={estilos.tabla}>
        <caption className="solo-lectores">
          Promedio ponderado de cada semestre, del más reciente al más antiguo
        </caption>
        <thead>
          <tr>
            <th scope="col">Semestre</th>
            <th scope="col">Promedio</th>
            <th scope="col">Cambio</th>
            <th scope="col">Créditos</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(({ semestre, resumen }, i) => (
            <tr key={semestre.id}>
              <th scope="row">{semestre.nombre}</th>
              <td className={estilos.numero}>
                {resumen.promedio === null ? '—' : formatearNota(resumen.promedio)}
              </td>
              <td>
                <Cambio
                  centesimas={diferenciaDePromedios(
                    resumen.promedio,
                    filas[i + 1]?.resumen.promedio ?? null,
                  )}
                />
              </td>
              <td className={estilos.numero}>{resumen.creditosTotales}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
