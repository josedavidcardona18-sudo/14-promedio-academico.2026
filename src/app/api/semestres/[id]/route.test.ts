// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearRepositorioDeEjemplo } from '@/repositories/semestres';
import { obtenerRepositorio } from '@/repositories';
import { semestreConMateriasSchema } from '@/schemas/semestre';
import { GET } from './route';

vi.mock('@/repositories', () => ({ obtenerRepositorio: vi.fn() }));

const pedir = (id: string) =>
  GET(new Request(`http://localhost/api/semestres/${id}`), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.mocked(obtenerRepositorio).mockReturnValue(crearRepositorioDeEjemplo());
});

describe('GET /api/semestres/:id', () => {
  it('200: devuelve el semestre de ejemplo y cumple el contrato (esquema Zod)', async () => {
    const r = await pedir('ejemplo');
    expect(r.status).toBe(200);
    const semestre = semestreConMateriasSchema.parse(await r.json());
    expect(semestre.materias).toHaveLength(4);
    expect(r.headers.get('cache-control')).toContain('s-maxage');
  });

  it('404: un semestre que no existe', async () => {
    const r = await pedir('no-existe');
    expect(r.status).toBe(404);
    expect(await r.json()).toEqual({ error: 'Semestre no encontrado.' });
  });

  it('400: un identificador con caracteres no permitidos', async () => {
    const r = await pedir('..%2Fetc');
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({
      error: 'Datos inválidos.',
      detalles: [{ campo: 'id', mensaje: 'Identificador inválido.' }],
    });
  });

  it('500 sin detalles internos si el repositorio falla', async () => {
    vi.mocked(obtenerRepositorio).mockReturnValue({
      obtener: () => Promise.reject(new Error('Firestore: PERMISSION_DENIED en proyecto-secreto')),
    });
    const r = await pedir('ejemplo');
    expect(r.status).toBe(500);
    expect(await r.text()).not.toContain('proyecto-secreto');
  });
});
