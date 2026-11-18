import { expect, test } from '@playwright/test';

// La API no depende del ancho de pantalla: se prueba una sola vez.
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'escritorio-1024', 'solo se corre en un proyecto');
});

test.describe('API REST (contra la compilación de producción)', () => {
  test('GET /api/semestres/ejemplo: 200, JSON, caché pública y cabeceras de seguridad', async ({
    request,
  }) => {
    const r = await request.get('/api/semestres/ejemplo');
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toContain('application/json');
    expect(r.headers()['cache-control']).toContain('s-maxage');
    expect(r.headers()['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.headers()['x-content-type-options']).toBe('nosniff');
    expect(r.headers()['x-powered-by']).toBeUndefined();
    const cuerpo = await r.json();
    expect(cuerpo.materias).toHaveLength(4);
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

  test('404 para un semestre que no existe, sin caché', async ({ request }) => {
    const r = await request.get('/api/semestres/otro');
    expect(r.status()).toBe(404);
    expect(await r.json()).toEqual({ error: 'Semestre no encontrado.' });
    expect(r.headers()['cache-control']).toBe('no-store');
  });

  test('un identificador con caracteres raros se rechaza con 400', async ({ request }) => {
    const r = await request.get('/api/semestres/..%2F..%2Fetc');
    expect([400, 404]).toContain(r.status());
  });

  test('una ruta de API que no existe responde 404', async ({ request }) => {
    expect((await request.get('/api/no-existe')).status()).toBe(404);
  });
});
