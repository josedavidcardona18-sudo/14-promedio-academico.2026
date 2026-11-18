import { LIMITE_ESCRITURA } from '@/lib/constantes';
import { json, leer, leerCuerpo, manejar, sinContenido } from '@/lib/http';
import { idSchema, materiaEntradaSchema } from '@/schemas/semestre';
import { actualizarMateria, eliminarMateria, obtenerMateria } from '@/services/semestres';
import { contextoAutenticado } from '../../../../contexto';

export const runtime = 'nodejs';

interface Contexto {
  params: Promise<{ id: string; materiaId: string }>;
}

async function ids({ params }: Contexto): Promise<{ id: string; materiaId: string }> {
  const crudos = await params;
  return {
    id: leer(idSchema, crudos.id, 'id'),
    materiaId: leer(idSchema, crudos.materiaId, 'materiaId'),
  };
}

export const GET = manejar<Contexto>(async (peticion, contexto) => {
  const { usuario, repositorio } = await contextoAutenticado(peticion);
  const { id, materiaId } = await ids(contexto);
  return json(await obtenerMateria(repositorio, usuario.uid, id, materiaId));
});

/** PUT reemplaza la materia completa: las notas son obligatorias (para añadirla, POST). */
export const PUT = manejar<Contexto>(
  async (peticion, contexto) => {
    const { usuario, repositorio } = await contextoAutenticado(peticion);
    const { id, materiaId } = await ids(contexto);
    const datos = await leerCuerpo(peticion, materiaEntradaSchema);
    return json(await actualizarMateria(repositorio, usuario.uid, id, materiaId, datos));
  },
  { limite: LIMITE_ESCRITURA },
);

export const DELETE = manejar<Contexto>(
  async (peticion, contexto) => {
    const { usuario, repositorio } = await contextoAutenticado(peticion);
    const { id, materiaId } = await ids(contexto);
    await eliminarMateria(repositorio, usuario.uid, id, materiaId);
    return sinContenido();
  },
  { limite: LIMITE_ESCRITURA },
);
