import { useId } from 'react';
import type { SemestreConMaterias } from '@/schemas/semestre';
import ui from './ui.module.css';
import estilos from './SelectorSemestre.module.css';

interface Props {
  semestres: readonly SemestreConMaterias[];
  activoId: string;
  onElegir: (id: string) => void;
}

export function SelectorSemestre({ semestres, activoId, onElegir }: Props) {
  const id = useId();
  return (
    <div className={`${ui.campo} ${estilos.selector} no-imprimir`}>
      <label className={ui.etiqueta} htmlFor={id}>
        Semestre
      </label>
      <select
        id={id}
        className={ui.entrada}
        value={activoId}
        onChange={(e) => onElegir(e.target.value)}
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
