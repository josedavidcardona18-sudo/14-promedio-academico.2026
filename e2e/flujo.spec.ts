import { expect, type Page } from '@playwright/test';
import {
  RESUMEN,
  SIMULADOR,
  abrir,
  alertaDeError,
  cuentaVacia,
  notaDe,
  porcentajeDe,
  romperApi,
  test,
} from './ayudas';

const resultado = (page: Page) => page.getByRole('region', { name: 'Resultado' });
const resumen = (page: Page) => page.getByRole('region', { name: /Resumen de/ });
const guardar = (page: Page) => page.getByRole('button', { name: 'Guardar cambios' });

test.describe('criterios de aceptación del documento, en un navegador real', () => {
  test('1. con 4,0 (30 %) y 3,0 (30 %), el simulador dice qué necesito en el 40 % restante', async ({
    page,
    aislado,
  }) => {
    await abrir(page, aislado.materia);
    await notaDe(page, 1).fill('4');
    await notaDe(page, 2).fill('3');
    await notaDe(page, 3).fill('');
    await expect(resultado(page)).toContainText(
      'Necesitas al menos 2,3 en el 40 % que falta para llegar a 3,0',
    );
  });

  test('2. porcentajes que suman 110 % se rechazan en el formulario y no se pueden guardar', async ({
    page,
    aislado,
  }) => {
    await abrir(page, aislado.materia);
    await porcentajeDe(page, 3).fill('50');
    await expect(
      page.getByText('Los porcentajes suman 110 %; no pueden pasar de 100 %.'),
    ).toBeVisible();
    await expect(page.getByText(/Corrige los datos marcados/)).toBeVisible();
    await expect(porcentajeDe(page, 3)).toHaveAttribute('aria-invalid', 'true');
    await expect(guardar(page)).toBeDisabled();
  });

  test('3. si la nota necesaria es mayor que 5,0 se avisa que ya no es alcanzable', async ({
    page,
  }) => {
    await abrir(page, SIMULADOR);
    await page.getByLabel('Meta (3,0 a 5,0)').fill('4.5');
    await expect(
      page.getByText(
        'La meta de 4,5 ya no es alcanzable: ni con 5,0 en lo que falta pasas de 3,89.',
      ),
    ).toBeVisible();
  });

  test('4. sin errores de coma flotante: 3,3 y 2,7 al 30 % piden exactamente 3,0', async ({
    page,
    aislado,
  }) => {
    await abrir(page, aislado.materia);
    await notaDe(page, 1).fill('3.3');
    await notaDe(page, 2).fill('2.7');
    await notaDe(page, 3).fill('');
    await expect(resultado(page)).toContainText('Necesitas al menos 3,0 en el 40 % que falta');
  });

  test('una nota de 5,5 se rechaza con su mensaje (validación del navegador y de Zod)', async ({
    page,
    aislado,
  }) => {
    await abrir(page, aislado.materia);
    await notaDe(page, 3).fill('5.5');
    await expect(page.getByText('La nota no puede pasar de 5,0.')).toBeVisible();
    const mensaje = await notaDe(page, 3).evaluate((el) =>
      el instanceof HTMLInputElement ? el.validationMessage : '',
    );
    expect(mensaje).toBe('La nota no puede pasar de 5,0.');
  });
});

