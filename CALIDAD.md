# Requisitos de calidad · evidencias

Evidencias de las metas de calidad del documento del proyecto 14 (sección 14): rendimiento,
responsive, accesibilidad, HTML semántico y retos de excelencia. Todo está en
[`calidad/`](calidad/) y se puede **reproducir** con los comandos del final.

> **Dónde se midió.** Las cifras son de la **compilación de producción servida en local**
> (`next start`, en modo demostración, que equivale a una sesión abierta) con Chromium sin cabeza,
> **no de la URL de Vercel** (todavía no se ha desplegado). Hay que repetir Lighthouse y PageSpeed
> Insights sobre la URL pública antes de entregar. Lighthouse usó su perfil por defecto (móvil con
> estrangulamiento simulado de 4G lento y CPU ×4; escritorio sin estrangulamiento). Versión: Lighthouse
> 13.6.0.
>
> **Vigencia.** Todo lo de esta página se **volvió a medir con la versión final** (Hitos 1 a 4:
> `/login`, `/historial`, formularios, menú colapsable): Lighthouse, peso de JavaScript, validador
> W3C, axe, INP, CLS y LCP. Las tres pantallas del Hito 1 se midieron antes; esas cifras ya no se citan.

## Resumen de cumplimiento

| Requisito                                                                    | Resultado                                                                                                                                                                   | Estado               |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| LCP ≤ 2,5 s · INP ≤ 200 ms · CLS ≤ 0,1                                       | LCP 0,25–0,91 s (Lighthouse, móvil y escritorio) y 140 ms con la CPU ×4 · INP **48 ms** · CLS **0**                                                                         | ✅                   |
| Lighthouse móvil: Rend. ≥ 90 · Acces. ≥ 95 · BP ≥ 95 · SEO ≥ 95              | **100 · 100 · 100 · 100** en 5 páginas, móvil y escritorio (10 informes)                                                                                                    | ✅ (local)           |
| Presupuesto: JS ≤ 200 kB y página ≤ 1 MB                                     | JS **184,5–193,5 kB** · página **≤ 214,2 kB** transferidos (360 y 1024 px)                                                                                                  | ✅ (con poco margen) |
| Responsive 360 · 768 · 1024 sin scroll horizontal                            | Playwright en los 3 anchos, también a 320 px y con zoom al 200 % (emulado); la tabla del historial cabe entera desde 320 px                                                 | ✅                   |
| Menú colapsable accesible por teclado en móvil                               | Botón con `aria-expanded`/`aria-controls`, Esc devuelve el foco; pruebas de componente y de navegador                                                                       | ✅                   |
| Objetivos táctiles ≥ 44 × 44 px · texto ≥ 16 px                              | Comprobado por prueba automática sobre botones, campos, enlaces y todo el texto                                                                                             | ✅                   |
| Accesibilidad WCAG 2.2 AA                                                    | axe: **0 violaciones** en 45 informes completos (5 pantallas × 3 temas × 3 anchos, `calidad/axe/`) y en las pruebas de navegador (4 temas × 3 anchos × 6 rutas y 7 estados) | ✅ automático        |
| Revisión manual (teclado real, zoom real, lector de pantalla, teléfono real) | Ver la lista de abajo                                                                                                                                                       | ☐ **pendiente**      |
| HTML válido (validador W3C)                                                  | **0 errores y 0 avisos** en 14 documentos (HTML del servidor y DOM hidratado, con errores visibles, menú abierto y 404)                                                     | ✅                   |
| Retos de excelencia (≥ 3)                                                    | 5 elegidos con evidencia                                                                                                                                                    | ✅                   |

## 1 · Rendimiento y Core Web Vitals

### Lighthouse (móvil y escritorio, 5 páginas)

La hoja pide tres páginas: una **pública**, una **con formulario** y una **con sesión iniciada**. Aquí
se midieron cinco: la pública (`/login`), dos con sesión (`/` y `/historial`) y dos con formulario
(`/materias/…`, el editor de notas, y `/simulador`). En local las páginas con sesión se midieron en
**modo demostración** (no pide sesión y sirve la misma pantalla); sobre la URL pública hay que repetirlas
con la sesión abierta (DevTools → Lighthouse).

