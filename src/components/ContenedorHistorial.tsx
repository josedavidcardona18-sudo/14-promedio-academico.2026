'use client';

import { ConSemestres } from './ConSemestres';
import { PanelHistorial } from './PanelHistorial';

/** Contenedor de la ruta `/historial`. */
export function ContenedorHistorial() {
  return <ConSemestres>{(datos) => <PanelHistorial {...datos} />}</ConSemestres>;
}
