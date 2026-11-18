import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';

const ETIQUETAS_AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

/** El semestre de ejemplo de la cuenta de demostración: solo se lee, así que es estable. */
export const RESUMEN = '/?semestre=ejemplo';
export const SIMULADOR = '/simulador?semestre=ejemplo';
export const MATERIA = '/materias/calculo-diferencial?semestre=ejemplo';

export const RUTAS = [
  RESUMEN,
  SIMULADOR,
  MATERIA,
  '/historial',
  '/login',
  '/esta-ruta-no-existe',
] as const;

/** Axe en el navegador real: incluye contraste, landmarks y reglas de página completa. */
export async function sinViolacionesDeAxe(page: Page): Promise<void> {
  const resultado = await new AxeBuilder({ page }).withTags(ETIQUETAS_AXE).analyze();
  const texto = resultado.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
  );
  expect(texto).toEqual([]);
}

export async function sinDesbordeHorizontal(page: Page): Promise<void> {
  const exceso = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(exceso, 'píxeles de scroll horizontal').toBeLessThanOrEqual(0);
}

/** Espera a que la ruta haya terminado de cargar sus datos (no mide el esqueleto de carga). */
export async function esperarDatos(page: Page, ruta: string): Promise<void> {
  const { pathname } = new URL(ruta, 'http://localhost');
  if (pathname === '/') {
    await expect(page.getByRole('region', { name: /Resumen de/ })).toBeVisible();
  } else if (pathname === '/simulador') {
    await expect(page.getByLabel('Materia')).toBeVisible();
  } else if (pathname.startsWith('/materias/')) {
    await expect(page.getByRole('region', { name: 'Resultado' })).toBeVisible();
  } else if (pathname === '/historial') {
    await expect(page.getByRole('heading', { name: 'Promedio por semestre' })).toBeVisible();
  } else {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
}

export async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarDatos(page, ruta);
}

/** El botón del menú colapsable: solo se ve en pantallas estrechas (menos de 768 px). */
export const botonDelMenu = (page: Page) => page.getByRole('button', { name: 'Menú' });

/** En pantallas estrechas la navegación está en un menú colapsable: se abre antes de usarla. */
export async function abrirMenu(page: Page): Promise<void> {
  const boton = botonDelMenu(page);
  if ((await boton.isVisible()) && (await boton.getAttribute('aria-expanded')) !== 'true') {
    await boton.click();
  }
}

/** Va a una pantalla con la navegación principal, abriendo el menú si hace falta. */
export async function irA(
  page: Page,
  nombre: 'Resumen' | 'Simulador' | 'Historial',
): Promise<void> {
  await abrirMenu(page);
  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: nombre })
    .click();
}

export const notaDe = (page: Page, n: number) =>
  page.getByRole('group', { name: `Nota ${n}` }).getByLabel('Nota (0,0 a 5,0)');

export const porcentajeDe = (page: Page, n: number) =>
  page.getByRole('group', { name: `Nota ${n}` }).getByLabel('Porcentaje (%)');

const URL_LISTA = /\/api\/semestres\?limite=100/;

/** Simula una caída de la API: la lista responde 500 hasta que se llame a `restaurar`. */
export async function romperApi(page: Page): Promise<() => Promise<void>> {
  await page.route(URL_LISTA, (r) => r.fulfill({ status: 500, json: { error: 'Error interno.' } }));
  return () => page.unroute(URL_LISTA);
}

/** Simula una cuenta sin semestres (la de demostración es una sola y la comparten las pruebas). */
export async function cuentaVacia(page: Page): Promise<void> {
  await page.route(URL_LISTA, (r) =>
    r.fulfill({ status: 200, json: { items: [], siguienteCursor: null } }),
  );
}

/**
 * El mensaje de error de la interfaz. Next agrega su propio `role="alert"` (el anunciador de
 * rutas), así que `getByRole('alert')` a secas encuentra dos elementos.
 */
export const alertaDeError = (page: Page) =>
  page.getByRole('alert').filter({ hasText: 'No pudimos cargar tus datos' });

export interface Aislado {
  /** Id del semestre propio de la prueba (la cuenta de demostración la comparten todas). */
  id: string;
  nombre: string;
  materiaId: string;
  resumen: string;
  materia: string;
}

/**
 * Semestre propio para las pruebas que modifican datos: las tres anchuras corren a la vez contra
 * el mismo servidor, así que nadie toca `ejemplo`. Se crea con la API real y se borra al terminar.
 */
export const test = base.extend<{ aislado: Aislado }>({
  aislado: async ({ request, baseURL }, usar) => {
    const cabeceras = { origin: baseURL ?? '' };
    const nombre = `E2E ${Math.random().toString(36).slice(2, 8)}`;
    const semestre = await (
      await request.post('/api/semestres', { headers: cabeceras, data: { nombre, meta: 3 } })
    ).json();
    const materia = await (
      await request.post(`/api/semestres/${semestre.id}/materias`, {
        headers: cabeceras,
        data: {
          nombre: 'Cálculo diferencial',
          creditos: 4,
          notas: [
            { nombre: 'Primer corte', valor: 3.5, porcentaje: 30 },
            { nombre: 'Segundo corte', valor: 2.8, porcentaje: 30 },
            { nombre: 'Tercer corte', valor: null, porcentaje: 40 },
          ],
        },
      })
    ).json();
    await usar({
      id: semestre.id,
      nombre,
      materiaId: materia.id,
      resumen: `/?semestre=${semestre.id}`,
      materia: `/materias/${materia.id}?semestre=${semestre.id}`,
    });
    await request.delete(`/api/semestres/${semestre.id}`, { headers: cabeceras });
  },
});
