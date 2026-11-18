# Calculadora de promedio académico

Registra tus materias y las notas de cada corte, calcula tu promedio del semestre y responde la
pregunta que todos se hacen: **«¿qué nota necesito para aprobar?»**. Sin cuenta y sin servidor: los
datos se guardan solo en tu navegador.

- **Resumen del semestre**: promedio ponderado por créditos con las notas registradas.
- **Materias con cortes**: cada corte tiene un porcentaje y una nota; los porcentajes deben sumar 100 %.
- **Simulador**: la nota que necesitas en lo que falta, para aprobar o para una meta propia.
- **Escala configurable**: por defecto 0–5 y se aprueba con 3,0.
- Accesible (WCAG 2.2 AA), responsive (360 · 768 · 1024 px), modo oscuro, alto contraste e impresión.

Cómo se calcula cada cosa, con un ejemplo, está en la página `/acerca`.

## Cómo correrlo

Requiere Node 20.9 o superior (se desarrolló con Node 22).

```bash
npm ci
npm run dev        # http://localhost:3000
```

Opcional: `cp env.example .env.local` para definir `NEXT_PUBLIC_SITE_URL` (solo afecta a los
metadatos, el sitemap y la imagen para redes sociales).

## Scripts

| Comando          | Qué hace                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `npm run check`  | `typecheck` + `lint` + `format:check` + `test`. **Si no pasa, no está terminado.**                   |
| `npm test`       | Vitest con cobertura (umbral 80 %; 90 % en `domain`) y las pruebas `node:test` del hook y de commits |
| `npm run e2e`    | Playwright en 360, 768 y 1024 px con axe (compila y levanta la app en el puerto 3100)                |
| `npm run build`  | Compilación de producción                                                                            |
| `npm run format` | Prettier                                                                                             |

Para Playwright en una máquina nueva: `npx playwright install chromium`.

## Estructura y capas

```text
src/domain/      lógica pura (tipos, cálculo, validación, reducer). Sin React, DOM ni localStorage
src/storage/     único módulo que toca localStorage; valida lo que lee
src/hooks/       useAlmacen (useSyncExternalStore) y useHidratado
src/components/  interfaz (CSS Modules); sin reglas de negocio
src/app/         rutas, metadatos, sitemap, robots, imagen social
e2e/             Playwright + axe
calidad/         evidencias de calidad (ver CALIDAD.md)
ia/ · .claude/   configuración y evidencias de IA (ver IA.md)
```

Dependencias permitidas: `app → components → hooks → storage → domain`, nunca al revés.

## Decisiones de diseño

- **Una nota por corte.** Es lo que pide el proyecto y mantiene la aplicación sencilla.
- **La definitiva se aproxima a 2 decimales** (mitad hacia arriba) antes de compararla con la mínima:
  así lo que se ve es lo que se decide. Si su institución no aproxima, la nota necesaria ya es
  conservadora (se redondea hacia arriba), pero la definitiva podría diferir por unos centésimos.
- **`localStorage` y nada más.** No hay backend: menos superficie de ataque y cero secretos. Lo que se
  lee del navegador se valida con guardas de tipo; si está corrupto se empieza vacío en vez de romper.
- **`useSyncExternalStore`** en vez de `useEffect` + `setState`: el HTML del servidor no depende del
  navegador, no hay parpadeo y se sincroniza entre pestañas.
- **Sin fuentes web.** Se usa la pila de fuentes del sistema: 0 bytes y cero cambio de diseño al cargar.
- **`<dialog>` nativo** para confirmar acciones destructivas (foco, `Esc` y fondo inerte sin código extra).
- **Estados con icono y texto**, nunca solo color.

## Dependencias (cada una justificada)

**Producción**

| Paquete              | Por qué                                     |
| -------------------- | ------------------------------------------- |
| `next`               | Framework (App Router, SEO, build estático) |
| `react`, `react-dom` | Interfaz                                    |

**Desarrollo**

| Paquete                                                                  | Por qué                                                                                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `typescript`, `@types/node`, `@types/react`, `@types/react-dom`          | Tipado estricto. Se fijó TypeScript 5.9 porque `typescript-eslint` aún no admite TS 7                               |
| `eslint` (9), `eslint-config-next`, `eslint-config-prettier`             | Lint con las reglas de la hoja (complejidad, tamaño de función, `jsx-a11y`). ESLint 9 por compatibilidad de plugins |
| `prettier`                                                               | Formato único                                                                                                       |
| `vitest`, `@vitest/coverage-v8`, `vite`, `@vitejs/plugin-react`, `jsdom` | Pruebas unitarias y de componentes con umbral de cobertura (`vite` explícito porque el plugin lo exige)             |
| `@testing-library/react`, `/dom`, `/user-event`, `/jest-dom`             | Probar como lo usa una persona                                                                                      |
| `axe-core`                                                               | Accesibilidad dentro de Vitest                                                                                      |
| `@playwright/test`, `@axe-core/playwright`                               | Pruebas en navegador real a 3 anchos, con axe                                                                       |
| `husky`, `lint-staged`                                                   | Revisar lo modificado al hacer commit y `npm run check` al hacer push                                               |

Herramientas que se usan **sin instalarlas** en el proyecto: Lighthouse, `puppeteer-core` y `vnu-jar`
(validador HTML de W3C), con `npx` o desde una carpeta aparte.

## Calidad, IA y despliegue

- Requisitos de calidad y sus evidencias: [`CALIDAD.md`](CALIDAD.md).
- Configuración de IA, pruebas de contención y bitácora: [`IA.md`](IA.md).
- **Despliegue:** importar el repositorio en Vercel y definir `NEXT_PUBLIC_SITE_URL`. **Aún no se
  desplegó**: las mediciones de `CALIDAD.md` son de la compilación de producción en local y deben
  repetirse sobre la URL de Vercel (PageSpeed Insights).
- **Dependencias con avisos:** `npm audit --omit=dev` da 0. Las 19 alertas «altas» de desarrollo son un
  solo aviso de `picomatch ≤ 4.0.7`, sin versión corregida publicada; la CI las muestra sin bloquear.
