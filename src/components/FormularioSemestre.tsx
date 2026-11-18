'use client';

import { useState } from 'react';
import { useEnvioDeFormulario } from '@/hooks/useEnvioDeFormulario';
import { erroresPorCampo } from '@/schemas/errores';
import { semestreEntradaSchema, type SemestreEntrada } from '@/schemas/semestre';
import { AccionesDeFormulario } from './AccionesDeFormulario';
import { CampoNumero } from './CampoNumero';
import { CampoTexto } from './CampoTexto';
import estilos from './Formularios.module.css';

interface Props {
  inicial?: SemestreEntrada;
  /** Después de guardar vuelve a dejar el formulario vacío (para crear varios seguidos). */
  limpiarAlGuardar?: boolean;
  etiquetaGuardar: string;
  onGuardar: (datos: SemestreEntrada) => Promise<void>;
  onCancelar?: () => void;
}

const VACIO: SemestreEntrada = { nombre: '', meta: 3 };

/** Crear o editar un semestre. Valida con el mismo esquema Zod que la API; el servidor decide. */
export function FormularioSemestre({
  inicial = VACIO,
  limpiarAlGuardar = false,
  etiquetaGuardar,
  onGuardar,
  onCancelar,
}: Props) {
  const [nombre, setNombre] = useState(inicial.nombre);
  const [meta, setMeta] = useState<number | null>(inicial.meta);
  const validacion = semestreEntradaSchema.safeParse({ nombre, meta });
  const envio = useEnvioDeFormulario(
    validacion,
    async (datos) => {
      await onGuardar(datos);
      if (limpiarAlGuardar) {
        setNombre('');
        setMeta(3);
      }
    },
    'No se pudo guardar.',
  );
  const errores = envio.intentado ? erroresPorCampo(validacion.error) : {};

  return (
    <form className={estilos.formulario} onSubmit={envio.enviar} noValidate>
      <CampoTexto
        etiqueta="Nombre del semestre"
        valor={nombre}
        onCambio={setNombre}
        error={errores['nombre']}
        atributos={{ placeholder: 'Ej.: 2027-1', maxLength: 80 }}
      />
      <CampoNumero
        etiqueta="Meta de promedio (3,0 a 5,0)"
        valor={meta}
        onCambio={setMeta}
        min={3}
        max={5}
        paso={0.1}
        error={errores['meta']}
      />
      <AccionesDeFormulario
        fallo={envio.fallo}
        enviando={envio.enviando}
        etiqueta={etiquetaGuardar}
        enCurso="Guardando…"
        onCancelar={onCancelar}
      />
    </form>
  );
}
