import type { ResultadoMateria as Resultado } from '@/domain/calculo';
import { formatear } from '@/domain/numeros';
import type { Config } from '@/domain/tipos';
import { porcentaje } from './textos';
import estilos from './ResultadoMateria.module.css';

interface Props {
  resultado: Resultado;
  config: Config;
}

function Dato({ nombre, valor, detalle }: { nombre: string; valor: string; detalle?: string }) {
  return (
    <div className={estilos.dato}>
      <dt>{nombre}</dt>
      <dd>
        <strong>{valor}</strong>
        {detalle && <span className={estilos.detalle}> {detalle}</span>}
      </dd>
    </div>
  );
}

export function ResultadoMateria({ resultado, config }: Props) {
  const { promedioActual, acumulado, definitiva, pesoEvaluado, pesoPendiente } = resultado;
  return (
    <dl className={estilos.datos}>
      <Dato
        nombre="Promedio actual"
        valor={promedioActual === null ? '—' : formatear(promedioActual)}
        detalle={
          promedioActual === null ? 'sin notas aún' : `de lo evaluado (${porcentaje(pesoEvaluado)})`
        }
      />
      <Dato
        nombre="Acumulado"
        valor={formatear(acumulado)}
        detalle={`de ${formatear(config.notaMaxima)} posibles`}
      />
      <Dato
        nombre="Definitiva"
        valor={definitiva === null ? 'Pendiente' : formatear(definitiva)}
        detalle={definitiva === null ? `falta evaluar ${porcentaje(pesoPendiente)}` : undefined}
      />
    </dl>
  );
}
