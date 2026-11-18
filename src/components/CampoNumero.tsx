'use client';

import { useState } from 'react';
import { aTexto, leerNumero } from '@/domain/numeros';
import { CampoTexto } from './CampoTexto';

interface Props {
  etiqueta: string;
  valor: number | null;
  onCambio: (valor: number | null) => void;
  /** Qué valor se informa cuando el campo queda vacío o ilegible (por defecto, «sin valor»). */
  vacioEs?: number | null;
  error?: string | undefined;
  ayuda?: string | undefined;
}

function valorDelTexto(texto: string, vacioEs: number | null): number | null {
  const lectura = leerNumero(texto);
  return lectura.tipo === 'numero' ? lectura.valor : vacioEs;
}

/**
 * Campo para notas, porcentajes y créditos. Guarda lo que la persona escribe («3,», «,5») y solo
 * informa el número; acepta coma o punto decimal. Un texto ilegible se avisa en el propio campo.
 */
export function CampoNumero({ etiqueta, valor, onCambio, vacioEs = null, error, ayuda }: Props) {
  const [texto, setTexto] = useState(aTexto(valor));
  const [valorVisto, setValorVisto] = useState(valor);
  // Si el valor cambia desde fuera (otra pestaña, datos de ejemplo), el campo lo refleja.
  if (valor !== valorVisto) {
    setValorVisto(valor);
    if (valorDelTexto(texto, vacioEs) !== valor) setTexto(aTexto(valor));
  }
  const ilegible = leerNumero(texto).tipo === 'invalido';
  return (
    <CampoTexto
      etiqueta={etiqueta}
      valor={texto}
      inputMode="decimal"
      ayuda={ayuda}
      error={ilegible ? 'Escribe un número, por ejemplo 3,5.' : error}
      onCambio={(nuevo) => {
        const informado = valorDelTexto(nuevo, vacioEs);
        setTexto(nuevo);
        setValorVisto(informado);
        onCambio(informado);
      }}
    />
  );
}
