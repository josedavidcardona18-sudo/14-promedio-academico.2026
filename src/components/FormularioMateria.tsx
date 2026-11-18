'use client';

import { useState } from 'react';
import { useEnvioDeFormulario } from '@/hooks/useEnvioDeFormulario';
import { erroresPorCampo } from '@/schemas/errores';
import { materiaEntradaSchema } from '@/schemas/semestre';
import { AccionesDeFormulario } from './AccionesDeFormulario';
import { CampoNumero } from './CampoNumero';
import { CampoTexto } from './CampoTexto';
import estilos from './Formularios.module.css';

interface Props {
  onCrear: (datos: { nombre: string; creditos: number }) => Promise<void>;
}

/** Crea una materia vacía; las notas se agregan después en su propia pantalla. */
export function FormularioMateria({ onCrear }: Props) {
  const [nombre, setNombre] = useState('');
  const [creditos, setCreditos] = useState<number | null>(3);
  const validacion = materiaEntradaSchema.safeParse({ nombre, creditos, notas: [] });
  const envio = useEnvioDeFormulario(
    validacion,
    (datos) => onCrear({ nombre: datos.nombre, creditos: datos.creditos }),
    'No se pudo crear la materia.',
  );
  const errores = envio.intentado ? erroresPorCampo(validacion.error) : {};

  return (
    <form
      className={estilos.formulario}
      onSubmit={envio.enviar}
      noValidate
      aria-label="Nueva materia"
    >
      <CampoTexto
        etiqueta="Nombre de la materia"
        valor={nombre}
        onCambio={setNombre}
        error={errores['nombre']}
        atributos={{ placeholder: 'Ej.: Física I', maxLength: 80 }}
      />
      <CampoNumero
        etiqueta="Créditos (1 a 20)"
        valor={creditos}
        onCambio={setCreditos}
        min={1}
        max={20}
        paso={1}
        error={errores['creditos']}
      />
      <AccionesDeFormulario
        fallo={envio.fallo}
        enviando={envio.enviando}
        etiqueta="Crear materia"
        enCurso="Creando…"
      />
    </form>
  );
}
