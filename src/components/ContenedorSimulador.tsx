'use client';

import { ConSemestreActivo } from './ConSemestreActivo';
import { PanelSimulador } from './PanelSimulador';

/** Contenedor de la ruta `/simulador`. */
export function ContenedorSimulador() {
  return (
    <ConSemestreActivo>
      {({ semestre }) => <PanelSimulador key={semestre.id} semestre={semestre} />}
    </ConSemestreActivo>
  );
}
