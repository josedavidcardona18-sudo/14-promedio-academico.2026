'use client';

import { useState } from 'react';
import { simularNota } from '@/domain/calculo';
import { aTexto, formatear } from '@/domain/numeros';
import type { Config, Materia } from '@/domain/tipos';
import { CampoNumero } from './CampoNumero';
import { mensajeSimulacion, nombreDeCorte } from './textos';
import ui from './ui.module.css';
import estilos from './Simulador.module.css';

interface Props {
  materia: Materia;
  config: Config;
}

/** El único corte que falta (con peso), para poder decir «en el Corte 3». */
function corteUnicoPendiente(materia: Materia): string | undefined {
  const pendientes = materia.cortes
    .map((corte, posicion) => ({ corte, posicion }))
    .filter(({ corte }) => corte.nota === null && corte.peso > 0);
  const [unico] = pendientes;
  return pendientes.length === 1 && unico ? nombreDeCorte(unico.posicion) : undefined;
}

export function Simulador({ materia, config }: Props) {
  const [meta, setMeta] = useState<number | null>(null);
  const metaEfectiva = meta ?? config.notaMinima;
  const fueraDeRango = metaEfectiva < 0 || metaEfectiva > config.notaMaxima;
  const mensaje = fueraDeRango
    ? undefined
    : mensajeSimulacion(
        simularNota(materia, config, metaEfectiva),
        metaEfectiva,
        corteUnicoPendiente(materia),
      );
  return (
    <div className={estilos.simulador}>
      <h4>¿Qué nota necesito?</h4>
      <CampoNumero
        etiqueta="Nota que quiero sacar (opcional)"
        valor={meta}
        onCambio={setMeta}
        ayuda={`Si lo dejas vacío se usa la mínima para aprobar: ${formatear(config.notaMinima)}.`}
        error={
          fueraDeRango ? `La meta debe estar entre 0 y ${aTexto(config.notaMaxima)}.` : undefined
        }
      />
      <p
        className={`${ui.mensaje} ${estilos.resultado}`}
        data-tono={mensaje?.tono}
        aria-live="polite"
      >
        {mensaje && (
          <>
            <span aria-hidden="true">{mensaje.icono}</span>
            <span>{mensaje.texto}</span>
          </>
        )}
      </p>
    </div>
  );
}
