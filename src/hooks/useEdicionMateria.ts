import { useMemo, useState, type FormEvent } from 'react';
import { erroresPorCampo } from '@/schemas/errores';
import {
  materiaEntradaSchema,
  type Materia,
  type MateriaEntrada,
  type Nota,
} from '@/schemas/semestre';
import { useBorrador } from './useBorrador';

export type Guardado = 'limpio' | 'borrador' | 'invalido' | 'guardando' | 'guardado';

/** Lo que se está escribiendo: `creditos` puede quedar vacío mientras se teclea. */
export interface Campos {
  nombre: string;
  creditos: number | null;
  notas: Nota[];
}

const aEntrada = ({ nombre, creditos, notas }: MateriaEntrada): MateriaEntrada => ({
  nombre,
  creditos,
  notas,
});
const iguales = (a: MateriaEntrada, b: MateriaEntrada) => JSON.stringify(a) === JSON.stringify(b);

/** El borrador solo existe mientras lo escrito sea válido y distinto de lo guardado. */
function sincronizarBorrador(
  revisada: ReturnType<typeof materiaEntradaSchema.safeParse>,
  guardada: MateriaEntrada,
  borrador: ReturnType<typeof useBorrador>,
): void {
  if (!revisada.success) return;
  if (iguales(revisada.data, guardada)) borrador.descartar();
  else borrador.guardar(revisada.data);
}

function estadoDeGuardado(
  fase: 'reposo' | 'guardando' | 'guardado',
  valida: boolean,
  cambiado: boolean,
): Guardado {
  if (fase === 'guardando') return 'guardando';
  if (!valida) return 'invalido';
  if (cambiado) return 'borrador';
  return fase === 'guardado' ? 'guardado' : 'limpio';
}

/**
 * Edición de una materia con guardado **explícito**: lo que se escribe queda como borrador en este
 * navegador (por si se cierra la pestaña) y solo se envía a la cuenta al pulsar «Guardar».
 */
export function useEdicionMateria(
  semestreId: string,
  materia: Materia,
  guardar: (materia: Materia) => Promise<void>,
) {
  const guardada = useMemo(() => aEntrada(materia), [materia]);
  const borrador = useBorrador(semestreId, materia.id);
  const [campos, setCampos] = useState<Campos>(() => borrador.borrador ?? guardada);
  const [fase, setFase] = useState<'reposo' | 'guardando' | 'guardado'>('reposo');
  const [fallo, setFallo] = useState('');
  const validacion = useMemo(() => materiaEntradaSchema.safeParse(campos), [campos]);
  const cambiado = validacion.success ? !iguales(validacion.data, guardada) : true;

  function editar(cambio: Partial<Campos>) {
    const siguiente = { ...campos, ...cambio };
    setCampos(siguiente);
    setFase('reposo');
    sincronizarBorrador(materiaEntradaSchema.safeParse(siguiente), guardada, borrador);
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!validacion.success) return;
    setFase('guardando');
    setFallo('');
    try {
      await guardar({ id: materia.id, ...validacion.data });
      borrador.descartar();
      setFase('guardado');
    } catch (error) {
      setFallo(error instanceof Error ? error.message : 'No se pudo guardar.');
      setFase('reposo');
    }
  }

  function descartar() {
    setCampos(guardada);
    setFallo('');
    setFase('reposo');
    borrador.descartar();
  }

  return {
    campos,
    errores: erroresPorCampo(validacion.error),
    validacion,
    cambiado,
    guardado: estadoDeGuardado(fase, validacion.success, cambiado),
    fallo,
    editar,
    enviar,
    descartar,
  };
}