| Página                                           | Perfil     | Rend. | Acces. | B. prác. | SEO |    LCP | CLS |   TBT | Informe                                                            |
| ------------------------------------------------ | ---------- | ----: | -----: | -------: | --: | -----: | --: | ----: | ------------------------------------------------------------------ |
| Pública · `/login`                               | movil      |   100 |    100 |      100 | 100 | 0,91 s |   0 | 51 ms | [informe](calidad/lighthouse/publica-login-movil.html)             |
| Pública · `/login`                               | escritorio |   100 |    100 |      100 | 100 | 0,25 s |   0 |  0 ms | [informe](calidad/lighthouse/publica-login-escritorio.html)        |
| Con sesión · `/` (resumen)                       | movil      |   100 |    100 |      100 | 100 | 0,91 s |   0 | 84 ms | [informe](calidad/lighthouse/sesion-resumen-movil.html)            |
| Con sesión · `/` (resumen)                       | escritorio |   100 |    100 |      100 | 100 | 0,25 s |   0 |  0 ms | [informe](calidad/lighthouse/sesion-resumen-escritorio.html)       |
| Con sesión · `/historial`                        | movil      |   100 |    100 |      100 | 100 | 0,91 s |   0 | 33 ms | [informe](calidad/lighthouse/sesion-historial-movil.html)          |
| Con sesión · `/historial`                        | escritorio |   100 |    100 |      100 | 100 | 0,25 s |   0 |  0 ms | [informe](calidad/lighthouse/sesion-historial-escritorio.html)     |
| Con formulario · `/materias/calculo-diferencial` | movil      |   100 |    100 |      100 | 100 | 0,91 s |   0 | 80 ms | [informe](calidad/lighthouse/formulario-materia-movil.html)        |
| Con formulario · `/materias/calculo-diferencial` | escritorio |   100 |    100 |      100 | 100 | 0,25 s |   0 |  0 ms | [informe](calidad/lighthouse/formulario-materia-escritorio.html)   |
| Con formulario · `/simulador`                    | movil      |   100 |    100 |      100 | 100 | 0,91 s |   0 | 50 ms | [informe](calidad/lighthouse/formulario-simulador-movil.html)      |
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
| LCP     |                                          140 ms | 2 500 ms |
| INP     | **48 ms** (34 interacciones; el INP es la peor) |   200 ms |
| CLS     |                                               0 |      0,1 |

El recorrido incluye abrir el menú colapsable y moverse con él, porque es una interacción nueva.

Datos: [`calidad/vitales.json`](calidad/vitales.json). Una sola corrida en local, sin red
estrangulada: no sustituye a datos reales de usuarios (percentil 75).

### Antes y después (en esta versión)

| Métrica                          | Qué pasó                                                                                                                                                                                                                                                                                                      |                      Antes |                      Después |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------: | ---------------------------: |
| **Buenas prácticas**             | Chrome registraba una `kEvalViolation` en su panel de problemas: Zod 4 prueba `new Function('')` para compilar esquemas y, aunque capture el error, el CSP de producción (sin `unsafe-eval`) lo anota. Se configuró `z.config({ jitless: true })`.                                                            |        96 en las 3 páginas |                      **100** |
| **CLS de la cabecera**           | Al añadir el menú de cuenta, la cabecera crecía 52 px cuando llegaba la respuesta de `/api/auth/yo` y empujaba toda la página. Se midió cada salto con su elemento (no a ojo) y se reservó el espacio desde el principio; en sesión real, un correo largo se recorta en una línea para que la fila no crezca. |                 0,044–0,06 |                        **0** |
| **JavaScript transferido**       | Los enlaces de navegación se precargaban al estar a la vista en escritorio y gastaban el presupuesto (198–206 kB). Se desactivó la precarga de esos enlaces. El SDK de Firebase solo se descarga al iniciar sesión.                                                                                           |    198–206 kB (escritorio) |           **184,5–193,5 kB** |
| **Tabla del historial en móvil** | Con 4 columnas se desplazaba dentro de su contenedor a 360 px (y perdía una a 320 px). Los créditos pasaron a la celda del semestre.                                                                                                                                                                          | 328 px de contenido en 286 | **cabe entera desde 320 px** |
| LCP / INP                        | Ya cumplían en la primera medición: no hay «antes» que comparar.                                                                                                                                                                                                                                              |                          — |               140 ms / 48 ms |

El «antes» de buenas prácticas se reproduce haciendo `git checkout e678772` y midiendo; el informe de
esa corrida no se guardó como archivo. La prueba que lo cubre desde entonces es
`e2e/calidad.spec.ts → «ningún problema de CSP en el panel de problemas»`, que **falló antes del
arreglo** y pasa después.

## 2 · Responsive: 360 · 768 · 1024 px

- Pruebas de Playwright en los tres anchos (`e2e/calidad.spec.ts`): sin scroll horizontal en `/`,
  `/simulador`, `/materias/…`, `/historial`, `/login` y la 404; también **a 320 px** (reflow, WCAG
  1.4.10) y a 640 px de ancho (equivale a **zoom al 200 %** en una pantalla de 1280 px).
