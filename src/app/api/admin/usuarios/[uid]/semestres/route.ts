import { requerirRol } from '@/lib/auth';
import { json, leer, manejar } from '@/lib/http';
import { listaQuerySchema } from '@/schemas/semestre';
import { listarSemestres } from '@/services/semestres';
import { z } from 'zod';
import { contextoAutenticado } from '../../../../contexto';

export const runtime = 'nodejs';

interface Contexto {
  params: Promise<{ uid: string }>;
}

const uidSchema = z
  .string('Identificador inválido.')
  .regex(/^[A-Za-z0-9_-]{1,128}$/, 'Identificador inválido.');

/** Solo administración: ve los semestres de otra persona (soporte). Un estudiante recibe 403. */
export const GET = manejar<Contexto>(async (peticion, { params }) => {
  const { usuario, repositorio } = await contextoAutenticado(peticion);
  requerirRol(usuario, 'admin');
  const uid = leer(uidSchema, (await params).uid, 'uid');
  const consulta = leer(
    listaQuerySchema,
    Object.fromEntries(new URL(peticion.url).searchParams),
    'consulta',
  );
  return json(await listarSemestres(repositorio, uid, consulta.limite, consulta.cursor));
});
