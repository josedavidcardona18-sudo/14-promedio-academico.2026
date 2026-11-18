import { test } from '@playwright/test';
import { abrirConEjemplo } from './ayudas';

// Genera las capturas de evidencia (calidad/capturas). No corre en la suite normal:
//   CAPTURAS=1 npx playwright test e2e/capturas.spec.ts
test.skip(!process.env.CAPTURAS, 'solo con CAPTURAS=1');
test.use({ deviceScaleFactor: 2 });

test('capturas del inicio, con datos y de «Cómo se calcula»', async ({ page }, info) => {
  const ancho = info.project.use.viewport?.width ?? 0;
  const carpeta = 'calidad/capturas';

  await page.goto('/');
  await page.screenshot({ path: `${carpeta}/inicio-vacio-${ancho}.png` });

  await abrirConEjemplo(page);
  await page.screenshot({ path: `${carpeta}/inicio-con-datos-${ancho}.png` });

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: `${carpeta}/inicio-con-datos-oscuro-${ancho}.png` });
  await page.emulateMedia({ colorScheme: 'light' });

  await page.goto('/acerca');
  await page.screenshot({ path: `${carpeta}/como-se-calcula-${ancho}.png` });
});
