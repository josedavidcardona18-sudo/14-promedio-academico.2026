# Requisitos de calidad · evidencias

Evidencias de los requisitos de calidad de la hoja (rendimiento, responsive, accesibilidad, HTML
semántico y retos de excelencia). Todo está en la carpeta [`calidad/`](calidad/) y se puede
**reproducir** con los comandos del final.

> **Dónde se midió.** Las cifras son de la **compilación de producción servida en local**
> (`next start`) con Chromium sin cabeza, no de la URL de Vercel (**todavía no se ha desplegado**). Hay
> que repetir Lighthouse y PageSpeed Insights sobre la URL pública antes de entregar. Lighthouse usó su
> perfil por defecto (móvil con estrangulamiento simulado 4G lento y CPU x4; escritorio sin estrangulamiento).
> Versión: Lighthouse 13.6.0.

## Resumen de cumplimiento

| Requisito                                                                    | Resultado                                                                                                                                                                     | Estado          |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| LCP ≤ 2,5 s · INP ≤ 200 ms · CLS ≤ 0,1                                       | LCP 0,91 s (móvil, simulado) · INP 96 ms · CLS 0                                                                                                                              | ✅              |
| Lighthouse móvil: Rend. ≥ 90 · Acces. ≥ 95 · BP ≥ 95 · SEO ≥ 95              | 99–100 · 100 · 100 · 100 en las 3 páginas                                                                                                                                     | ✅ (local)      |
| Presupuesto: JS ≤ 200 kB y página ≤ 1 MB                                     | JS **151,1 kB** · página **≤ 173,3 kB** transferidos                                                                                                                          | ✅              |
| Responsive 360 · 768 · 1024 sin scroll horizontal                            | Playwright en los 3 anchos, también a 320 px y con zoom al 200 % (emulado)                                                                                                    | ✅              |
| Objetivos táctiles ≥ 44 × 44 px · texto ≥ 16 px                              | Comprobado por prueba automática sobre todos los botones, campos y textos                                                                                                     | ✅              |
| Accesibilidad WCAG 2.2 AA                                                    | axe: **0 violaciones** en 18 combinaciones (3 anchos × 3 temas × 2 páginas) y en 4 temas × 6 estados en Playwright (3 rutas, con datos, con errores y con el diálogo abierto) | ✅ automático   |
| Revisión manual (teclado real, zoom real, lector de pantalla, teléfono real) | Ver la lista de abajo                                                                                                                                                         | ☐ **pendiente** |
| HTML válido (validador W3C)                                                  | **0 errores y 0 avisos** en 4 documentos                                                                                                                                      | ✅              |
| Retos de excelencia (≥ 3)                                                    | 4 elegidos con evidencia                                                                                                                                                      | ✅              |

## 1 · Rendimiento y Core Web Vitals

### Lighthouse (móvil y escritorio, 3 páginas)

La hoja pide una página «con sesión iniciada»; esta app **no tiene inicio de sesión**, así que la
tercera es la calculadora **con materias cargadas**.

| Página                              | Perfil     | Rend. | Acces. | B. prác. | SEO |    LCP | CLS |    TBT | Informe                                                         |
| ----------------------------------- | ---------- | ----: | -----: | -------: | --: | -----: | --: | -----: | --------------------------------------------------------------- |
| Pública · `/acerca`                 | movil      |   100 |    100 |      100 | 100 | 0.92 s |   0 |  60 ms | [informe](calidad/lighthouse/publica-acerca-movil.html)         |
| Pública · `/acerca`                 | escritorio |   100 |    100 |      100 | 100 | 0.25 s |   0 |   0 ms | [informe](calidad/lighthouse/publica-acerca-escritorio.html)    |
| Con formulario · `/`                | movil      |    99 |    100 |      100 | 100 | 0.91 s |   0 | 110 ms | [informe](calidad/lighthouse/formulario-inicio-movil.html)      |
| Con formulario · `/`                | escritorio |   100 |    100 |      100 | 100 | 0.25 s |   0 |   0 ms | [informe](calidad/lighthouse/formulario-inicio-escritorio.html) |
| Con datos · `/` (materias cargadas) | movil      |   100 |    100 |      100 | 100 | 0.91 s |   0 |  49 ms | [informe](calidad/lighthouse/con-datos-inicio-movil.html)       |
| Con datos · `/` (materias cargadas) | escritorio |   100 |    100 |      100 | 100 | 0.25 s |   0 |   3 ms | [informe](calidad/lighthouse/con-datos-inicio-escritorio.html)  |

Resumen en JSON: [`calidad/lighthouse/resumen.json`](calidad/lighthouse/resumen.json). El rendimiento
varía 1 punto entre ejecuciones (TBT): la pantalla del formulario dio 98 y 99 en dos corridas.

### Core Web Vitals reales (incluye INP)

Lighthouse **no mide INP** en laboratorio. Se midió interactuando con la página en un navegador real
(clics y teclado: cargar ejemplo, escribir notas, agregar corte, cambiar la escala, abrir y cerrar el
diálogo, agregar una materia) con la **CPU 4 veces más lenta**:

