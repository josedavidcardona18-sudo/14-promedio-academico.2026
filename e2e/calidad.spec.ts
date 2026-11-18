import { expect, test } from '@playwright/test';
import {
  RUTAS,
  abrir,
  alertaDeError,
  crearBorrador,
  notaDe,
  romperApi,
  sinDesbordeHorizontal,
  sinViolacionesDeAxe,
} from './ayudas';

const TEMAS = [
  { nombre: 'claro', medios: { colorScheme: 'light' } },
  { nombre: 'oscuro', medios: { colorScheme: 'dark' } },
  { nombre: 'claro con alto contraste', medios: { colorScheme: 'light', contrast: 'more' } },
  { nombre: 'oscuro con alto contraste', medios: { colorScheme: 'dark', contrast: 'more' } },
] as const;

for (const tema of TEMAS) {
  test.describe(`accesibilidad (axe) · tema ${tema.nombre}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia(tema.medios);
    });

    for (const ruta of RUTAS) {
      test(`${ruta}: 0 violaciones`, async ({ page }) => {
        await abrir(page, ruta);
        await sinViolacionesDeAxe(page);
      });
    }

    test('/ con la API caída (error con reintento): 0 violaciones', async ({ page }) => {
      await romperApi(page);
      await page.goto('/');
      await expect(alertaDeError(page)).toContainText('No pudimos cargar tus datos');
      await sinViolacionesDeAxe(page);
    });

    test('/ sin materias (vacío): 0 violaciones', async ({ page }) => {
      await page.addInitScript(() =>
        window.localStorage.setItem(
          'promedio-academico:borrador:ejemplo',
          JSON.stringify({ version: 1, materias: [] }),
        ),
      );
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Aún no hay materias' })).toBeVisible();
      await sinViolacionesDeAxe(page);
    });

    test('materia con errores de validación visibles: 0 violaciones', async ({ page }) => {
      await abrir(page, '/materias/calculo-diferencial');
      await notaDe(page, 3).fill('5.5');
      await expect(page.getByText('La nota no puede pasar de 5,0.')).toBeVisible();
      await sinViolacionesDeAxe(page);
    });

    test('/ con el diálogo de confirmación abierto: 0 violaciones', async ({ page }) => {
      await crearBorrador(page);
      await abrir(page, '/');
      await page.getByRole('button', { name: 'Restablecer datos de ejemplo' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await sinViolacionesDeAxe(page);
    });
  });
}

test.describe('responsive', () => {
  for (const ruta of RUTAS) {
    test(`${ruta}: sin scroll horizontal`, async ({ page }) => {
      await abrir(page, ruta);
      await sinDesbordeHorizontal(page);
    });
  }

  test('reflow a 320 px (WCAG 1.4.10): sin scroll horizontal en las rutas con datos', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const ruta of ['/', '/simulador', '/materias/calculo-diferencial']) {
      await abrir(page, ruta);
      await sinDesbordeHorizontal(page);
    }
  });

  test('zoom al 200 % (640 px equivalen a 1280 px al 200 %): sin pérdida de contenido', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 512 });
    await abrir(page, '/');
    await sinDesbordeHorizontal(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('objetivos táctiles de al menos 44 × 44 px', async ({ page }) => {
    for (const ruta of ['/', '/simulador', '/materias/calculo-diferencial']) {
      await abrir(page, ruta);
      const pequenos = await page.evaluate(() => {
        const elementos = document.querySelectorAll(
          'button, input, select, summary, header a, main a',
        );
        return Array.from(elementos)
          .map((el) => ({ el, caja: el.getBoundingClientRect() }))
          .filter(({ caja }) => caja.width > 0 && caja.height > 0)
          .filter(({ caja }) => caja.width < 43.5 || caja.height < 43.5)
          .map(
            ({ el, caja }) =>
              `${el.tagName} «${el.textContent?.trim()}» ${Math.round(caja.width)}×${Math.round(caja.height)}`,
          );
      });
      expect(pequenos, ruta).toEqual([]);
    }
  });

  test('todo el texto visible mide al menos 16 px', async ({ page }) => {
    for (const ruta of ['/', '/simulador', '/materias/calculo-diferencial']) {
      await abrir(page, ruta);
      const chicos = await page.evaluate(() => {
        const textos = Array.from(document.body.querySelectorAll('*')).filter((el) =>
          Array.from(el.childNodes).some(
            (n) => n.nodeType === 3 && (n.textContent ?? '').trim() !== '',
          ),
        );
        return textos
          .filter((el) => el.getBoundingClientRect().width > 2)
          .map((el) => ({
            texto: (el.textContent ?? '').trim().slice(0, 40),
            px: parseFloat(getComputedStyle(el).fontSize),
          }))
          .filter(({ px }) => px < 16)
          .map(({ texto, px }) => `${px}px «${texto}»`);
      });
      expect(chicos, ruta).toEqual([]);
    }
  });
});

test.describe('teclado y foco', () => {
  test('el primer Tab llega a «Saltar al contenido» y Enter lleva el foco al contenido', async ({
    page,
  }) => {
    await abrir(page, '/');
    await page.keyboard.press('Tab');
    const saltar = page.getByRole('link', { name: 'Saltar al contenido' });
    await expect(saltar).toBeFocused();
    await expect(saltar).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#contenido')).toBeFocused();
  });

  test('todo control enfocado con el teclado muestra un contorno visible', async ({ page }) => {
    await abrir(page, '/materias/calculo-diferencial');
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const contorno = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const estilo = getComputedStyle(el);
        return {
          estilo: estilo.outlineStyle,
          ancho: parseFloat(estilo.outlineWidth),
          tag: el.tagName,
        };
      });
      if (contorno) {
        expect(contorno.estilo, `contorno de ${contorno.tag}`).not.toBe('none');
        expect(contorno.ancho).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test('el foco no queda tapado por una cabecera fija', async ({ page }) => {
    await abrir(page, '/');
    const imprimir = page.getByRole('button', { name: 'Imprimir resumen' });
    await imprimir.focus();
    await expect(imprimir).toBeInViewport({ ratio: 1 });
  });
});

test.describe('impresión y sin errores', () => {
  test('al imprimir se oculta lo que no es resultado y se conservan las materias', async ({
    page,
  }) => {
    await abrir(page, '/');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('header').first()).toBeHidden();
    await expect(page.getByRole('button', { name: 'Imprimir resumen' })).toBeHidden();
    await expect(page.getByRole('article', { name: 'Cálculo diferencial' })).toBeVisible();
  });

  for (const ruta of RUTAS) {
    test(`${ruta}: sin errores ni avisos en la consola (incluye violaciones del CSP)`, async ({
      page,
    }) => {
      const problemas: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error' || m.type() === 'warning')
          problemas.push(`${m.type()}: ${m.text()}`);
      });
      page.on('pageerror', (e) => problemas.push(`pageerror: ${e.message}`));
      await abrir(page, ruta);
      await page.waitForLoadState('networkidle');
      // La ruta inexistente responde 404 a propósito: el navegador lo anota como recurso no cargado.
      expect(problemas.filter((p) => !p.includes('Failed to load resource'))).toEqual([]);
    });
  }
});

test.describe('problemas que Chrome registra aparte de la consola', () => {
  for (const ruta of RUTAS) {
    test(`${ruta}: ningún problema de CSP en el panel de problemas (p. ej. eval bloqueado)`, async ({
      page,
      context,
    }) => {
      const cdp = await context.newCDPSession(page);
      const problemas: string[] = [];
      cdp.on('Audits.issueAdded', ({ issue }) => {
        const csp = issue.details.contentSecurityPolicyIssueDetails;
        problemas.push(`${issue.code}: ${csp?.contentSecurityPolicyViolationType ?? 'otro'}`);
      });
      await cdp.send('Audits.enable');
      await abrir(page, ruta);
      await page.waitForTimeout(1500);
      expect(problemas).toEqual([]);
    });
  }
});
