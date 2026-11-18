import type { EstadoMateria } from '@/domain/calculo';
import { ESTADOS } from './textos';
import ui from './ui.module.css';

export function EstadoInsignia({ estado }: { estado: EstadoMateria }) {
  const { texto, icono, tono } = ESTADOS[estado];
  return (
    <span className={ui.insignia} data-tono={tono}>
      <span aria-hidden="true">{icono}</span>
      {texto}
    </span>
  );
}
