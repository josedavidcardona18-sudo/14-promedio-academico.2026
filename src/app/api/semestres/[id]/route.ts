import { LIMITE_ESCRITURA } from '@/lib/constantes';
import { json, leer, leerCuerpo, manejar, sinContenido } from '@/lib/http';
import { idSchema, semestreEntradaSchema } from '@/schemas/semestre';
import { actualizarSemestre, eliminarSemestre, obtenerSemestre } from '@/services/semestres';
import { contextoAutenticado } from '../../contexto';

export const runtime = 'nodejs';

interface Contexto {
  params: Promise<{ id: string }>;
}

export const GET = manejar<Contexto>(async (peticion, { params }) => {
  const { usuario, repositorio } = await contextoAutenticado(peticion);
  const id = leer(idSchema, (await params).id, 'id');
  return json(await obtenerSemestre(repositorio, usuario.uid, id));
});

export const PUT = manejar<Contexto>(
  async (peticion, { params }) => {
    const { usuario, repositorio } = await contextoAutenticado(peticion);
    const id = leer(idSchema, (await params).id, 'id');
    const datos = await leerCuerpo(peticion, semestreEntradaSchema);
    return json(await actualizarSemestre(repositorio, usuario.uid, id, datos));
  },
  { limite: LIMITE_ESCRITURA },
);

export const DELETE = manejar<Contexto>(
  async (peticion, { params }) => {
    const { usuario, repositorio } = await contextoAutenticado(peticion);
    const id = leer(idSchema, (await params).id, 'id');
    await eliminarSemestre(repositorio, usuario.uid, id);
    return sinContenido();
  },
  { limite: LIMITE_ESCRITURA },
);