| Métrica |                                       Resultado |   Límite |
| ------- | ----------------------------------------------: | -------: |
| LCP     |                                          128 ms | 2 500 ms |
| INP     | **96 ms** (32 interacciones; el INP es la peor) |   200 ms |
| CLS     |                                               0 |      0,1 |

Datos: [`calidad/vitales.json`](calidad/vitales.json). Es una sola corrida en local, sin red
estrangulada: no sustituye a los datos reales de usuarios (percentil 75).

### Antes y después

| Métrica   | Qué se hizo                                                                                                                                                                            | Antes               | Después                   |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------- |
| **CLS**   | El pie de página quedaba a la vista mientras se leían los datos del navegador y saltaba al aparecer la calculadora. La página principal reserva ahora la altura del primer pantallazo. | ver tabla siguiente | **0** en las 6 mediciones |
| LCP / INP | Sin cambios: ya cumplían en la primera medición, así que **no hay «antes» que comparar**.                                                                                              | —                   | 128 ms / 96 ms            |

| Página                              | Perfil     | CLS antes | CLS después |
| ----------------------------------- | ---------- | --------: | ----------: |
| Con formulario · `/`                | movil      |     0,057 |       **0** |
| Con formulario · `/`                | escritorio |     0,018 |       **0** |
| Con datos · `/` (materias cargadas) | movil      |     0,057 |       **0** |
| Con datos · `/` (materias cargadas) | escritorio |     0,062 |       **0** |

El «antes» está guardado en [`resumen-antes-de-corregir-cls.json`](calidad/lighthouse/resumen-antes-de-corregir-cls.json).

## 2 · Responsive: 360 · 768 · 1024 px

- Pruebas de Playwright en los tres anchos (`e2e/calidad.spec.ts`): sin scroll horizontal en `/`,
  `/acerca`, la página 404 y `/` con datos; también **a 320 px** (reflow, WCAG 1.4.10) y a 640 px de
  ancho (equivale a **zoom al 200 %** en una pantalla de 1280 px).
- Todo botón, campo de texto y enlace de navegación mide **≥ 44 × 44 px**; todo el texto visible
  **≥ 16 px**.
- Diseño mobile-first con Grid y Flexbox, `rem`, `clamp()` y `minmax(min(100%, …))`; sin anchos fijos en
  píxeles. Una columna en 360 px, dos en 768 px y 1024 px.
- Capturas (2× de resolución) en [`calidad/capturas/`](calidad/capturas/): `inicio-vacio`,
  `inicio-con-datos`, `inicio-con-datos-oscuro` y `como-se-calcula`, cada una en 360, 768 y 1024.
- **Falta:** probar en un teléfono real, en vertical y horizontal.

## 3 · Accesibilidad (WCAG 2.2 nivel AA)

### Automática

- **axe en el navegador real** (`e2e/calidad.spec.ts`): `/`, `/acerca`, la 404, `/` con datos, con
  errores de validación visibles y con el diálogo abierto, en **4 temas**: claro, oscuro, claro con
  alto contraste y oscuro con alto contraste. **0 violaciones.**
- **axe en Vitest** con Testing Library sobre el componente completo (estado vacío, con datos, con
  errores, editando y con el diálogo abierto): 0 violaciones.
- Informes completos en [`calidad/axe/`](calidad/axe/) (18 archivos). Cada uno trae las reglas
  aprobadas y los puntos **«incompletos»**: axe marcó `color-contrast` como incompleto en 1 elemento
  de `/acerca` y en 6 de `/`. Son **los iconos decorativos** «✓» y «→» (`aria-hidden`), que axe no
  puede evaluar por no ser texto; se verificaron a mano: usan los mismos pares de color ya calculados
  (razones de 6,7:1 o más en claro y oscuro).
- **Contraste calculado:** todos los pares de la paleta se comprobaron con la fórmula WCAG (texto
  ≥ 4,5:1 y bordes de controles ≥ 3:1) en tema claro y oscuro antes de escribir el CSS.
- **Las pruebas no son decorativas.** Se rompió a propósito el contraste, el tamaño del texto y el
  tamaño de los botones: la suite falló en cada caso (5 pruebas de axe con `color-contrast (serious)`,
  la de 16 px y la de 44 px) y luego se restauró.

### Qué se implementó

Enlace «Saltar al contenido»; foco visible de 3 px en todo; `<label>` en cada campo; errores en texto
junto al campo, enlazados con `aria-describedby` y anunciados con `aria-live`; foco movido al primer
error al enviar; `lang="es"`; `<title>` único por ruta; `prefers-reduced-motion`,
`prefers-color-scheme`, `prefers-contrast` y `forced-colors`; estados con icono **y** texto;
`<dialog>` nativo; sin cabeceras fijas que tapen el foco; sin `outline: none`.

### Lista de comprobación manual (con fecha)

Lo automático detecta solo una parte. **Esto lo debe hacer una persona y firmarlo con la fecha:**

