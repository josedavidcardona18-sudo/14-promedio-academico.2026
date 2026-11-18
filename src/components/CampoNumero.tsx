'use client';

import { useEffect, useRef, useState } from 'react';
import { CampoTexto } from './CampoTexto';

interface Props {
  etiqueta: string;
  valor: number | null;
  onCambio: (valor: number | null) => void;
  min: number;
  max: number;
  paso: number;
  /** Qué valor se informa cuando el campo queda vacío o ilegible (por defecto, «sin valor»). */
  vacioEs?: number | null;
  error?: string | undefined;
  ayuda?: string | undefined;
  invalido?: boolean;
  descritoPor?: string | undefined;
}

const aTexto = (valor: number | null): string => (valor === null ? '' : String(valor));
const aValor = (texto: string, vacioEs: number | null): number | null =>
  texto === '' ? vacioEs : Number(texto);

/**
 * `<input type="number">` con la Constraint Validation API: `validity.badInput` detecta lo que el
 * navegador no pudo leer como número y `setCustomValidity` refleja nuestro mensaje en la validación
 * nativa del campo. El valor siempre llega con punto decimal, sea cual sea el idioma del navegador.
 */
export function CampoNumero({
  etiqueta,
  valor,
  onCambio,
  min,
  max,
  paso,
  vacioEs = null,
  error,
  ayuda,
  invalido,
  descritoPor,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState(aTexto(valor));
  const [valorVisto, setValorVisto] = useState(valor);
  const [ilegible, setIlegible] = useState(false);
  // Si el valor cambia desde fuera (otra pestaña, restablecer), el campo lo refleja.
  if (valor !== valorVisto) {
    setValorVisto(valor);
    if (aValor(texto, vacioEs) !== valor) {
      setTexto(aTexto(valor));
      setIlegible(false);
    }
  }
  const mensaje = ilegible ? 'Escribe un número válido, por ejemplo 3,5.' : error;

  useEffect(() => {
    ref.current?.setCustomValidity(mensaje ?? '');
  }, [mensaje]);

  return (
    <CampoTexto
      ref={ref}
      etiqueta={etiqueta}
      valor={texto}
      ayuda={ayuda}
      error={mensaje}
      invalido={invalido}
      descritoPor={descritoPor}
      atributos={{ type: 'number', inputMode: 'decimal', min, max, step: paso }}
      onCambio={(nuevo, entrada) => {
        const informado = aValor(nuevo, vacioEs);
        setTexto(nuevo);
        setIlegible(entrada.validity.badInput);
        setValorVisto(informado);
        onCambio(informado);
      }}
    />
  );
}
