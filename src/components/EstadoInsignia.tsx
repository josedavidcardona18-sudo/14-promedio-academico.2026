import type { ResultadoMateria } from '@/services/promedios';
import { describirEstado } from './textos';
import ui from './ui.module.css';

export function EstadoInsignia({ resultado }: { resultado: ResultadoMateria }) {
  const { texto, icono, tono } = describirEstado(resultado);
  return (
    <span className={ui.insignia} data-tono={tono}>
      <span aria-hidden="true">{icono}</span>
      {texto}
    </span>
  );
}
