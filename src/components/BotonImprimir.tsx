'use client';

import { useState } from 'react';
import ui from './ui.module.css';

/** `window.print()` con alternativa: si el navegador no lo ofrece, se explica en vez de fallar. */
export function BotonImprimir() {
  const [aviso, setAviso] = useState('');
  function imprimir() {
    if (typeof window.print === 'function') window.print();
    else setAviso('Tu navegador no permite imprimir desde la página: usa una captura de pantalla.');
  }
  return (
    <div className="no-imprimir">
      <button type="button" className={ui.boton} onClick={imprimir}>
        Imprimir resumen
      </button>
      <p className={ui.ayuda} role="status">
        {aviso}
      </p>
    </div>
  );
}
