# Requisitos de calidad · evidencias

Evidencias de las metas de calidad del documento del proyecto 14 (sección 14): rendimiento,
responsive, accesibilidad, HTML semántico y retos de excelencia. Todo está en
[`calidad/`](calidad/) y se puede **reproducir** con los comandos del final.

> **Dónde se midió.** Las cifras son de la **compilación de producción servida en local**
> (`next start`) con Chromium sin cabeza, **no de la URL de Vercel** (todavía no se ha desplegado:
> es del Hito 4). Hay que repetir Lighthouse y PageSpeed Insights sobre la URL pública antes de
> entregar. Lighthouse usó su perfil por defecto (móvil con estrangulamiento simulado de 4G lento y
> CPU ×4; escritorio sin estrangulamiento). Versión: Lighthouse 13.6.0.

## Resumen de cumplimiento

| Requisito                                                                    | Resultado                                                                                                                                              | Estado               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| LCP ≤ 2,5 s · INP ≤ 200 ms · CLS ≤ 0,1                                       | LCP 0,93 s (móvil, simulado) · INP **24 ms** · CLS 0                                                                                                   | ✅                   |
| Lighthouse móvil: Rend. ≥ 90 · Acces. ≥ 95 · BP ≥ 95 · SEO ≥ 95              | **100 · 100 · 100 · 100** en las 3 páginas, móvil y escritorio                                                                                         | ✅ (local)           |
| Presupuesto: JS ≤ 200 kB y página ≤ 1 MB                                     | JS **184,4–188,5 kB** · página **≤ 212 kB** transferidos                                                                                               | ✅ (con poco margen) |
| Responsive 360 · 768 · 1024 sin scroll horizontal                            | Playwright en los 3 anchos, también a 320 px y con zoom al 200 % (emulado)                                                                             | ✅                   |
| Objetivos táctiles ≥ 44 × 44 px · texto ≥ 16 px                              | Comprobado por prueba automática sobre botones, campos, enlaces y todo el texto                                                                        | ✅                   |
| Accesibilidad WCAG 2.2 AA                                                    | axe: **0 violaciones** en 27 combinaciones (3 páginas × 3 temas × 3 anchos) y en las pruebas de navegador (4 temas × 3 anchos × 8 pantallas y estados) | ✅ automático        |
| Revisión manual (teclado real, zoom real, lector de pantalla, teléfono real) | Ver la lista de abajo                                                                                                                                  | ☐ **pendiente**      |
| HTML válido (validador W3C)                                                  | **0 errores y 0 avisos** en 6 documentos (HTML del servidor y DOM hidratado)                                                                           | ✅                   |
| Retos de excelencia (≥ 3)                                                    | 5 elegidos con evidencia                                                                                                                               | ✅                   |

## 1 · Rendimiento y Core Web Vitals

### Lighthouse (móvil y escritorio, 3 páginas)

La hoja pide una página «con sesión iniciada»; **todavía no hay inicio de sesión** (es del Hito 4).
Se midieron la pública (`/`) y dos con formulario (`/materias/…` y `/simulador`); cuando exista la
sesión hay que añadir la cuarta.

| Página                                           | Perfil     | Rend. | Acces. | B. prác. | SEO |    LCP | CLS |   TBT | Informe                                                            |
| ------------------------------------------------ | ---------- | ----: | -----: | -------: | --: | -----: | --: | ----: | ------------------------------------------------------------------ |
| Pública · `/` (resumen)                          | movil      |   100 |    100 |      100 | 100 | 0,93 s |   0 | 44 ms | [informe](calidad/lighthouse/publica-resumen-movil.html)           |
| Pública · `/` (resumen)                          | escritorio |   100 |    100 |      100 | 100 | 0,26 s |   0 |  0 ms | [informe](calidad/lighthouse/publica-resumen-escritorio.html)      |
| Con formulario · `/materias/calculo-diferencial` | movil      |   100 |    100 |      100 | 100 | 0,93 s |   0 | 48 ms | [informe](calidad/lighthouse/formulario-materia-movil.html)        |
| Con formulario · `/materias/calculo-diferencial` | escritorio |   100 |    100 |      100 | 100 | 0,25 s |   0 |  0 ms | [informe](calidad/lighthouse/formulario-materia-escritorio.html)   |
| Con formulario · `/simulador`                    | movil      |   100 |    100 |      100 | 100 | 0,91 s |   0 | 33 ms | [informe](calidad/lighthouse/formulario-simulador-movil.html)      |
| Con formulario · `/simulador`                    | escritorio |   100 |    100 |      100 | 100 | 0,25 s |   0 |  0 ms | [informe](calidad/lighthouse/formulario-simulador-escritorio.html) |

