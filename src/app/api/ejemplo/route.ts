import { LIMITE_ESCRITURA } from '@/lib/constantes';
import { creado, manejar } from '@/lib/http';
import { cargarEjemplo } from '@/services/semestres';
import { contextoAutenticado } from '../contexto';

export const runtime = 'nodejs';

/** Estado vacío → «Cargar datos de ejemplo»: copia el semestre de ejemplo a la cuenta de quien pide. */
export const POST = manejar(
  async (peticion) => {
    const { usuario, repositorio } = await contextoAutenticado(peticion);
    return creado(await cargarEjemplo(repositorio, usuario.uid));
  },
  { limite: LIMITE_ESCRITURA },
);
