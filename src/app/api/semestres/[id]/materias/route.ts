import { LIMITE_ESCRITURA } from '@/lib/constantes';
import { creado, json, leer, leerCuerpo, manejar } from '@/lib/http';
import { idSchema, listaQuerySchema, materiaCreacionSchema } from '@/schemas/semestre';
import { crearMateria, listarMaterias } from '@/services/semestres';
import { contextoAutenticado } from '../../../contexto';

export const runtime = 'nodejs';

interface Contexto {
  params: Promise<{ id: string }>;
}

/** `?limite=20&cursor=<id>`: las materias del semestre, de la más antigua a la más reciente. */
export const GET = manejar<Contexto>(async (peticion, { params }) => {
  const { usuario, repositorio } = await contextoAutenticado(peticion);
  const id = leer(idSchema, (await params).id, 'id');
  const consulta = leer(
    listaQuerySchema,
    Object.fromEntries(new URL(peticion.url).searchParams),
    'consulta',
  );
  return json(await listarMaterias(repositorio, usuario.uid, id, consulta.limite, consulta.cursor));
});

export const POST = manejar<Contexto>(
  async (peticion, { params }) => {
    const { usuario, repositorio } = await contextoAutenticado(peticion);
    const id = leer(idSchema, (await params).id, 'id');
    const datos = await leerCuerpo(peticion, materiaCreacionSchema);
    return creado(await crearMateria(repositorio, usuario.uid, id, datos));
  },
  { limite: LIMITE_ESCRITURA },
);
