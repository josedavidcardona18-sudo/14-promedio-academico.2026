'use client';

import { MensajeDeError } from '@/components/EstadosDeDatos';

/** Límite de errores de la ruta: nunca muestra detalles internos, solo permite reintentar. */
export default function ErrorDeRuta({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="contenedor">
      <MensajeDeError
        mensaje="Algo salió mal al mostrar esta página. Inténtalo de nuevo."
        onReintentar={reset}
      />
    </div>
  );
}
