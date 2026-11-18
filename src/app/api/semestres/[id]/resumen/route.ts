import { json, leer, manejar } from '@/lib/http';
import { obtenerRepositorio } from '@/repositories';
import { idSchema, metaSchema } from '@/schemas/semestre';
import { obtenerResumen } from '@/services/semestres';

export const runtime = 'nodejs';

interface Contexto {
  params: Promise<{ id: string }>;
}

/** `?meta=4` calcula lo que pide cada materia para esa meta (de 3,0 a 5,0). */
export const GET = manejar<Contexto>(
  async (peticion, { params }) => {
    const id = leer(idSchema, (await params).id, 'id');
    const crudo = new URL(peticion.url).searchParams.get('meta');
    const meta = crudo === null ? undefined : leer(metaSchema, Number(crudo), 'meta');
    return json(await obtenerResumen(obtenerRepositorio(), id, meta));
  },
  { publica: true },
);
