import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

const ETIQUETAS_AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

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

export async function abrirConEjemplo(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Cargar datos de ejemplo' }).click();
  await expect(page.getByRole('article', { name: 'Inglés II' })).toBeVisible();
}

export const RUTAS = ['/', '/acerca', '/esta-ruta-no-existe'] as const;