Resumen en JSON: [`calidad/lighthouse/resumen.json`](calidad/lighthouse/resumen.json). Las páginas
piden sus datos a la API con `fetch` después de cargar; el contenido principal (el título) llega ya en
el HTML, y mientras tanto hay un esqueleto del mismo tamaño, por eso el CLS es 0.

### Core Web Vitals reales (incluye INP)

Lighthouse **no mide INP** en laboratorio. Se midió en un navegador real recorriendo el flujo
(resumen → editar notas → agregar y quitar una nota → simulador → cambiar meta y materia) con la
**CPU 4 veces más lenta**:

| Métrica |                                       Resultado |   Límite |
| ------- | ----------------------------------------------: | -------: |
| LCP     |                                          644 ms | 2 500 ms |
| INP     | **24 ms** (29 interacciones; el INP es la peor) |   200 ms |
| CLS     |                                               0 |      0,1 |

Datos: [`calidad/vitales.json`](calidad/vitales.json). Una sola corrida en local, sin red
estrangulada: no sustituye a datos reales de usuarios (percentil 75).

### Antes y después (en esta versión)

| Métrica                    | Qué pasó                                                                                                                                                                                                                                           |                              Antes |        Después |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------: | -------------: |
| **Buenas prácticas**       | Chrome registraba una `kEvalViolation` en su panel de problemas: Zod 4 prueba `new Function('')` para compilar esquemas y, aunque capture el error, el CSP de producción (sin `unsafe-eval`) lo anota. Se configuró `z.config({ jitless: true })`. |                96 en las 3 páginas |        **100** |
| **JavaScript transferido** | Empeoró: el documento exige Zod en el cliente. Sigue dentro del presupuesto, con poco margen.                                                                                                                                                      | 151,1 kB (versión de una pantalla) | 184,4–188,5 kB |
| CLS                        | Sin cambios: ya se había corregido reservando la altura del primer pantallazo (commit `ff0d602`, 0,057 → 0) y el diseño actual lo mantiene.                                                                                                        |                                  0 |              0 |
| LCP / INP                  | Ya cumplían en la primera medición: no hay «antes» que comparar.                                                                                                                                                                                   |                                  — | 644 ms / 24 ms |

El «antes» de buenas prácticas se reproduce haciendo `git checkout e678772` y midiendo; el informe de
esa corrida no se guardó como archivo. La prueba que lo cubre desde entonces es
`e2e/calidad.spec.ts → «ningún problema de CSP en el panel de problemas»`, que **falló antes del
arreglo** y pasa después.

## 2 · Responsive: 360 · 768 · 1024 px

- Pruebas de Playwright en los tres anchos (`e2e/calidad.spec.ts`): sin scroll horizontal en `/`,
  `/simulador`, `/materias/…` y la 404; también **a 320 px** (reflow, WCAG 1.4.10) y a 640 px de ancho
  (equivale a **zoom al 200 %** en una pantalla de 1280 px).
- Todo botón, campo, selector, enlace y `<summary>` mide **≥ 44 × 44 px**; todo el texto visible
  **≥ 16 px**.
- Mobile-first con Grid y Flexbox, `rem`, `clamp()` y `minmax(min(100%, …))`; sin anchos fijos en
  píxeles. Una columna en 360 px; el editor de materia pone formulario y resultado lado a lado desde
  tableta; el resumen y las tarjetas usan 1 a 3 columnas según el ancho.
