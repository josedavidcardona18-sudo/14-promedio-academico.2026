'use client';

import { ID_SEMESTRE_DE_EJEMPLO } from '@/lib/constantes';
import { ConSemestre } from './ConSemestre';
import { PanelResumen } from './PanelResumen';

/** Contenedor de la ruta `/`: obtiene los datos; `PanelResumen` los presenta. */
export function ContenedorResumen() {
  return (
    <ConSemestre id={ID_SEMESTRE_DE_EJEMPLO}>
      {(datos) => <PanelResumen datos={datos} />}
    </ConSemestre>
  );
}
