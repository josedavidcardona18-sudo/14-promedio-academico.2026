'use client';

import { useMemo } from 'react';
import { useEdicionMateria, type Guardado } from '@/hooks/useEdicionMateria';
import type { Materia } from '@/schemas/semestre';
import { calcularMateria, simularNota } from '@/services/promedios';
import { CampoNumero } from './CampoNumero';
import { CampoTexto } from './CampoTexto';
import { ListaDeNotas } from './ListaDeNotas';
import { ResultadoCalculo } from './ResultadoCalculo';
import ui from './ui.module.css';
import estilos from './EditorMateria.module.css';

interface Props {
  semestreId: string;
  materia: Materia;
  meta: number;
  guardar: (materia: Materia) => Promise<void>;
}

const ESTADOS: Record<Guardado, string> = {
  limpio: '',
  guardando: 'Guardando…',
  guardado: 'Cambios guardados en tu cuenta.',
  borrador: 'Tienes cambios sin guardar. Quedan como borrador en este navegador.',
  invalido: 'Hay datos por corregir: no se puede guardar todavía.',
};

type Edicion = ReturnType<typeof useEdicionMateria>;

function PieDelEditor({ edicion }: { edicion: Edicion }) {
  return (
    <>
      <p className={ui.ayuda} role="status">
        {ESTADOS[edicion.guardado]}
      </p>
      <p role="alert" className={ui.error}>
        {edicion.fallo}
      </p>
      <div className={ui.acciones}>
        <button
          type="button"
          className={ui.boton}
          disabled={!edicion.cambiado}
          onClick={edicion.descartar}
        >
          Descartar cambios
        </button>
        <button
          type="submit"
          className={`${ui.boton} ${ui.primario}`}
          disabled={
            !edicion.cambiado || !edicion.validacion.success || edicion.guardado === 'guardando'
          }
        >
          Guardar cambios
        </button>
      </div>
    </>
  );
}

function DatosDeLaMateria({ edicion }: { edicion: Edicion }) {
  const { campos, errores } = edicion;
  return (
    <>
      <CampoTexto
        etiqueta="Nombre de la materia"
        valor={campos.nombre}
        onCambio={(nombre) => edicion.editar({ nombre })}
        error={errores['nombre']}
        atributos={{ maxLength: 80 }}
      />
      <CampoNumero
        etiqueta="Créditos (1 a 20)"
        valor={campos.creditos}
        onCambio={(creditos) => edicion.editar({ creditos })}
        min={1}
        max={20}
        paso={1}
        error={errores['creditos']}
      />
      <ListaDeNotas
        notas={campos.notas}
        errores={errores}
        onCambiar={(notas) => edicion.editar({ notas })}
      />
    </>
  );
}

/**
 * Formulario controlado con validación cruzada (los porcentajes no pasan de 100 %). Las reglas son
 * las mismas del servidor: el esquema Zod. El resultado es estado derivado (`useMemo`), no guardado.
 */
export function EditorMateria({ semestreId, materia, meta, guardar }: Props) {
  const edicion = useEdicionMateria(semestreId, materia, guardar);
  const { campos, validacion } = edicion;
  const calculo = useMemo(
    () =>
      validacion.success
        ? { resultado: calcularMateria(campos.notas), simulacion: simularNota(campos.notas, meta) }
        : null,
    [validacion.success, campos.notas, meta],
  );

  return (
    <div className={estilos.editor}>
      <form
        className={`${ui.tarjeta} ${estilos.notas}`}
        aria-label={`Notas de ${materia.nombre}`}
        onSubmit={edicion.enviar}
        noValidate
      >
        <DatosDeLaMateria edicion={edicion} />
        <PieDelEditor edicion={edicion} />
      </form>
      {calculo ? (
        <ResultadoCalculo
          resultado={calculo.resultado}
          simulacion={calculo.simulacion}
          meta={meta}
        />
      ) : (
        <p className={ui.mensaje} data-tono="aviso" role="status">
          <span aria-hidden="true">⚠</span>
          <span>Corrige los datos marcados para ver el resultado de esta materia.</span>
        </p>
      )}
    </div>
  );
}
