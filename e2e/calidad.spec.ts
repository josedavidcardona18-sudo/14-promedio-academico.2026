import { expect, test } from '@playwright/test';
import { RUTAS, abrirConEjemplo, sinDesbordeHorizontal, sinViolacionesDeAxe } from './ayudas';

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
        await page.goto(ruta);
        await sinViolacionesDeAxe(page);
      });
    }

    test('/ con materias de ejemplo: 0 violaciones', async ({ page }) => {
      await abrirConEjemplo(page);
      await sinViolacionesDeAxe(page);
    });

    test('/ con errores de validación visibles: 0 violaciones', async ({ page }) => {
      await abrirConEjemplo(page);
      await page.getByRole('group', { name: 'Corte 3' }).first().getByLabel(/^Nota/).fill('9');
      await page.getByRole('button', { name: 'Agregar materia' }).click();
      await expect(page.getByText('Escribe el nombre de la materia.')).toBeVisible();
      await sinViolacionesDeAxe(page);
    });

    test('/ con el diálogo de confirmación abierto: 0 violaciones', async ({ page }) => {
      await abrirConEjemplo(page);
      await page.getByRole('button', { name: 'Eliminar Inglés II' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await sinViolacionesDeAxe(page);
    });
  });
}

test.describe('responsive', () => {
  for (const ruta of RUTAS) {
    test(`${ruta}: sin scroll horizontal`, async ({ page }) => {
      await page.goto(ruta);
      await sinDesbordeHorizontal(page);
    });
  }

  test('/ con datos: sin scroll horizontal', async ({ page }) => {
    await abrirConEjemplo(page);
    await sinDesbordeHorizontal(page);
  });

  test('reflow a 320 px (WCAG 1.4.10): sin scroll horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await abrirConEjemplo(page);
    await sinDesbordeHorizontal(page);
  });

  test('zoom al 200 % (640 px de ancho equivalen a 1280 px al 200 %): sin pérdida de contenido', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 512 });
    await abrirConEjemplo(page);
    await sinDesbordeHorizontal(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('objetivos táctiles de al menos 44 × 44 px en botones, campos y navegación', async ({
    page,
  }) => {
    await abrirConEjemplo(page);
    const pequenos = await page.evaluate(() => {
      const elementos = document.querySelectorAll('button, input, header a, nav a');
      return Array.from(elementos)
        .map((el) => ({ el, caja: el.getBoundingClientRect() }))
        .filter(({ caja }) => caja.width > 0 && caja.height > 0)
        .filter(({ caja }) => caja.width < 44 - 0.5 || caja.height < 44 - 0.5)
        .map(
          ({ el, caja }) =>
            `${el.tagName} «${el.textContent?.trim()}» ${Math.round(caja.width)}×${Math.round(caja.height)}`,
        );
    });
    expect(pequenos).toEqual([]);
  });

  test('todo el texto visible mide al menos 16 px', async ({ page }) => {
    await abrirConEjemplo(page);
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
    expect(chicos).toEqual([]);
  });
});

test.describe('teclado y foco', () => {
  test('el primer Tab llega a «Saltar al contenido» y Enter lleva el foco al contenido', async ({
    page,
  }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const saltar = page.getByRole('link', { name: 'Saltar al contenido' });
    await expect(saltar).toBeFocused();
    await expect(saltar).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#contenido')).toBeFocused();
  });

  test('todo control enfocado con el teclado muestra un contorno visible', async ({ page }) => {
    await abrirConEjemplo(page);
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    for (let i = 0; i < 25; i++) {
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
    await abrirConEjemplo(page);
    await page.getByRole('button', { name: 'Borrar todos los datos' }).focus();
    await expect(page.getByRole('button', { name: 'Borrar todos los datos' })).toBeInViewport({
      ratio: 1,
    });
  });
});

test.describe('impresión y sin errores', () => {
  test('al imprimir se oculta lo que no es resultado y se conservan las materias', async ({
    page,
  }) => {
    await abrirConEjemplo(page);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('header').first()).toBeHidden();
    await expect(page.getByRole('button', { name: 'Imprimir' })).toBeHidden();
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
      await page.goto(ruta);
      await page.waitForLoadState('networkidle');
      expect(problemas.filter((p) => !p.includes('Failed to load resource'))).toEqual([]);
    });
  }
});
