import axe from 'axe-core';

/**
 * Corre axe sobre un fragmento y devuelve las violaciones en texto legible (vacío = sin violaciones).
 * jsdom no calcula estilos ni diseño: el contraste y las reglas de página completa (landmarks,
 * h1) se verifican en el navegador real con Playwright (e2e/).
 */
export async function violacionesDeAccesibilidad(contenedor: HTMLElement): Promise<string[]> {
  const resultado = await axe.run(contenedor, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
    },
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
      'landmark-one-main': { enabled: false },
      'page-has-heading-one': { enabled: false },
    },
  });
  return resultado.violations.map(
    (v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
  );
}