- Capturas (2× de resolución) en [`calidad/capturas/`](calidad/capturas/): `resumen`, `materia`,
  `materia-con-error`, `simulador`, `error-con-reintento` y `resumen-oscuro`, cada una en 360, 768 y 1024.
- **Falta:** probar en un teléfono real, en vertical y horizontal.

## 3 · Accesibilidad (WCAG 2.2 nivel AA)

### Automática

- **axe en el navegador real** (`e2e/calidad.spec.ts`): las 4 rutas más los estados de **error con
  reintento, vacío, errores de validación y diálogo abierto**, en **4 temas** (claro, oscuro y ambos
  con alto contraste) y los 3 anchos. **0 violaciones.**
- **axe en Vitest** con Testing Library (`src/components/accesibilidad.test.tsx`): carga, resumen,
  error, editor con y sin errores y simulador. 0 violaciones.
- Informes completos en [`calidad/axe/`](calidad/axe/) (27 archivos) con las reglas aprobadas y los
  puntos **«incompletos»**: axe marcó `color-contrast` como incompleto en 8 elementos de `/`, 3 de
  `/materias/…` y 2 de `/simulador`. Son **los iconos decorativos** «✓» y «→» (`aria-hidden`), que axe no puede evaluar por no ser texto;
  se verificaron a mano: usan los mismos pares de color ya calculados (6,7:1 o más en claro y oscuro).
- **Contraste calculado** con la fórmula WCAG para todos los pares de la paleta (texto ≥ 4,5:1 y bordes
  de controles ≥ 3:1) antes de escribir el CSS.
- **Las pruebas no son decorativas.** Se rompió a propósito el contraste, el tamaño del texto y el de
  los botones y la suite falló en cada caso; y la del CSP **falló antes** del arreglo de Zod.

### Qué se implementó

Enlace «Saltar al contenido»; foco visible de 3 px; `<label>` en cada campo; `<fieldset>/<legend>` por
nota; errores en texto junto al campo, enlazados con `aria-describedby`, anunciados con `aria-live` y
reflejados en la validación nativa (`setCustomValidity`); `lang="es"`; `<title>` único por ruta;
`prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast` y `forced-colors`; estados con
icono y texto; `<dialog>` y `<details>` nativos; sin cabeceras fijas que tapen el foco.

### Lista de comprobación manual (con fecha)

Lo automático detecta solo una parte. **Esto lo debe hacer una persona y firmarlo con la fecha:**

| Comprobación                                                    | Automático                                          | Manual (fecha y quién)               |
| --------------------------------------------------------------- | :-------------------------------------------------- | ------------------------------------ |
| Todo se usa solo con teclado, en orden lógico y sin trampas     | ✅ Tab, salto al contenido y contorno de foco       | ☐ ____                               |
| Zoom al 200 % del navegador sin perder contenido ni funciones   | ✅ emulado con el ancho equivalente                 | ☐ ____                               |
| **Pasada con lector de pantalla** (NVDA en Windows o VoiceOver) | ❌ no se hizo                                       | ☐ ____                               |
| Probar en un **teléfono real**                                  | ❌ no se hizo                                       | ☐ ____                               |
| Cambios de estado y de ruta anunciados a un lector de pantalla  | ✅ hay `aria-live`/`role` en el código y se prueban | ☐ ____ (¿se entiende al escucharlo?) |
| Validador HTML de W3C                                           | ✅ vnu local, 0 errores                             | —                                    |

## 4 · HTML semántico y buenas prácticas

- **Validador HTML de W3C** (Nu, `vnu-jar`): **0 errores y 0 avisos** en el HTML del servidor de `/` y
  en el **DOM ya hidratado** de `/`, `/materias/…` (también con un error de validación visible),
  `/simulador` y la 404 ([`calidad/validador-html/`](calidad/validador-html/)). Los 31 mensajes
  «informativos» del HTML del servidor son todos el mismo («barra final en elementos vacíos»): así
  serializa React `<meta />`, no es un error.
