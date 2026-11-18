import { expect, test, type Page, type Route } from '@playwright/test';

// El SDK de Firebase corre de verdad en el navegador (con el CSP de producción), pero la red de
// Google está interceptada con respuestas falsas: así se prueba el inicio de sesión de punta a punta
// sin cuentas reales. La parte del servidor (Admin SDK) se prueba aparte, con pruebas de Vitest.
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'escritorio-1024', 'el flujo no depende del ancho');
});

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
};

const codificar = (objeto: object) => Buffer.from(JSON.stringify(objeto)).toString('base64url');

/** Un JWT con la forma de un idToken de Firebase (sin firma válida: el navegador no la comprueba). */
function idTokenFalso(): string {
  const ahora = Math.floor(Date.now() / 1000);
  const cabecera = codificar({ alg: 'RS256', typ: 'JWT', kid: 'e2e' });
  const carga = codificar({
    iss: 'https://securetoken.google.com/e2e',
    aud: 'e2e',
    auth_time: ahora,
    user_id: 'uid-e2e',
    sub: 'uid-e2e',
    iat: ahora,
    exp: ahora + 3600,
    email: 'ana@correo.co',
    email_verified: false,
    firebase: { identities: { email: ['ana@correo.co'] }, sign_in_provider: 'password' },
  });
  return `${cabecera}.${carga}.firma`;
}

interface Llamada {
  metodo: string;
  ruta: string;
  cuerpo: unknown;
}

/** Responde como lo haría Identity Toolkit; `rechazar` simula una contraseña equivocada. */
async function interceptarFirebase(page: Page, opciones: { rechazar?: string } = {}) {
  const llamadas: Llamada[] = [];
  const idToken = idTokenFalso();
  const responder = (ruta: Route, json: unknown, status = 200) =>
    ruta.fulfill({ status, json, headers: CORS });

  await page.route(/https:\/\/(identitytoolkit|securetoken)\.googleapis\.com\/.*/, async (ruta) => {
    const peticion = ruta.request();
    if (peticion.method() === 'OPTIONS') return ruta.fulfill({ status: 204, headers: CORS });
    const { pathname } = new URL(peticion.url());
    llamadas.push({ metodo: peticion.method(), ruta: pathname, cuerpo: peticion.postDataJSON() });
    if (opciones.rechazar && /accounts:(signInWithPassword|signUp)$/.test(pathname)) {
      return responder(ruta, { error: { code: 400, message: opciones.rechazar } }, 400);
    }
    if (/accounts:(signInWithPassword|signUp)$/.test(pathname)) {
      return responder(ruta, {
        kind: 'identitytoolkit#VerifyPasswordResponse',
        localId: 'uid-e2e',
        email: 'ana@correo.co',
        displayName: '',
        idToken,
        registered: true,
        refreshToken: 'refresco-falso',
        expiresIn: '3600',
      });
    }
    if (/accounts:lookup$/.test(pathname)) {
      return responder(ruta, {
        users: [
          {
            localId: 'uid-e2e',
            email: 'ana@correo.co',
            emailVerified: false,
            providerUserInfo: [
              {
                providerId: 'password',
                federatedId: 'ana@correo.co',
                email: 'ana@correo.co',
                rawId: 'ana@correo.co',
              },
            ],
            validSince: '0',
            lastLoginAt: String(Date.now()),
            createdAt: String(Date.now()),
          },
        ],
      });
    }
    return responder(ruta, { error: { code: 404, message: 'NOT_FOUND' } }, 404);
  });
  return { llamadas, idToken };
}

function vigilarConsola(page: Page): string[] {
  const problemas: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problemas.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problemas.push(`pageerror: ${e.message}`));
  return problemas;
}

async function llenar(page: Page, correo: string, clave: string) {
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña').fill(clave);
}

test.describe('inicio de sesión con el SDK de Firebase (red de Google interceptada)', () => {
  test('entra: el SDK pide el inicio de sesión, el idToken llega a /api/auth/sesion y lleva a la página pedida', async ({
    page,
  }) => {
    const problemas = vigilarConsola(page);
    const { llamadas, idToken } = await interceptarFirebase(page);
    await page.goto('/login?siguiente=%2Fhistorial');
    await expect(page.getByRole('heading', { name: 'Entrar a tu cuenta' })).toBeVisible();

    await llenar(page, 'ana@correo.co', 'secreto123');
    const envio = page.waitForRequest(
      (r) => r.url().endsWith('/api/auth/sesion') && r.method() === 'POST',
    );
    await page.getByRole('button', { name: 'Entrar' }).click();

    expect((await envio).postDataJSON()).toEqual({ idToken });
    await expect(page).toHaveURL(/\/historial$/);
    await expect(page.getByRole('heading', { name: 'Promedio por semestre' })).toBeVisible();

    const inicio = llamadas.find((l) => l.ruta.endsWith('accounts:signInWithPassword'));
    expect(inicio?.cuerpo).toMatchObject({ email: 'ana@correo.co', password: 'secreto123' });
    expect(problemas).toEqual([]);
  });

  test('crear cuenta usa el registro de Firebase y también abre la sesión', async ({ page }) => {
    const { llamadas } = await interceptarFirebase(page);
    await page.goto('/login');
    await page.getByRole('button', { name: '¿No tienes cuenta? Crear una' }).click();
    await llenar(page, 'nueva@correo.co', 'secreto123');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(llamadas.some((l) => l.ruta.endsWith('accounts:signUp'))).toBe(true);
  });

  test('una contraseña equivocada se explica sin revelar si el correo existe, y no abre sesión', async ({
    page,
  }) => {
    await interceptarFirebase(page, { rechazar: 'INVALID_LOGIN_CREDENTIALS' });
    let intentosDeSesion = 0;
    page.on('request', (r) => {
      if (r.url().endsWith('/api/auth/sesion')) intentosDeSesion += 1;
    });
    await page.goto('/login');
    await llenar(page, 'ana@correo.co', 'mala-clave');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Correo o contraseña incorrectos.' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    expect(intentosDeSesion).toBe(0);
  });

  test('el formulario valida antes de llamar a Firebase', async ({ page }) => {
    const { llamadas } = await interceptarFirebase(page);
    await page.goto('/login');
    await llenar(page, 'sin-arroba', '123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByLabel('Correo electrónico')).toHaveAccessibleDescription(
      /correo válido/,
    );
    await expect(page.getByLabel('Contraseña')).toHaveAccessibleDescription(
      /al menos 6 caracteres/,
    );
    expect(llamadas).toEqual([]);
  });

  test('la contraseña admite pegar y gestor de contraseñas (autocomplete correcto)', async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Correo electrónico')).toHaveAttribute('autocomplete', 'email');
    await expect(page.getByLabel('Contraseña')).toHaveAttribute('autocomplete', 'current-password');
    await expect(page.getByLabel('Contraseña')).toHaveAttribute('type', 'password');
  });

  test('el SDK de Firebase solo se descarga al iniciar sesión, no en las demás páginas', async ({
    page,
  }) => {
    const scripts: string[] = [];
    page.on('response', (r) => {
      if (r.request().resourceType() === 'script') scripts.push(r.url());
    });
    await page.goto('/');
    await expect(page.getByRole('region', { name: /Resumen de/ })).toBeVisible();
    const enInicio = scripts.length;
    await interceptarFirebase(page);
    await page.goto('/login');
    await llenar(page, 'ana@correo.co', 'secreto123');
    const antes = scripts.length;
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(scripts.length).toBeGreaterThan(antes);
    expect(enInicio).toBeGreaterThan(0);
  });
});
