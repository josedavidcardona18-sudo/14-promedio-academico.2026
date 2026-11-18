import { afterEach, describe, expect, it, vi } from 'vitest';
import { SEMESTRE_DE_EJEMPLO } from '@/repositories/ejemplo';
import {
  abrirSesion,
  actualizarMateria,
  actualizarSemestre,
  cargarEjemplo,
  cerrarSesion,
  crearMateria,
  crearSemestre,
  eliminarMateria,
  eliminarSemestre,
  ErrorDeApi,
  listarSemestres,
  pedirUsuario,
} from './api-cliente';

const responder = (cuerpo: unknown, estado = 200) =>
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockImplementation(async () =>
        estado === 204
          ? new Response(null, { status: 204 })
          : new Response(JSON.stringify(cuerpo), { status: estado }),
      ),
  );
const llamada = () => {
  const [ruta, init] = vi.mocked(fetch).mock.calls[0] ?? [];
  return { ruta, init };
};

afterEach(() => vi.unstubAllGlobals());

describe('listarSemestres', () => {
  it('pide la lista y valida cada semestre con el esquema Zod del servidor', async () => {
    responder({ items: [SEMESTRE_DE_EJEMPLO], siguienteCursor: null });
    expect(await listarSemestres()).toEqual([SEMESTRE_DE_EJEMPLO]);
    expect(llamada().ruta).toBe('/api/semestres?limite=100');
  });

  it('una respuesta con otra forma se rechaza (el cliente también valida)', async () => {
    responder({ items: [{ id: 'x' }], siguienteCursor: null });
    await expect(listarSemestres()).rejects.toThrow('formato esperado');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no es json', { status: 200 })));
    await expect(listarSemestres()).rejects.toThrow('formato esperado');
  });

  it('sin red → mensaje de conexión', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = await listarSemestres().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorDeApi);
    expect(error).toMatchObject({
      estado: null,
      message: expect.stringContaining('No hay conexión'),
    });
  });

  it('una petición cancelada no se disfraza de error de red', async () => {
    const control = new AbortController();
    control.abort();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('abortada', 'AbortError')));
    await expect(listarSemestres(control.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('mensajes por código de estado', () => {
  const casos: [number, unknown, string][] = [
    [401, { error: 'Necesitas iniciar sesión.' }, 'Tu sesión venció. Inicia sesión de nuevo.'],
    [403, { error: 'x' }, 'No tienes permiso para hacer esto.'],
    [404, { error: 'Semestre no encontrado.' }, 'Semestre no encontrado.'],
    [404, 'basura', 'No encontramos lo que buscabas.'],
    [
      400,
      {
        error: 'Datos inválidos.',
        detalles: [{ campo: 'meta', mensaje: 'La meta no puede pasar de 5,0.' }],
      },
      'Revisa los datos: La meta no puede pasar de 5,0.',
    ],
    [400, { error: 'Datos inválidos.' }, 'Revisa los datos e inténtalo de nuevo.'],
    [409, { error: 'Llegaste al máximo de 20 semestres.' }, 'Llegaste al máximo de 20 semestres.'],
    [
      429,
      { error: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.' },
      'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
    ],
    [409, null, 'No se pudo completar la acción.'],
    [
      500,
      { error: 'Error interno.' },
      'El servidor no pudo completar la acción. Inténtalo de nuevo.',
    ],
  ];
  it.each(casos)('%i → mensaje para la persona', async (estado, cuerpo, mensaje) => {
    responder(cuerpo, estado);
    await expect(listarSemestres()).rejects.toMatchObject({ message: mensaje, estado });
  });
});

describe('operaciones de escritura', () => {
  it('crearSemestre envía POST con JSON y devuelve el semestre creado', async () => {
    responder({ ...SEMESTRE_DE_EJEMPLO, materias: [] }, 201);
    await crearSemestre({ nombre: '2027-1', meta: 3.5 });
    expect(llamada().ruta).toBe('/api/semestres');
    expect(llamada().init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"nombre":"2027-1","meta":3.5}',
    });
  });

  it('actualizarSemestre y eliminarSemestre usan PUT y DELETE sobre la ruta codificada', async () => {
    responder(SEMESTRE_DE_EJEMPLO);
    await actualizarSemestre('a/b', { nombre: 'x', meta: 3 });
    expect(llamada().ruta).toBe('/api/semestres/a%2Fb');
    expect(llamada().init).toMatchObject({ method: 'PUT' });
    responder(null, 204);
    await expect(eliminarSemestre('ejemplo')).resolves.toBeUndefined();
    expect(llamada().init).toMatchObject({ method: 'DELETE' });
  });

  it('las materias se crean, reemplazan (sin enviar el id en el cuerpo) y eliminan', async () => {
    const materia = SEMESTRE_DE_EJEMPLO.materias[0];
    if (!materia) throw new Error('falta la materia de ejemplo');
    responder(materia, 201);
    await crearMateria('ejemplo', { nombre: 'Física', creditos: 3 });
    expect(llamada().ruta).toBe('/api/semestres/ejemplo/materias');

    responder(materia);
    await actualizarMateria('ejemplo', materia);
    expect(llamada().ruta).toBe(`/api/semestres/ejemplo/materias/${materia.id}`);
    expect(JSON.parse(String(llamada().init?.body))).not.toHaveProperty('id');

    responder(null, 204);
    await eliminarMateria('ejemplo', materia.id);
    expect(llamada().init).toMatchObject({ method: 'DELETE' });
  });

  it('cargarEjemplo hace POST /api/ejemplo', async () => {
    responder(SEMESTRE_DE_EJEMPLO, 201);
    expect(await cargarEjemplo()).toEqual(SEMESTRE_DE_EJEMPLO);
    expect(llamada().ruta).toBe('/api/ejemplo');
  });
});

describe('sesión', () => {
  it('pedirUsuario lee { usuario } y valida la forma de la respuesta', async () => {
    responder({
      usuario: { uid: 'ana', correo: 'ana@correo.co', rol: 'estudiante' },
      demo: false,
    });
    expect(await pedirUsuario()).toEqual({
      uid: 'ana',
      correo: 'ana@correo.co',
      rol: 'estudiante',
      demo: false,
    });
    responder({ uid: 'ana', correo: null, rol: 'estudiante', demo: false });
    await expect(pedirUsuario()).rejects.toThrow('formato esperado');
    responder({ usuario: { uid: 'ana', correo: null, rol: 'jefe' }, demo: false });
    await expect(pedirUsuario()).rejects.toThrow('formato esperado');
  });

  it('abrirSesion envía el token y espera 204; cerrarSesion usa DELETE', async () => {
    responder(null, 204);
    await abrirSesion('token');
    expect(llamada().init).toMatchObject({ method: 'POST', body: '{"idToken":"token"}' });
    responder(null, 204);
    await cerrarSesion();
    expect(llamada().init).toMatchObject({ method: 'DELETE' });
  });

  it('abrirSesion muestra el motivo si el servidor la rechaza', async () => {
    responder({ error: 'Tu inicio de sesión es muy antiguo. Vuelve a ingresar.' }, 401);
    await expect(abrirSesion('t')).rejects.toMatchObject({
      estado: 401,
      message: 'Tu inicio de sesión es muy antiguo. Vuelve a ingresar.',
    });
  });
});