- **Menú colapsable en móvil** (menos de 768 px): un botón «Menú» con `aria-expanded` y `aria-controls`
  abre la lista; se opera con teclado (Enter/Espacio), **Esc** la cierra y devuelve el foco al botón, y
  también se cierra al elegir un enlace o al mover el foco fuera (para no tapar lo que se enfoca, WCAG
  2.4.11). Se superpone sin empujar el contenido. Desde 768 px los enlaces se ven siempre. Pruebas:
  `src/components/NavegacionPrincipal.test.tsx` y «navegación» en `e2e/calidad.spec.ts`.
- Todo botón, campo, selector, enlace y `<summary>` mide **≥ 44 × 44 px**; todo el texto visible
  **≥ 16 px**.
- Mobile-first con Grid y Flexbox, `rem`, `clamp()` y `minmax(min(100%, …))`; sin anchos fijos en
  píxeles. Una columna en 360 px; el editor de materia pone formulario y resultado lado a lado desde
  tableta; el resumen y las tarjetas usan 1 a 3 columnas según el ancho; la tabla del historial cabe
  entera desde 320 px (los créditos van en la celda del semestre).
- Capturas (2× de resolución) en [`calidad/capturas/`](calidad/capturas/): `resumen`, `materia`,
  `materia-con-error`, `simulador`, `historial`, `login`, `error-con-reintento`, `resumen-oscuro` e
  `historial-oscuro`, cada una en 360, 768 y 1024, y `menu-abierto-360`.
- **Falta:** probar en un teléfono real, en vertical y horizontal.

## 3 · Accesibilidad (WCAG 2.2 nivel AA)

### Automática

- **axe en el navegador real** (`e2e/calidad.spec.ts`): las 6 rutas (con `/historial` y `/login`) más
  los estados de **error con reintento, vacío, sesión vencida, errores de validación, diálogo de
  eliminar, formularios abiertos y menú abierto**, en **4 temas** (claro, oscuro y ambos con alto
  contraste) y los 3 anchos. **0 violaciones.**
- **axe en Vitest** con Testing Library (`src/components/accesibilidad.test.tsx`,
  `NavegacionPrincipal.test.tsx`, `FormularioLogin.test.tsx`): carga, resumen con el formulario de
  materia abierto, error, sesión vencida, vacío, editor con y sin errores, simulador, historial con un
  semestre en edición, inicio de sesión y menú abierto y cerrado. 0 violaciones.
- Informes completos en [`calidad/axe/`](calidad/axe/) (45 archivos) con las reglas aprobadas y los
  puntos **«incompletos»**: axe marcó `color-contrast` como incompleto en hasta 9 elementos de `/`,
  4 de `/materias/…`, 3 de `/simulador`, 2 de `/historial` y 2 de `/login`. Son **los iconos decorativos**
  «✓», «→» y «☰» (`aria-hidden`; el mensaje de axe es «el contenido solo tiene caracteres que no son
  texto»). Se listaron elemento por elemento y se verificaron a mano: usan los mismos pares de color ya
  calculados (6,7:1 o más en claro y oscuro).
- **Contraste calculado** con la fórmula WCAG para todos los pares de la paleta (texto ≥ 4,5:1 y bordes
  de controles ≥ 3:1) antes de escribir el CSS.
- **Las pruebas no son decorativas.** Se rompió a propósito el contraste, el tamaño del texto y el de
  los botones y la suite falló en cada caso; y la del CSP **falló antes** del arreglo de Zod.

### Qué se implementó

Enlace «Saltar al contenido»; foco visible de 3 px; `<label>` en cada campo; `<fieldset>/<legend>` por
nota; errores en texto junto al campo, enlazados con `aria-describedby`, anunciados con `aria-live` y
reflejados en la validación nativa (`setCustomValidity`); `lang="es"`; `<title>` único por ruta;
`prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast` y `forced-colors`; estados con
icono y texto (también el cambio de promedio entre semestres: «▲ Sube 0,63», no solo color); `<dialog>`
y `<details>` nativos; sin cabeceras fijas que tapen el foco. **Inicio de sesión:** `autocomplete`
(`email`, `current-password`, `new-password`), la contraseña admite pegar y gestor de contraseñas
(WCAG 3.3.8), y los errores de la cuenta no revelan si el correo existe. **Navegación:** menú
colapsable con el patrón _disclosure_ (ver la sección 2).

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

- **Validador HTML de W3C** (Nu, `vnu-jar`): **0 errores y 0 avisos** en 14 documentos: el HTML del
  servidor de `/login`, `/` y `/historial` y el **DOM ya hidratado** de `/login` (también con errores
  de validación), `/` (también con el formulario de materia abierto y con error), `/materias/…`
  (también con un error de validación visible), `/simulador`, `/historial` (también con el formulario
  de semestre y sus errores), la 404 y la vista móvil con el **menú abierto**
  ([`calidad/validador-html/`](calidad/validador-html/)). Los mensajes «informativos» del HTML del
  servidor (31–33 por documento) son todos el mismo («barra final en elementos vacíos»): así serializa
  React `<meta />`, no es un error.
