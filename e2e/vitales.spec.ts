import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { RESUMEN, abrir, irA, notaDe, porcentajeDe } from './ayudas';

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

  await abrir(page, RESUMEN);
  await page.getByRole('link', { name: 'Ver y editar notas de Cálculo diferencial' }).click();
  await expect(page.getByRole('region', { name: 'Resultado' })).toBeVisible();
  await notaDe(page, 3).click();
  await page.keyboard.type('4.5', { delay: 50 });
  await porcentajeDe(page, 1).click();
  await page.keyboard.type('5', { delay: 50 });
  await page.getByRole('button', { name: 'Agregar nota' }).click();
  await page.getByRole('button', { name: 'Quitar la nota 4' }).click();
  await irA(page, 'Simulador');
  await page.getByLabel('Meta (3,0 a 5,0)').click();
  await page.keyboard.type('4', { delay: 50 });
  await page.getByLabel('Materia').selectOption({ label: 'Álgebra lineal' });
  await page.waitForTimeout(500);

  const crudo: unknown = JSON.parse(
    await page.evaluate(() => JSON.stringify(Reflect.get(window, '__vitales'))),
  );
  expect(esVitales(crudo)).toBe(true);
  if (!esVitales(crudo)) return;
  const ordenadas = [...crudo.interacciones].sort((a, b) => b - a);
  const resultado = {
    proyecto: info.project.name,
    condiciones: 'next start local, Chromium, CPU 4× más lenta (CDP), sin estrangulamiento de red',
    LCP_ms: Math.round(crudo.lcp),
    CLS: Number(crudo.cls.toFixed(3)),
    INP_ms: Math.round(ordenadas[0] ?? 0),
    interacciones_medidas: ordenadas.length,
    peores_interacciones_ms: ordenadas.slice(0, 5).map(Math.round),
    nota: 'Con menos de 50 interacciones, el INP es la peor de todas. Flujo: resumen → editar notas → simulador.',
  };
  writeFileSync('calidad/vitales.json', JSON.stringify(resultado, null, 2) + '\n');
  expect(resultado.INP_ms).toBeLessThanOrEqual(200);
  expect(resultado.CLS).toBeLessThanOrEqual(0.1);
  expect(resultado.LCP_ms).toBeLessThanOrEqual(2500);
});
