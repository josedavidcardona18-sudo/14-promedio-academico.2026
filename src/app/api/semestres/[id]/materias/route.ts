import { LIMITE_ESCRITURA } from '@/lib/constantes';
import { creado, leer, leerCuerpo, manejar } from '@/lib/http';
import { idSchema, materiaCreacionSchema } from '@/schemas/semestre';
import { crearMateria } from '@/services/semestres';
import { contextoAutenticado } from '../../../contexto';

export const runtime = 'nodejs';

interface Contexto {
  params: Promise<{ id: string }>;
}

export const POST = manejar<Contexto>(
  async (peticion, { params }) => {
    const { usuario, repositorio } = await contextoAutenticado(peticion);
    const id = leer(idSchema, (await params).id, 'id');
    const datos = await leerCuerpo(peticion, materiaCreacionSchema);
    return creado(await crearMateria(repositorio, usuario.uid, id, datos));
  },
  { limite: LIMITE_ESCRITURA },
);
