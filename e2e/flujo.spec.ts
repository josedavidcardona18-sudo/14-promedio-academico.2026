import { expect, test } from '@playwright/test';
import { abrirConEjemplo } from './ayudas';

const CLAVE = 'promedio-academico:v1';

test.describe('flujo principal en navegador real', () => {
  test('agrega una materia, registra notas, ve la nota necesaria y todo persiste al recargar', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByLabel('Nombre de la materia').fill('Física I');
    await page.getByLabel('Créditos').fill('4');
    await page.getByRole('button', { name: 'Agregar materia' }).click();

    const fisica = page.getByRole('article', { name: 'Física I' });
    await expect(fisica).toBeVisible();
    await fisica.getByRole('group', { name: 'Corte 1' }).getByLabel(/^Nota/).fill('3,5');
    await fisica.getByRole('group', { name: 'Corte 2' }).getByLabel(/^Nota/).fill('2,8');
    await expect(
      fisica.getByText('Necesitas sacar al menos 2,78 en el Corte 3 (vale 40 % de la nota)'),
    ).toBeVisible();

    await page.reload();
    const recargada = page.getByRole('article', { name: 'Física I' });
    await expect(recargada.getByRole('group', { name: 'Corte 1' }).getByLabel(/^Nota/)).toHaveValue(
      '3,5',
    );
    await expect(recargada.getByText(/Necesitas sacar al menos 2,78/)).toBeVisible();
  });

  test('el diálogo de eliminar: Esc cancela y devuelve el foco; confirmar elimina y enfoca la lista', async ({
    page,
  }) => {
    await abrirConEjemplo(page);
    const abrir = page.getByRole('button', { name: 'Eliminar Inglés II' });
    await abrir.click();
    await expect(page.getByRole('dialog', { name: '¿Eliminar «Inglés II»?' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('article', { name: 'Inglés II' })).toBeVisible();
    await expect(abrir).toBeFocused();

    await abrir.click();
    await page.getByRole('button', { name: 'Sí, eliminar' }).click();
    await expect(page.getByRole('article', { name: 'Inglés II' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Mis materias (3)' })).toBeFocused();
  });

  test('el foco nunca cae en la página de fondo mientras el diálogo está abierto', async ({
    page,
  }) => {
    await abrirConEjemplo(page);
    await page.getByRole('button', { name: 'Eliminar Inglés II' }).click();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      // Con un <dialog> modal el fondo es inerte: el foco puede pasar a la interfaz del navegador
      // (activeElement = body), pero nunca a un control de la página que queda detrás.
      const enLaPaginaDeFondo = await page.evaluate(() => {
        const el = document.activeElement;
        return Boolean(el && el !== document.body && !el.closest('dialog'));
      });
      expect(enLaPaginaDeFondo).toBe(false);
    }
  });

  test('datos corruptos en el navegador no rompen la página: empieza vacío', async ({ page }) => {
    await page.addInitScript((clave) => window.localStorage.setItem(clave, '{"basura":'), CLAVE);
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await page.goto('/');
    await expect(page.getByText(/Aún no has agregado materias/)).toBeVisible();
    expect(errores).toEqual([]);
  });

  test('una escala imposible no se guarda: se explica y los cálculos siguen con la anterior', async ({
    page,
  }) => {
    await abrirConEjemplo(page);
    await page.getByLabel('Nota mínima para aprobar').fill('7');
    await expect(
      page.getByText('La nota mínima para aprobar no puede superar la nota máxima.'),
    ).toBeVisible();
    await expect(page.getByText(/mínima para aprobar \(3,0\)/)).toBeVisible();
  });
});