- Landmarks `header`, `nav`, `main`, `footer`; **un solo `<h1>`** por página y sin saltar niveles;
  `<button>` para acciones y `<a>` para navegar; **cero `<div onClick>`**; sin `!important` salvo la
  regla canónica de movimiento reducido y la de impresión.
- ESLint sin advertencias (`--max-warnings 0`) con `jsx-a11y`; consola **y panel de problemas de
  Chrome** sin errores ni violaciones de CSP (pruebas automáticas).
- **SEO:** `<title>` y `description` por ruta, Open Graph con imagen generada, `robots.txt`,
  `sitemap.xml`, página 404 propia, favicon (SVG) y JSON-LD (`WebApplication`).
- **Seguridad:** `Content-Security-Policy` (producción, sin `unsafe-eval`), `Strict-Transport-Security`,
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; sin
  `X-Powered-By`. Errores de la API sin detalles internos y **nunca cacheados**. Registro por petición
  sin datos sensibles. `npm audit --omit=dev`: 0 vulnerabilidades. Pendientes de otros hitos: cookie
  de sesión `HttpOnly`, comprobación de `Origin`, límite de frecuencia y autorización por objeto.
- Fuentes del sistema (sin `next/font`: no hay fuentes web) e imágenes solo SVG/PNG generados.

## 5 · Retos de excelencia (elegidos 5; la hoja pide 3)

| Reto                                                                                      | Evidencia y cómo reproducirla                                                                                           |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **100 en las cuatro categorías de Lighthouse** (móvil) en 3 páginas                       | Tabla de arriba y `calidad/lighthouse/`. **En local**: repetir sobre Vercel antes de reclamarlo                         |
| **Prueba en 3 anchos con Playwright**: sin scroll horizontal y 0 violaciones de axe       | `e2e/calidad.spec.ts`. `npm run e2e`                                                                                    |
| **Pruebas de accesibilidad de componentes** con axe dentro de Vitest y Testing Library    | `src/components/accesibilidad.test.tsx`. `npm test`                                                                     |
| **Modo oscuro y alto contraste** sin romper el contraste                                  | axe en 4 temas (claro, oscuro y ambos con alto contraste). `npm run e2e`                                                |
| **Impresión** (`@media print`) y **SEO avanzado** (JSON-LD, sitemap, imágenes Open Graph) | Prueba «al imprimir…» en `e2e/calidad.spec.ts`; `src/app/{sitemap,robots,opengraph-image}` y el JSON-LD de `layout.tsx` |

**No alcanzados** (no se reclaman): «JavaScript ≤ 120 kB» (son 184,4–188,5 kB); «panel propio de
métricas reales (p75) guardadas por su API»; «funciona sin JavaScript» (los datos llegan por `fetch`);
«navegación accesible probada con lector de pantalla»; «español e inglés».

## Cómo reproducirlo todo

```bash
npm ci
npm run check                                                   # typecheck + lint + formato + pruebas
npm run e2e                                                     # 3 anchos, 4 temas, flujos, API
CAPTURAS=1 INFORMES=1 npx playwright test e2e/capturas.spec.ts e2e/informe-axe.spec.ts
VITALES=1 npx playwright test e2e/vitales.spec.ts --project=movil-360
npm run build && npm run start -- -p 3100                       # y en otra terminal:
npx lighthouse http://localhost:3100/ --view                    # Lighthouse (móvil por defecto)
```

El validador de W3C se corrió con `vnu-jar` (Java) sobre el HTML y el DOM de cada ruta.

## Pendiente antes de entregar

1. Desplegar en Vercel (Hito 4) y repetir Lighthouse y PageSpeed Insights sobre la **URL pública**.
2. La **pasada con lector de pantalla**, la prueba en **teléfono real** y el teclado/zoom manuales, con fecha.
3. Añadir la página «con sesión iniciada» a Lighthouse cuando exista el inicio de sesión.
4. Poder **demostrar todo en vivo** en la sustentación.
