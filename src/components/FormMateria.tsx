'use client';

import { useRef, useState, type FormEvent } from 'react';
import { leerNumero } from '@/domain/numeros';
import { validarCreditos, validarNombre } from '@/domain/validacion';
import { CampoTexto } from './CampoTexto';
import ui from './ui.module.css';
import estilos from './FormMateria.module.css';

interface Props {
  textoBoton: string;
  inicial?: { nombre: string; creditos: number };
  onGuardar: (nombre: string, creditos: number) => void;
  onCancelar?: () => void;
}

interface Errores {
  nombre?: string | undefined;
  creditos?: string | undefined;
}

function leerCreditos(texto: string): number {
  const lectura = leerNumero(texto);
  return lectura.tipo === 'numero' ? lectura.valor : Number.NaN;
}

function revisar(nombre: string, creditos: string): Errores {
  return { nombre: validarNombre(nombre), creditos: validarCreditos(leerCreditos(creditos)) };
}

function Botones({ texto, onCancelar }: { texto: string; onCancelar: (() => void) | undefined }) {
  return (
    <div className={ui.acciones}>
      <button type="submit" className={`${ui.boton} ${ui.primario}`}>
        {texto}
      </button>
      {onCancelar && (
        <button type="button" className={ui.boton} onClick={onCancelar}>
          Cancelar
        </button>
      )}
    </div>
  );
}

/** Sirve para agregar una materia y para editarla. Valida al enviar y lleva el foco al primer error. */
export function FormMateria({ textoBoton, inicial, onGuardar, onCancelar }: Props) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [creditos, setCreditos] = useState(String(inicial?.creditos ?? 3));
  const [errores, setErrores] = useState<Errores>({});
  const refNombre = useRef<HTMLInputElement>(null);
  const refCreditos = useRef<HTMLInputElement>(null);

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const encontrados = revisar(nombre, creditos);
    setErrores(encontrados);
    if (encontrados.nombre) return refNombre.current?.focus();
    if (encontrados.creditos) return refCreditos.current?.focus();
    onGuardar(nombre, leerCreditos(creditos));
    if (!inicial) {
      setNombre('');
      refNombre.current?.focus();
    }
  }

  return (
    <form className={estilos.formulario} onSubmit={enviar} noValidate>
      <CampoTexto
        ref={refNombre}
        etiqueta="Nombre de la materia"
        valor={nombre}
        onCambio={setNombre}
        error={errores.nombre}
      />
      <CampoTexto
        ref={refCreditos}
        etiqueta="Créditos"
        valor={creditos}
        inputMode="numeric"
        onCambio={setCreditos}
        error={errores.creditos}
        ayuda="Pesan en el promedio del semestre."
      />
      <Botones texto={textoBoton} onCancelar={onCancelar} />
    </form>
  );
}