test.describe('guardado explícito y borrador', () => {
  test('editar una nota actualiza el resultado; solo «Guardar» la lleva a la cuenta', async ({
    page,
    aislado,
  }) => {
    await abrir(page, aislado.resumen);
    await expect(resumen(page)).toContainText('3,15');
    await page.getByRole('link', { name: 'Ver y editar notas de Cálculo diferencial' }).click();
    await expect(resultado(page)).toBeVisible();
    await notaDe(page, 3).fill('5');
    await expect(resultado(page)).toContainText('3,89');
    await expect(page.getByText(/Tienes cambios sin guardar/)).toBeVisible();

    await guardar(page).click();
    await expect(page.getByText('Cambios guardados en tu cuenta.')).toBeVisible();
    await page.getByRole('link', { name: /Volver al resumen/ }).click();
    await expect(resumen(page)).toContainText('3,89');
    await page.reload();
    await expect(resumen(page)).toContainText('3,89');
  });

  test('lo que no se guardó queda como borrador al recargar y se puede descartar', async ({
    page,
    aislado,
  }) => {
    await abrir(page, aislado.materia);
    await notaDe(page, 3).fill('5');
    await page.reload();
    await expect(resultado(page)).toBeVisible();
    await expect(notaDe(page, 3)).toHaveValue('5');
    await expect(page.getByText(/Tienes cambios sin guardar/)).toBeVisible();

    await page.getByRole('button', { name: 'Descartar cambios' }).click();
    await expect(notaDe(page, 3)).toHaveValue('');
    await page.reload();
    await expect(notaDe(page, 3)).toHaveValue('');
  });

  test('agregar una materia al semestre la crea y abre su pantalla de notas', async ({
    page,
    aislado,
  }) => {
    await abrir(page, aislado.resumen);
    await page.getByText('Agregar una materia').click();
    await page.getByLabel('Nombre de la materia').fill('Física I');
    await page.getByRole('button', { name: 'Crear materia' }).click();
    await expect(page.getByRole('heading', { name: /Física I/ })).toBeVisible();
    await page.getByRole('link', { name: /Volver al resumen/ }).click();
    await expect(page.getByRole('heading', { name: 'Materias (2)' })).toBeVisible();
  });

  test('eliminar una materia pide confirmación: Esc cancela y devuelve el foco al botón', async ({
    page,
    aislado,
  }) => {
    await abrir(page, aislado.materia);
    const eliminar = page.getByRole('button', { name: 'Eliminar materia' });
    await eliminar.click();
    await expect(
      page.getByRole('dialog', { name: '¿Eliminar Cálculo diferencial?' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(eliminar).toBeFocused();

    await eliminar.click();
    await page.getByRole('button', { name: 'Sí, eliminar' }).click();
    await expect(resumen(page)).toBeVisible();
    await expect(page.getByText(/aún no tiene materias/).first()).toBeVisible();
  });
});

test.describe('historial: crear, editar, comparar y eliminar semestres', () => {
  test('flujo completo con un semestre propio', async ({ page }) => {
    const nombre = `E2E ${Math.random().toString(36).slice(2, 8)}`;
    await abrir(page, '/historial');
    await page.getByText('Nuevo semestre').click();
    await page.getByLabel('Nombre del semestre').first().fill(nombre);
    await page.getByRole('button', { name: 'Crear semestre' }).click();
    await expect(page.getByRole('heading', { name: nombre, level: 3 })).toBeVisible();

    const tarjeta = page.getByRole('article', { name: nombre });
    await page.getByRole('button', { name: `Editar ${nombre}` }).click();
    await tarjeta.getByLabel('Nombre del semestre').fill(`${nombre} editado`);
    await tarjeta.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByRole('heading', { name: `${nombre} editado`, level: 3 })).toBeVisible();

    await page.getByRole('button', { name: `Eliminar ${nombre} editado` }).click();
    await page.getByRole('button', { name: 'Sí, eliminar' }).click();
    await expect(page.getByRole('heading', { name: `${nombre} editado` })).toHaveCount(0);
  });

  test('la tabla muestra el promedio y se compara con otro semestre', async ({ page, aislado }) => {
    await abrir(page, '/historial');
    const fila = page.getByRole('row', { name: new RegExp(aislado.nombre) });
    await expect(fila).toContainText('3,15');
    await page.getByLabel('Semestre A').selectOption({ label: '2026-2 (datos de ejemplo)' });
    await page.getByLabel('Semestre B').selectOption({ label: aislado.nombre });
    await expect(page.getByRole('status').filter({ hasText: 'frente a' })).toContainText(
      '0,22 por debajo',
    );
  });

  test('el semestre elegido se conserva al moverse por la navegación', async ({ page }) => {
    await abrir(page, RESUMEN);
    await page.getByRole('link', { name: 'Simulador' }).click();
    await expect(page).toHaveURL(/\/simulador\?semestre=ejemplo$/);
    await expect(page.getByLabel('Semestre')).toHaveValue('ejemplo');
  });
});

test.describe('simulador y rutas', () => {
  test('cambiar de materia en el simulador actualiza el mensaje', async ({ page }) => {
    await abrir(page, SIMULADOR);
    await expect(page.getByText(/Necesitas al menos 2,8 en el 40 %/)).toBeVisible();
    await page.getByLabel('Materia').selectOption({ label: 'Álgebra lineal' });
    await expect(page.getByText(/Necesitas al menos 4,2 en el 40 %/)).toBeVisible();
  });

  test('una materia que no existe lo dice y ofrece volver al resumen', async ({ page }) => {
    await page.goto('/materias/no-existe?semestre=ejemplo');
    await expect(page.getByRole('heading', { name: 'No encontramos esa materia' })).toBeVisible();
    await page.getByRole('link', { name: 'Volver al resumen', exact: true }).click();
    await expect(resumen(page)).toBeVisible();
  });
});

test.describe('estados de la interfaz: carga, error con reintento, vacío y sesión vencida', () => {
  test('mientras la API responde se ve «cargando» (esqueleto) y luego los datos', async ({
    page,
  }) => {
    await page.route(/\/api\/semestres\?limite=100/, async (ruta) => {
      await new Promise((listo) => setTimeout(listo, 700));
      await ruta.continue();
    });
    await page.goto(RESUMEN);
    await expect(page.getByText('Cargando tus materias…')).toBeAttached();
    await expect(resumen(page)).toBeVisible();
  });

  test('si la API cae se muestra el error y «Reintentar» recupera los datos', async ({ page }) => {
    const restaurar = await romperApi(page);
    await page.goto(RESUMEN);
    await expect(alertaDeError(page)).toContainText('El servidor no pudo completar la acción');
    await restaurar();
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(resumen(page)).toBeVisible();
    await expect(alertaDeError(page)).toHaveCount(0);
  });

  test('sin semestres se muestra el estado vacío; si el ejemplo ya está cargado, el servidor lo dice', async ({
    page,
  }) => {
    await cuentaVacia(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Aún no tienes semestres' })).toBeVisible();
    await page.getByRole('button', { name: 'Cargar datos de ejemplo' }).click();
    await expect(page.getByText('Los datos de ejemplo ya están cargados.')).toBeVisible();
  });

  test('con la sesión vencida se explica y se ofrece iniciar sesión', async ({ page }) => {
    await page.route(/\/api\/semestres\?limite=100/, (r) =>
      r.fulfill({ status: 401, json: { error: 'Necesitas iniciar sesión.' } }),
    );
    await page.goto('/historial');
    await expect(page.getByRole('heading', { name: 'Tu sesión venció' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/login?siguiente=%2Fhistorial',
    );
  });

  test('un borrador corrupto en el navegador no rompe la página: usa lo guardado', async ({
    page,
    aislado,
  }) => {
    await page.addInitScript(
      (clave) => window.localStorage.setItem(clave, '{"basura":'),
      `promedio-academico:borrador:${aislado.id}:${aislado.materiaId}`,
    );
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await abrir(page, aislado.materia);
    await expect(notaDe(page, 1)).toHaveValue('3.5');
    expect(errores).toEqual([]);
  });
});
