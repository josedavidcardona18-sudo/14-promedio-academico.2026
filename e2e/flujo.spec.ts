import { expect, test, type Page } from '@playwright/test';
import { abrir, alertaDeError, crearBorrador, notaDe, porcentajeDe, romperApi } from './ayudas';

const resultado = (page: Page) => page.getByRole('region', { name: 'Resultado' });
const resumen = (page: Page) => page.getByRole('region', { name: /Resumen de/ });

test.describe('criterios de aceptación del documento, en un navegador real', () => {
  test('1. con 4,0 (30 %) y 3,0 (30 %), el simulador dice qué necesito en el 40 % restante', async ({
    page,
  }) => {
    await abrir(page, '/materias/calculo-diferencial');
    await notaDe(page, 1).fill('4');
    await notaDe(page, 2).fill('3');
    await notaDe(page, 3).fill('');
    await expect(resultado(page)).toContainText(
      'Necesitas al menos 2,3 en el 40 % que falta para llegar a 3,0',
    );
  });

  test('2. porcentajes que suman 110 % se rechazan en el formulario', async ({ page }) => {
    await abrir(page, '/materias/calculo-diferencial');
    await porcentajeDe(page, 3).fill('50');
    await expect(
      page.getByText('Los porcentajes suman 110 %; no pueden pasar de 100 %.'),
    ).toBeVisible();
    await expect(page.getByText(/Corrige los datos marcados/)).toBeVisible();
    await expect(porcentajeDe(page, 3)).toHaveAttribute('aria-invalid', 'true');
  });

  test('3. si la nota necesaria es mayor que 5,0 se avisa que ya no es alcanzable', async ({
    page,
  }) => {
    await abrir(page, '/simulador');
    await page.getByLabel('Meta (3,0 a 5,0)').fill('4.5');
    await expect(
      page.getByText(
        'La meta de 4,5 ya no es alcanzable: ni con 5,0 en lo que falta pasas de 3,89.',
      ),
    ).toBeVisible();
  });

  test('4. sin errores de coma flotante: 3,3 y 2,7 al 30 % piden exactamente 3,0', async ({
    page,
  }) => {
    await abrir(page, '/materias/calculo-diferencial');
    await notaDe(page, 1).fill('3.3');
    await notaDe(page, 2).fill('2.7');
    await notaDe(page, 3).fill('');
    await expect(resultado(page)).toContainText('Necesitas al menos 3,0 en el 40 % que falta');
  });

  test('una nota de 5,5 se rechaza con su mensaje (validación del navegador y de Zod)', async ({
    page,
  }) => {
    await abrir(page, '/materias/calculo-diferencial');
    await notaDe(page, 3).fill('5.5');
    await expect(page.getByText('La nota no puede pasar de 5,0.')).toBeVisible();
    const mensaje = await notaDe(page, 3).evaluate((el) =>
      el instanceof HTMLInputElement ? el.validationMessage : '',
    );
    expect(mensaje).toBe('La nota no puede pasar de 5,0.');
  });
});

test.describe('flujo principal', () => {
  test('editar una nota actualiza el resumen, queda como borrador y se puede restablecer', async ({
    page,
  }) => {
    await abrir(page, '/');
    await expect(resumen(page)).toContainText('3,37');
    await page.getByRole('link', { name: 'Ver y editar notas de Cálculo diferencial' }).click();
    await expect(resultado(page)).toBeVisible();
    await notaDe(page, 3).fill('5');
    await expect(resultado(page)).toContainText('3,89');
    await expect(resultado(page).getByText('Aprobada')).toBeVisible();

    await page.getByRole('link', { name: /Volver al resumen/ }).click();
    await expect(resumen(page)).toContainText('3,61');
    await page.reload();
    await expect(resumen(page)).toContainText('3,61');

    await page.getByRole('button', { name: 'Restablecer datos de ejemplo' }).click();
    await page.getByRole('button', { name: 'Sí, restablecer' }).click();
    await expect(resumen(page)).toContainText('3,37');
  });

  test('el diálogo de restablecer: Esc cancela y devuelve el foco al botón', async ({ page }) => {
    await crearBorrador(page);
    await abrir(page, '/');
    const abrirDialogo = page.getByRole('button', { name: 'Restablecer datos de ejemplo' });
    await abrirDialogo.click();
    await expect(
      page.getByRole('dialog', { name: '¿Restablecer los datos de ejemplo?' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(abrirDialogo).toBeFocused();
    await expect(resumen(page)).toContainText('3,61');
  });

  test('cambiar de materia en el simulador actualiza el mensaje', async ({ page }) => {
    await abrir(page, '/simulador');
    await expect(page.getByText(/Necesitas al menos 2,8 en el 40 %/)).toBeVisible();
    await page.getByLabel('Materia').selectOption({ label: 'Álgebra lineal' });
    await expect(page.getByText(/Necesitas al menos 4,2 en el 40 %/)).toBeVisible();
  });

  test('una materia que no existe lo dice y ofrece volver al resumen', async ({ page }) => {
    await page.goto('/materias/no-existe');
    await expect(page.getByRole('heading', { name: 'No encontramos esa materia' })).toBeVisible();
    await page.getByRole('link', { name: 'Volver al resumen', exact: true }).click();
    await expect(resumen(page)).toBeVisible();
  });
});

test.describe('estados de la interfaz: carga, error con reintento y vacío', () => {
  test('mientras la API responde se ve «cargando» (esqueleto) y luego los datos', async ({
    page,
  }) => {
    await page.route('**/api/semestres/ejemplo', async (ruta) => {
      await new Promise((listo) => setTimeout(listo, 700));
      await ruta.continue();
    });
    await page.goto('/');
    await expect(page.getByText('Cargando tus materias…')).toBeAttached();
    await expect(resumen(page)).toBeVisible();
  });

  test('si la API cae se muestra el error y «Reintentar» recupera los datos', async ({ page }) => {
    const restaurar = await romperApi(page);
    await page.goto('/');
    await expect(alertaDeError(page)).toContainText('El servidor no pudo entregar los datos');
    await restaurar();
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(resumen(page)).toBeVisible();
    await expect(alertaDeError(page)).toHaveCount(0);
  });

  test('sin materias se muestra el estado vacío y se puede restablecer el ejemplo', async ({
    page,
  }) => {
    await page.addInitScript(() =>
      window.localStorage.setItem(
        'promedio-academico:borrador:ejemplo',
        JSON.stringify({ version: 1, materias: [] }),
      ),
    );
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Aún no hay materias' })).toBeVisible();
    await page.getByRole('button', { name: 'Restablecer datos de ejemplo' }).click();
    await expect(resumen(page)).toBeVisible();
  });

  test('un borrador corrupto en el navegador no rompe la página: usa el ejemplo', async ({
    page,
  }) => {
    await page.addInitScript(() =>
      window.localStorage.setItem('promedio-academico:borrador:ejemplo', '{"basura":'),
    );
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await page.goto('/');
    await expect(resumen(page)).toContainText('3,37');
    expect(errores).toEqual([]);
  });
});
