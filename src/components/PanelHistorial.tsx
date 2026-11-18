'use client';

import { useId } from 'react';
import { LIMITES } from '@/schemas/semestre';
import type { DatosCuenta } from './ConSemestres';
import { ComparadorSemestres } from './ComparadorSemestres';
import { EstadoSinSemestres } from './EstadoSinSemestres';
import { FormularioSemestre } from './FormularioSemestre';
import { TablaHistorial } from './TablaHistorial';
import { TarjetaSemestre } from './TarjetaSemestre';
import ui from './ui.module.css';
import estilos from './PanelHistorial.module.css';

function NuevoSemestre({ semestres, acciones }: DatosCuenta) {
  const lleno = semestres.length >= LIMITES.maxSemestres;
  return (
    <details className={`${ui.tarjeta} no-imprimir`}>
      <summary>Nuevo semestre</summary>
      {lleno ? (
        <p>Llegaste al máximo de {LIMITES.maxSemestres} semestres. Elimina uno para crear otro.</p>
      ) : (
        <FormularioSemestre
          etiquetaGuardar="Crear semestre"
          limpiarAlGuardar
          onGuardar={async (datos) => void (await acciones.crearSemestre(datos))}
        />
      )}
    </details>
  );
}

/** Historial: todos los semestres de la cuenta, comparados, y su administración (crear, editar, eliminar). */
export function PanelHistorial({ semestres, acciones }: DatosCuenta) {
  const idTabla = useId();
  const idComparar = useId();
  const idLista = useId();
  if (semestres.length === 0) return <EstadoSinSemestres acciones={acciones} />;
  return (
    <div className={estilos.panel}>
      <section aria-labelledby={idTabla} className={estilos.seccion}>
        <h2 id={idTabla}>Promedio por semestre</h2>
        <TablaHistorial semestres={semestres} />
      </section>
      {semestres.length > 1 && (
        <section aria-labelledby={idComparar} className={estilos.seccion}>
          <h2 id={idComparar}>Comparar dos semestres</h2>
          <ComparadorSemestres semestres={semestres} />
        </section>
      )}
      <section aria-labelledby={idLista} className={estilos.seccion}>
        <h2 id={idLista}>Mis semestres ({semestres.length})</h2>
        <NuevoSemestre semestres={semestres} acciones={acciones} />
        <ul className={estilos.lista}>
          {semestres.map((semestre) => (
            <li key={semestre.id}>
              <TarjetaSemestre
                semestre={semestre}
                onEditar={(datos) => acciones.actualizarSemestre(semestre.id, datos)}
                onEliminar={() => acciones.eliminarSemestre(semestre.id)}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
