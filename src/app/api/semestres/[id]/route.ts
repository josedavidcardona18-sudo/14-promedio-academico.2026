import { json, leer, manejar } from '@/lib/http';
import { obtenerRepositorio } from '@/repositories';
import { idSchema } from '@/schemas/semestre';
import { obtenerSemestre } from '@/services/semestres';

export const runtime = 'nodejs';

interface Contexto {
  params: Promise<{ id: string }>;
}

/** Datos de ejemplo públicos: se pueden cachear. Las rutas privadas (Hito 4) usarán `no-store`. */
export const GET = manejar<Contexto>(
  async (_peticion, { params }) => {
    const id = leer(idSchema, (await params).id, 'id');
    return json(await obtenerSemestre(obtenerRepositorio(), id));
  },
  { publica: true },
);
