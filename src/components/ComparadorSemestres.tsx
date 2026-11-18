'use client';

import { useId, useMemo, useState } from 'react';
import { formatearCentesimas, formatearNota } from '@/lib/formato';
import type { SemestreConMaterias } from '@/schemas/semestre';
import { diferenciaDePromedios, tendenciaDe } from '@/services/comparacion';
import { resumirSemestre } from '@/services/semestre';
import ui from './ui.module.css';
import estilos from './ComparadorSemestres.module.css';

function Selector({
  etiqueta,
  valor,
  semestres,
  onCambio,
}: {
  etiqueta: string;
  valor: string;
  semestres: readonly SemestreConMaterias[];
  onCambio: (id: string) => void;
}) {
  const id = useId();
  return (
    <div className={ui.campo}>
      <label className={ui.etiqueta} htmlFor={id}>
        {etiqueta}
      </label>
      <select
        id={id}
        className={ui.entrada}
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
      >
        {semestres.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}

function frase(
  a: { nombre: string; promedio: number | null },
  b: { nombre: string; promedio: number | null },
): string {
  const diferencia = diferenciaDePromedios(b.promedio, a.promedio);
  if (diferencia === null || a.promedio === null || b.promedio === null) {
    return 'Uno de los dos semestres todavía no tiene notas: no hay con qué comparar.';
  }
  const tendencia = tendenciaDe(diferencia);
  const datos = `${b.nombre} (${formatearNota(b.promedio)}) frente a ${a.nombre} (${formatearNota(a.promedio)})`;
  if (tendencia === 'igual') return `${datos}: el promedio es igual.`;
  const lado = tendencia === 'sube' ? 'por encima' : 'por debajo';
  return `${datos}: ${formatearCentesimas(diferencia)} ${lado}.`;
}

/** Compara dos semestres cualquiera (el más reciente contra el anterior, al empezar). */
export function ComparadorSemestres({ semestres }: { semestres: readonly SemestreConMaterias[] }) {
  const [idA, setIdA] = useState(semestres[1]?.id ?? '');
  const [idB, setIdB] = useState(semestres[0]?.id ?? '');
  const a = semestres.find((s) => s.id === idA);
  const b = semestres.find((s) => s.id === idB);
  const resumenes = useMemo(
    () => ({
      a: a && { nombre: a.nombre, ...resumirSemestre(a.materias, a.meta) },
      b: b && { nombre: b.nombre, ...resumirSemestre(b.materias, b.meta) },
    }),
    [a, b],
  );
  return (
    <div className={`${ui.tarjeta} ${estilos.comparador}`}>
      <div className={estilos.selectores}>
        <Selector etiqueta="Semestre A" valor={idA} semestres={semestres} onCambio={setIdA} />
        <Selector etiqueta="Semestre B" valor={idB} semestres={semestres} onCambio={setIdB} />
      </div>
      <p role="status" className={estilos.resultado}>
        {idA === idB || !resumenes.a || !resumenes.b
          ? 'Elige dos semestres distintos para compararlos.'
          : frase(resumenes.a, resumenes.b)}
      </p>
    </div>
  );
}
