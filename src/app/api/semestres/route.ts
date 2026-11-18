import { LIMITE_ESCRITURA } from '@/lib/constantes';
import { creado, json, leer, leerCuerpo, manejar } from '@/lib/http';
import { listaQuerySchema, semestreEntradaSchema } from '@/schemas/semestre';
import { crearSemestre, listarSemestres } from '@/services/semestres';
import { contextoAutenticado } from '../contexto';

export const runtime = 'nodejs';

/** `?limite=20&cursor=<id>`: los más recientes primero; `siguienteCursor` es null en la última página. */
export const GET = manejar(async (peticion) => {
  const { usuario, repositorio } = await contextoAutenticado(peticion);
  const consulta = leer(
    listaQuerySchema,
    Object.fromEntries(new URL(peticion.url).searchParams),
    'consulta',
  );
  return json(await listarSemestres(repositorio, usuario.uid, consulta.limite, consulta.cursor));
});

export const POST = manejar(
  async (peticion) => {
    const { usuario, repositorio } = await contextoAutenticado(peticion);
    const datos = await leerCuerpo(peticion, semestreEntradaSchema);
    return creado(await crearSemestre(repositorio, usuario.uid, datos));
  },
  { limite: LIMITE_ESCRITURA },
);
