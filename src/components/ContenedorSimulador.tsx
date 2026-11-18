'use client';

import { ID_SEMESTRE_DE_EJEMPLO } from '@/lib/constantes';
import { ConSemestre } from './ConSemestre';
import { PanelSimulador } from './PanelSimulador';

/** Contenedor de la ruta `/simulador`. */
export function ContenedorSimulador() {
  return (
    <ConSemestre id={ID_SEMESTRE_DE_EJEMPLO}>
      {(datos) => <PanelSimulador datos={datos} />}
    </ConSemestre>
  );
}
