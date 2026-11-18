import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

const ETIQUETAS_AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

export const RUTAS = [
  '/',
  '/simulador',
  '/materias/calculo-diferencial',
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
  if (ruta === '/') {
    await expect(page.getByRole('region', { name: /Resumen de/ })).toBeVisible();
  } else if (ruta === '/simulador') {
    await expect(page.getByLabel('Materia')).toBeVisible();
  } else if (ruta.startsWith('/materias/')) {
    await expect(page.getByRole('region', { name: 'Resultado' })).toBeVisible();
  } else {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
}

export async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarDatos(page, ruta);
}

export const notaDe = (page: Page, n: number) =>
  page.getByRole('group', { name: `Nota ${n}` }).getByLabel('Nota (0,0 a 5,0)');

export const porcentajeDe = (page: Page, n: number) =>
  page.getByRole('group', { name: `Nota ${n}` }).getByLabel('Porcentaje (%)');

/** Edita la nota 3 de Cálculo (queda como borrador en localStorage). */
export async function crearBorrador(page: Page): Promise<void> {
  await abrir(page, '/materias/calculo-diferencial');
  await notaDe(page, 3).fill('5');
  await expect(page.getByText('Cambios guardados como borrador')).toBeVisible();
}

/** Simula una caída de la API: la respuesta es un 500 hasta que se llame a `restaurar`. */
export async function romperApi(page: Page): Promise<() => Promise<void>> {
  const patron = '**/api/semestres/ejemplo';
  await page.route(patron, (r) => r.fulfill({ status: 500, json: { error: 'Error interno.' } }));
  return () => page.unroute(patron);
}

/**
 * El mensaje de error de la interfaz. Next agrega su propio `role="alert"` (el anunciador de
 * rutas), así que `getByRole('alert')` a secas encuentra dos elementos.
 */
export const alertaDeError = (page: Page) =>
  page.getByRole('alert').filter({ hasText: 'No pudimos cargar tus datos' });