| Comprobación                                                    |                  Automático                   | Manual (fecha y quién) |
| --------------------------------------------------------------- | :-------------------------------------------: | ---------------------- |
| Todo se usa solo con teclado, en orden lógico y sin trampas     | ✅ Tab, salto al contenido y contorno de foco | ☐ ____                 |
| Zoom al 200 % del navegador sin perder contenido ni funciones   |      ✅ emulado con el ancho equivalente      | ☐ ____                 |
| **Pasada con lector de pantalla** (NVDA en Windows o VoiceOver) |                 ❌ no se hizo                 | ☐ ____                 |
| Probar en un **teléfono real**                                  |                 ❌ no se hizo                 | ☐ ____                 |
| Validador HTML de W3C                                           |            ✅ vnu local, 0 errores            | —                      |

## 4 · HTML semántico y buenas prácticas

- **Validador HTML de W3C** (Nu, `vnu-jar`): **0 errores y 0 avisos** en el HTML del servidor de `/`,
  `/acerca` y la 404, y en el **DOM ya hidratado** de `/` con datos y el diálogo abierto
  ([`calidad/validador-html/`](calidad/validador-html/)). Los ~30 mensajes «informativos» son todos el
  mismo («barra final en elementos vacíos»), es como React serializa `<meta />` y no es un error.
- Landmarks `header`, `nav`, `main`, `footer`; **un solo `<h1>`** por página y sin saltar niveles;
  `<button>` para acciones y `<a>` para navegar; **cero `<div onClick>`**; sin `!important` salvo la regla
  canónica de movimiento reducido.
- ESLint sin advertencias (`--max-warnings 0`) con `jsx-a11y` de Next; consola sin errores ni
  violaciones de CSP (prueba automática).
- CSS mobile-first con variables y CSS Modules; sin `outline: none`.
- **SEO:** `<title>` y `description` por ruta, Open Graph con imagen generada, `robots.txt`,
  `sitemap.xml`, página 404 propia, favicon (SVG) y JSON-LD (`WebApplication`).
- **Seguridad:** `Content-Security-Policy` (producción), `Strict-Transport-Security`,
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; sin
  `X-Powered-By`. HTTPS lo da Vercel. `npm audit --omit=dev`: 0 vulnerabilidades.
- Fuentes del sistema (sin `next/font`: no hay fuentes web) e imágenes solo SVG/PNG generados, así
  que no hay CLS por imágenes ni por tipografías.

## 5 · Retos de excelencia (elegidos 4; la hoja pide 3)

| Reto                                                                                      | Evidencia y cómo reproducirla                                                                                           |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Prueba en 3 anchos con Playwright**: sin scroll horizontal y 0 violaciones de axe       | `e2e/calidad.spec.ts`. `npm run e2e` (132 pruebas)                                                                      |
| **Pruebas de accesibilidad de componentes** con axe dentro de Vitest y Testing Library    | `src/components/Calculadora.test.tsx` (4 pruebas de axe). `npm test`                                                    |
| **Modo oscuro y alto contraste** sin romper el contraste                                  | axe en 4 temas (claro, oscuro y ambos con alto contraste). `npm run e2e`                                                |
| **Impresión** (`@media print`) y **SEO avanzado** (JSON-LD, sitemap, imágenes Open Graph) | Prueba «al imprimir…» en `e2e/calidad.spec.ts`; `src/app/{sitemap,robots,opengraph-image}` y el JSON-LD de `layout.tsx` |

**No alcanzados** (no se reclaman): «100 en las cuatro categorías de Lighthouse en 3 páginas» (el
formulario dio 99 de rendimiento en una corrida); «JavaScript ≤ 120 kB» (son 151,1 kB); «panel propio de
métricas reales (p75) guardadas por su API»; «funciona sin JavaScript» (la app guarda en el
navegador, así que lo necesita); «español e inglés».

## Cómo reproducirlo todo

```bash
npm ci
npm run check                                                   # typecheck + lint + formato + pruebas
npm run e2e                                                     # 3 anchos, 4 temas, teclado, impresión
CAPTURAS=1 npx playwright test e2e/capturas.spec.ts             # calidad/capturas
INFORMES=1 npx playwright test e2e/informe-axe.spec.ts          # calidad/axe
VITALES=1 npx playwright test e2e/vitales.spec.ts --project=movil-360   # calidad/vitales.json
npm run build && npm run start -- -p 3100                       # y en otra terminal:
npx lighthouse http://localhost:3100/acerca --view              # Lighthouse (móvil por defecto)
```

El validador de W3C se corrió con `vnu-jar` (Java) sobre el HTML descargado de cada ruta.

## Pendiente antes de entregar

1. Desplegar en Vercel y repetir Lighthouse y PageSpeed Insights sobre la **URL pública**.
2. La **pasada con lector de pantalla**, la prueba en **teléfono real** y el teclado/zoom manuales,
   con fecha.
3. Poder **demostrar todo en vivo** en la sustentación.
