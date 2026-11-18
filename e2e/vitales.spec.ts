import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { abrirConEjemplo } from './ayudas';

// Mide LCP, CLS e INP reales en el navegador (Lighthouse no mide INP en laboratorio):
//   VITALES=1 npx playwright test e2e/vitales.spec.ts --project=movil-360
// Escribe calidad/vitales.json. Con la CPU 4 veces más lenta, como un teléfono modesto.
test.skip(!process.env.VITALES, 'solo con VITALES=1');

interface Vitales {
  lcp: number;
  cls: number;
  interacciones: number[];
}

function esVitales(valor: unknown): valor is Vitales {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'lcp' in valor &&
    'cls' in valor &&
    'interacciones' in valor &&
    Array.isArray(valor.interacciones)
  );
}

test('LCP, CLS e INP con la CPU 4× más lenta', async ({ page, context }, info) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    const v: Vitales = { lcp: 0, cls: 0, interacciones: [] };
    Reflect.set(window, '__vitales', v);
    const observar = (tipo: string, extra: object, alEntrar: (e: PerformanceEntry) => void) =>
      new PerformanceObserver((lista) => lista.getEntries().forEach(alEntrar)).observe({
        type: tipo,
        buffered: true,
        ...extra,
      });
    observar('largest-contentful-paint', {}, (e) => (v.lcp = e.startTime));
    observar('layout-shift', {}, (e) => {
      if (!Reflect.get(e, 'hadRecentInput')) v.cls += Number(Reflect.get(e, 'value'));
    });
    observar('event', { durationThreshold: 16 }, (e) => {
      if (Reflect.get(e, 'interactionId')) v.interacciones.push(e.duration);
    });
  });

  await abrirConEjemplo(page);
  const nota = page
    .getByRole('article', { name: 'Cálculo diferencial' })
    .getByRole('group', { name: 'Corte 3' })
    .getByLabel(/^Nota/);
  await nota.click();
  await page.keyboard.type('4,5', { delay: 50 });
  await page
    .getByRole('article', { name: 'Cálculo diferencial' })
    .getByRole('button', { name: 'Agregar corte' })
    .click();
  await page.getByLabel('Nota máxima').click();
  await page.keyboard.type('10', { delay: 50 });
  await page.getByRole('button', { name: 'Eliminar Inglés II' }).click();
  await page.keyboard.press('Escape');
  await page.getByLabel('Nombre de la materia').click();
  await page.keyboard.type('Química', { delay: 50 });
  await page.getByRole('button', { name: 'Agregar materia' }).click();
  await page.waitForTimeout(500);

  const crudo: unknown = JSON.parse(
    await page.evaluate(() => JSON.stringify(Reflect.get(window, '__vitales'))),
  );
  expect(esVitales(crudo)).toBe(true);
  if (!esVitales(crudo)) return;
  const ordenadas = [...crudo.interacciones].sort((a, b) => b - a);
  const inp = ordenadas[0] ?? 0;
  const resultado = {
    proyecto: info.project.name,
    condiciones: 'next start local, Chromium, CPU 4× más lenta (CDP), sin estrangulamiento de red',
    LCP_ms: Math.round(crudo.lcp),
    CLS: Number(crudo.cls.toFixed(3)),
    INP_ms: Math.round(inp),
    interacciones_medidas: ordenadas.length,
    peores_interacciones_ms: ordenadas.slice(0, 5).map(Math.round),
    nota: 'Con menos de 50 interacciones, el INP es la peor de todas.',
  };
  writeFileSync('calidad/vitales.json', JSON.stringify(resultado, null, 2) + '\n');
  expect(resultado.INP_ms).toBeLessThanOrEqual(200);
  expect(resultado.CLS).toBeLessThanOrEqual(0.1);
  expect(resultado.LCP_ms).toBeLessThanOrEqual(2500);
});
