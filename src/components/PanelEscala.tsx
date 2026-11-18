'use client';

import { useId, useState } from 'react';
import type { Accion } from '@/domain/reducer';
import type { Config } from '@/domain/tipos';
import { hayErrores, validarConfig } from '@/domain/validacion';
import { CampoNumero } from './CampoNumero';
import ui from './ui.module.css';
import estilos from './PanelEscala.module.css';

interface Props {
  config: Config;
  despachar: (accion: Accion) => void;
}

/**
 * Edita la escala sobre un borrador: solo se guarda cuando la combinación es válida, así los
 * cálculos nunca trabajan con una escala imposible (p. ej. mínima mayor que la máxima).
 */
export function PanelEscala({ config, despachar }: Props) {
  const idTitulo = useId();
  const [borrador, setBorrador] = useState(config);
  const [guardada, setGuardada] = useState(config);
  if (config.notaMaxima !== guardada.notaMaxima || config.notaMinima !== guardada.notaMinima) {
    setGuardada(config);
    setBorrador(config);
  }
  const errores = validarConfig(borrador);

  function cambiar(parte: Partial<Config>) {
    const nueva = { ...borrador, ...parte };
    setBorrador(nueva);
    if (hayErrores(validarConfig(nueva))) return;
    setGuardada(nueva);
    despachar({ tipo: 'configurar', config: nueva });
  }

  return (
    <section className={`${ui.tarjeta} ${estilos.panel} no-imprimir`} aria-labelledby={idTitulo}>
      <h2 id={idTitulo}>Escala de notas</h2>
      <p className={ui.ayuda}>
        Por defecto, de 0 a 5 y se aprueba con 3,0. Cámbiala si tu institución usa otra.
      </p>
      <div className={estilos.campos}>
        <CampoNumero
          etiqueta="Nota máxima"
          valor={borrador.notaMaxima}
          vacioEs={0}
          error={errores.notaMaxima}
          onCambio={(valor) => cambiar({ notaMaxima: valor ?? 0 })}
        />
        <CampoNumero
          etiqueta="Nota mínima para aprobar"
          valor={borrador.notaMinima}
          vacioEs={0}
          error={errores.notaMinima}
          onCambio={(valor) => cambiar({ notaMinima: valor ?? 0 })}
        />
      </div>
    </section>
  );
}
