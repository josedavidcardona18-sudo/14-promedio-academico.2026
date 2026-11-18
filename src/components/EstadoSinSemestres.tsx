'use client';

import { useState } from 'react';
import type { AccionesSemestres } from '@/hooks/useSemestres';
import { FormularioSemestre } from './FormularioSemestre';
import estilos from './EstadosDeDatos.module.css';
import ui from './ui.module.css';

/** Vacío: invita a la siguiente acción en vez de dejar la pantalla en blanco. */
export function EstadoSinSemestres({ acciones }: { acciones: AccionesSemestres }) {
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState('');

  async function cargarEjemplo() {
    setCargando(true);
    setFallo('');
    try {
      await acciones.cargarEjemplo();
    } catch (error) {
      setFallo(error instanceof Error ? error.message : 'No se pudo cargar el ejemplo.');
      setCargando(false);
    }
  }

  return (
    <div className={`${ui.tarjeta} ${estilos.mensaje}`}>
      <h2>Aún no tienes semestres</h2>
      <p>Crea tu primer semestre o carga unos datos de ejemplo para ver cómo funciona.</p>
      <div>
        <button
          type="button"
          className={`${ui.boton} ${ui.primario}`}
          onClick={cargarEjemplo}
          disabled={cargando}
        >
          {cargando ? 'Cargando…' : 'Cargar datos de ejemplo'}
        </button>
      </div>
      <p role="alert" className={ui.error}>
        {fallo}
      </p>
      <h3>O crea el tuyo</h3>
      <FormularioSemestre
        etiquetaGuardar="Crear semestre"
        onGuardar={async (datos) => void (await acciones.crearSemestre(datos))}
      />
    </div>
  );
}
