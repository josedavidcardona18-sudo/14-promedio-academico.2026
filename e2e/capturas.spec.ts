import { test } from '@playwright/test';
import { abrir, alertaDeError, notaDe, romperApi } from './ayudas';

// Genera las capturas de evidencia (calidad/capturas). No corre en la suite normal:
//   CAPTURAS=1 npx playwright test e2e/capturas.spec.ts
test.skip(!process.env.CAPTURAS, 'solo con CAPTURAS=1');
test.use({ deviceScaleFactor: 2 });

test('capturas de las pantallas, sus estados y el tema oscuro', async ({ page }, info) => {
  const ancho = info.project.use.viewport?.width ?? 0;
  const carpeta = 'calidad/capturas';

  await abrir(page, '/');
  await page.screenshot({ path: `${carpeta}/resumen-${ancho}.png` });

  await abrir(page, '/materias/calculo-diferencial');
  await page.screenshot({ path: `${carpeta}/materia-${ancho}.png` });
  await notaDe(page, 3).fill('5.5');
  await page.screenshot({ path: `${carpeta}/materia-con-error-${ancho}.png` });
  await notaDe(page, 3).fill('');

  await abrir(page, '/simulador');
  await page.screenshot({ path: `${carpeta}/simulador-${ancho}.png` });

  const restaurar = await romperApi(page);
  await page.goto('/');
  await alertaDeError(page).waitFor();
  await page.screenshot({ path: `${carpeta}/error-con-reintento-${ancho}.png` });
  await restaurar();

  await page.emulateMedia({ colorScheme: 'dark' });
  await abrir(page, '/');
  await page.screenshot({ path: `${carpeta}/resumen-oscuro-${ancho}.png` });
});
