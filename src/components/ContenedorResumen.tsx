'use client';

import { ConSemestreActivo } from './ConSemestreActivo';
import { PanelResumen } from './PanelResumen';

/** Contenedor de la ruta `/`: obtiene los datos; `PanelResumen` los presenta. */
export function ContenedorResumen() {
  return (
    <ConSemestreActivo>
      {({ semestre, acciones }) => <PanelResumen semestre={semestre} acciones={acciones} />}
    </ConSemestreActivo>
  );
}