- Landmarks `header`, `nav`, `main`, `footer`; **un solo `<h1>`** por página y sin saltar niveles;
  `<button>` para acciones y `<a>` para navegar; **cero `<div onClick>`**; sin `!important` salvo la
  regla canónica de movimiento reducido y la de impresión.
- ESLint sin advertencias (`--max-warnings 0`) con `jsx-a11y`; consola **y panel de problemas de
  Chrome** sin errores ni violaciones de CSP (pruebas automáticas).
- **SEO:** `<title>` y `description` por ruta, Open Graph con imagen generada, `robots.txt`,
  `sitemap.xml` (solo lo público: `/login`; las demás pantallas son privadas), `Disallow: /api/` en
  `robots.txt`, página 404 propia, favicon (SVG) y JSON-LD (`WebApplication`).
- **Seguridad:** `Content-Security-Policy` (producción, sin `unsafe-eval`), `Strict-Transport-Security`,
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; sin
  `X-Powered-By`. Errores de la API sin detalles internos y **nunca cacheados**. Registro por petición
  sin datos sensibles. `npm audit --omit=dev`: 0 vulnerabilidades. **Sesión y autorización:** cookie
  `HttpOnly` + `SameSite=Lax` (+ `Secure` en producción) creada con el Admin SDK; verificación en
  cada petición (`verifySessionCookie(…, true)`); comprobación de `Origin` (CSRF); límite de
  frecuencia con `429` + `Retry-After`; roles por _custom claim_; aislamiento por `uid` con pruebas
  de dos usuarios; Firestore cerrado con `firestore.rules`. Los detalles están en el `README`.
- Fuentes del sistema (sin `next/font`: no hay fuentes web) e imágenes solo SVG/PNG generados.

## 5 · Retos de excelencia (elegidos 5; la hoja pide 3)

| Reto                                                                                      | Evidencia y cómo reproducirla                                                                                           |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **100 en las cuatro categorías de Lighthouse** (móvil) en 5 páginas                       | Tabla de arriba y `calidad/lighthouse/`. **En local**: repetir sobre Vercel antes de reclamarlo                         |
| **Prueba en 3 anchos con Playwright**: sin scroll horizontal y 0 violaciones de axe       | `e2e/calidad.spec.ts`. `npm run e2e`                                                                                    |
| **Pruebas de accesibilidad de componentes** con axe dentro de Vitest y Testing Library    | `src/components/accesibilidad.test.tsx`. `npm test`                                                                     |
| **Modo oscuro y alto contraste** sin romper el contraste                                  | axe en 4 temas (claro, oscuro y ambos con alto contraste). `npm run e2e`                                                |
| **Impresión** (`@media print`) y **SEO avanzado** (JSON-LD, sitemap, imágenes Open Graph) | Prueba «al imprimir…» en `e2e/calidad.spec.ts`; `src/app/{sitemap,robots,opengraph-image}` y el JSON-LD de `layout.tsx` |

**No alcanzados** (no se reclaman): «JavaScript ≤ 120 kB» (son 184,5–193,5 kB); «panel propio de
métricas reales (p75) guardadas por su API»; «funciona sin JavaScript» (los datos llegan por `fetch`);
«navegación accesible probada con lector de pantalla»; «español e inglés».

## Cómo reproducirlo todo

```bash
npm ci
npm run check                                                   # typecheck + lint + formato + pruebas
npm run e2e                                                     # 3 anchos, 4 temas, flujos, API, inicio de sesión
CAPTURAS=1 INFORMES=1 npx playwright test e2e/capturas.spec.ts e2e/informe-axe.spec.ts
VITALES=1 npx playwright test e2e/vitales.spec.ts --project=movil-360
npm run build && MODO_DEMO=1 npm run start -- -p 3100           # y en otra terminal:
npx lighthouse http://localhost:3100/login --view               # Lighthouse (móvil por defecto)
```

El validador de W3C se corrió con `vnu-jar` (Java) sobre el HTML del servidor y el DOM hidratado de cada
ruta y estado; Lighthouse 13.6.0 y `vnu-jar` se usaron **sin instalarlos en el proyecto**.

## Pendiente antes de entregar

1. Desplegar en Vercel y repetir Lighthouse y PageSpeed Insights sobre la **URL pública**, incluida
   `/historial` con la sesión abierta (la guía está en `docs/FIREBASE-Y-VERCEL.md`).
2. La **pasada con lector de pantalla**, la prueba en **teléfono real** y el teclado/zoom manuales, con fecha.
3. Probar el inicio de sesión y los datos **con cuentas reales de Firebase** (hoy se probó el SDK web con
   la red de Google interceptada y el Admin SDK con una clave de prueba).
4. Poder **demostrar todo en vivo** en la sustentación.
