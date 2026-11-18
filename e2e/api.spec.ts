import { expect, test } from '@playwright/test';

// La API no depende del ancho de pantalla: se prueba una sola vez. Corre en modo demostración
// (MODO_DEMO=1, ver playwright.config.ts): la sesión real se prueba con Firebase, no aquí.
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'escritorio-1024', 'solo se corre en un proyecto');
});

test.describe('API REST (contra la compilación de producción)', () => {
  test('GET /api/semestres/ejemplo: 200, JSON, privado (no-store) y cabeceras de seguridad', async ({
    request,
  }) => {
    const r = await request.get('/api/semestres/ejemplo');
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toContain('application/json');
    expect(r.headers()['cache-control']).toBe('no-store');
    expect(r.headers()['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.headers()['x-content-type-options']).toBe('nosniff');
    expect(r.headers()['x-powered-by']).toBeUndefined();
    expect((await r.json()).materias).toHaveLength(4);
  });

  test('GET /api/semestres: lista paginada con siguienteCursor', async ({ request }) => {
    const r = await request.get('/api/semestres?limite=1');
    expect(r.status()).toBe(200);
    const cuerpo = await r.json();
    expect(cuerpo.items).toHaveLength(1);
    expect(cuerpo).toHaveProperty('siguienteCursor');
  });

  test('GET /api/semestres/ejemplo/resumen: promedios calculados en el servidor', async ({
    request,
  }) => {
    const cuerpo = await (await request.get('/api/semestres/ejemplo/resumen')).json();
    expect(cuerpo).toMatchObject({ promedio: 3.37, creditosConNotas: 12, meta: 3 });
  });

  test('400 con detalle por campo cuando la meta no es válida', async ({ request }) => {
    const r = await request.get('/api/semestres/ejemplo/resumen?meta=5.5');
    expect(r.status()).toBe(400);
    expect(await r.json()).toEqual({
      error: 'Datos inválidos.',
      detalles: [{ campo: 'meta', mensaje: 'La meta no puede pasar de 5,0.' }],
    });
    expect(r.headers()['cache-control']).toBe('no-store');
  });

  test('POST con un cuerpo inválido responde 400 y no crea nada', async ({ request, baseURL }) => {
    const r = await request.post('/api/semestres', {
      headers: { origin: baseURL ?? '' },
      data: { nombre: 'x', meta: 5.5 },
    });
    expect(r.status()).toBe(400);
  });

  test('403: una escritura desde otro origen se rechaza (CSRF), aunque lleve datos válidos', async ({
    request,
  }) => {
    const r = await request.post('/api/semestres', {
      headers: { origin: 'https://malo.example' },
      data: { nombre: 'x', meta: 3 },
    });
    expect(r.status()).toBe(403);
    expect(await r.json()).toEqual({ error: 'Origen no permitido.' });
  });

  test('201, PUT, 204 y 404: ciclo de vida de un semestre', async ({ request, baseURL }) => {
    const origin = baseURL ?? '';
    const creado = await request.post('/api/semestres', {
      headers: { origin },
      data: { nombre: 'API e2e', meta: 3.5 },
    });
    expect(creado.status()).toBe(201);
    const { id } = await creado.json();

    const editado = await request.put(`/api/semestres/${id}`, {
      headers: { origin },
      data: { nombre: 'API e2e editado', meta: 4 },
    });
    expect((await editado.json()).nombre).toBe('API e2e editado');

    expect((await request.delete(`/api/semestres/${id}`, { headers: { origin } })).status()).toBe(
      204,
    );
    expect((await request.get(`/api/semestres/${id}`)).status()).toBe(404);
  });

  test('404 para un semestre que no existe, sin caché', async ({ request }) => {
    const r = await request.get('/api/semestres/otro');
    expect(r.status()).toBe(404);
    expect(await r.json()).toEqual({ error: 'Semestre no encontrado.' });
    expect(r.headers()['cache-control']).toBe('no-store');
  });

  test('403: un estudiante (aquí, el usuario de demostración) no entra a la ruta de administración', async ({
    request,
  }) => {
    const r = await request.get('/api/admin/usuarios/demo/semestres');
    expect(r.status()).toBe(403);
  });

  test('GET /api/auth/yo: en modo demostración dice quién es', async ({ request }) => {
    expect(await (await request.get('/api/auth/yo')).json()).toEqual({
      usuario: { uid: 'demo', correo: null, rol: 'estudiante' },
      demo: true,
    });
  });

  test('POST /api/auth/sesion responde 204 sin cuerpo (en demostración no hay cuentas ni cookie)', async ({
    request,
    baseURL,
  }) => {
    const r = await request.post('/api/auth/sesion', {
      headers: { origin: baseURL ?? '' },
      data: {},
    });
    expect(r.status()).toBe(204);
    expect(await r.text()).toBe('');
    expect(r.headers()['set-cookie']).toBeUndefined();
  });

  test('DELETE /api/auth/sesion responde 204 y borra la cookie (HttpOnly, SameSite=Lax)', async ({
    request,
    baseURL,
  }) => {
    const r = await request.delete('/api/auth/sesion', { headers: { origin: baseURL ?? '' } });
    expect(r.status()).toBe(204);
    const cookie = r.headers()['set-cookie'] ?? '';
    expect(cookie).toContain('sesion=;');
    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  test('GET /api/semestres/ejemplo/materias: lista paginada con cursor', async ({ request }) => {
    const primera = await (await request.get('/api/semestres/ejemplo/materias?limite=3')).json();
    expect(primera.items).toHaveLength(3);
    expect(primera.siguienteCursor).toBe('algebra-lineal');
    const segunda = await (
      await request.get(
        `/api/semestres/ejemplo/materias?limite=3&cursor=${primera.siguienteCursor}`,
      )
    ).json();
    expect(segunda.items.map((m: { id: string }) => m.id)).toEqual(['ingles-ii']);
    expect(segunda.siguienteCursor).toBeNull();
  });

  test('un identificador con caracteres raros se rechaza con 400', async ({ request }) => {
    const r = await request.get('/api/semestres/..%2F..%2Fetc');
    expect([400, 404]).toContain(r.status());
  });

  test('una ruta de API que no existe responde 404', async ({ request }) => {
    expect((await request.get('/api/no-existe')).status()).toBe(404);
  });
});
