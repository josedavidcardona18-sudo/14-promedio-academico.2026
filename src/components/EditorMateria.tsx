'use client';

import { useMemo, useState } from 'react';
import { erroresPorCampo } from '@/schemas/errores';
import { materiaEntradaSchema, type Materia, type Nota } from '@/schemas/semestre';
import { calcularMateria, simularNota } from '@/services/promedios';
import { ListaDeNotas } from './ListaDeNotas';
import { ResultadoCalculo } from './ResultadoCalculo';
import ui from './ui.module.css';
import estilos from './EditorMateria.module.css';

interface Props {
  materia: Materia;
  meta: number;
  guardarMateria: (materia: Materia) => void;
}

type Guardado = 'nada' | 'guardado' | 'pendiente';

/**
 * Formulario controlado con validación cruzada (los porcentajes no pasan de 100 %). Las reglas son
 * las mismas del servidor: el esquema Zod. El resultado es estado derivado (`useMemo`), no guardado.
 */
export function EditorMateria({ materia, meta, guardarMateria }: Props) {
  const [notas, setNotas] = useState<Nota[]>(materia.notas);
  const [guardado, setGuardado] = useState<Guardado>('nada');
  const entrada = useMemo(
    () => ({ nombre: materia.nombre, creditos: materia.creditos, notas }),
    [materia.nombre, materia.creditos, notas],
  );
  const validacion = useMemo(() => materiaEntradaSchema.safeParse(entrada), [entrada]);
  const errores = useMemo(() => erroresPorCampo(validacion.error), [validacion]);
  const calculo = useMemo(
    () =>
      validacion.success
        ? { resultado: calcularMateria(notas), simulacion: simularNota(notas, meta) }
        : null,
    [validacion.success, notas, meta],
  );

  function cambiar(nuevas: Nota[]) {
    setNotas(nuevas);
    const revisada = materiaEntradaSchema.safeParse({ ...entrada, notas: nuevas });
    if (revisada.success) guardarMateria({ id: materia.id, ...revisada.data });
    setGuardado(revisada.success ? 'guardado' : 'pendiente');
  }

  return (
    <div className={estilos.editor}>
      <section
        className={`${ui.tarjeta} ${estilos.notas}`}
        aria-label={`Notas de ${materia.nombre}`}
      >
        <ListaDeNotas notas={notas} errores={errores} onCambiar={cambiar} />
        <p className={ui.ayuda} role="status">
          {guardado === 'guardado' && 'Cambios guardados como borrador en este navegador.'}
          {guardado === 'pendiente' && 'Hay datos por corregir: el borrador no se actualizó.'}
        </p>
      </section>
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
