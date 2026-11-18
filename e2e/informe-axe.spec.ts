import AxeBuilder from '@axe-core/playwright';
import { test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { abrirConEjemplo } from './ayudas';

// Guarda el resultado completo de axe (violaciones, reglas aprobadas y puntos «incompletos» que
// exigen revisión manual) en calidad/axe:  INFORMES=1 npx playwright test e2e/informe-axe.spec.ts
test.skip(!process.env.INFORMES, 'solo con INFORMES=1');

const ETIQUETAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const TEMAS = [
  { nombre: 'claro', medios: { colorScheme: 'light' } },
  { nombre: 'oscuro', medios: { colorScheme: 'dark' } },
  { nombre: 'alto-contraste', medios: { colorScheme: 'light', contrast: 'more' } },
] as const;

for (const tema of TEMAS) {
  test(`informe de axe · ${tema.nombre}`, async ({ page }, info) => {
    const ancho = info.project.use.viewport?.width ?? 0;
    mkdirSync('calidad/axe', { recursive: true });
    await page.emulateMedia(tema.medios);
    const paginas = [
      { nombre: 'acerca', abrir: () => page.goto('/acerca') },
      { nombre: 'inicio-con-datos', abrir: () => abrirConEjemplo(page) },
    ];
    for (const { nombre, abrir } of paginas) {
      await abrir();
      const r = await new AxeBuilder({ page }).withTags(ETIQUETAS).analyze();
      const informe = {
        pagina: nombre,
        tema: tema.nombre,
        ancho,
        version_de_axe: r.testEngine.version,
        violaciones: r.violations.length,
        reglas_aprobadas: r.passes.length,
        reglas_no_aplicables: r.inapplicable.length,
        incompletos_a_revisar_a_mano: r.incomplete.map((i) => ({
          regla: i.id,
          ayuda: i.help,
          elementos: i.nodes.length,
        })),
        detalle_de_violaciones: r.violations.map((v) => ({
          regla: v.id,
          impacto: v.impact,
          ayuda: v.help,
        })),
      };
      writeFileSync(
        `calidad/axe/${nombre}-${tema.nombre}-${ancho}.json`,
        JSON.stringify(informe, null, 2) + '\n',
      );
    }
  });
}
