# 14 · Calculadora de promedio académico

Registra materias y notas por corte, calcula el promedio y simula **«¿qué nota necesito para
aprobar?»**. Un solo proyecto Next.js (App Router, React 19, TypeScript) con la interfaz y la API.

> **Estado: Hito 1** (semana 4) del documento del proyecto. Hoy usa un **semestre de ejemplo**
> detrás de una API y un repositorio; Firestore (Hito 3) y Firebase Auth (Hito 4) son lo siguiente.
> La tabla de cumplimiento está más abajo, con lo que falta dicho sin rodeos.

## Cómo correrlo

No hay que usar un editor concreto: son comandos de terminal desde la **carpeta raíz del proyecto**
(donde está `package.json`). Sirve la terminal integrada de **Visual Studio Code**
(`File → Open Folder` y `` Ctrl+` ``). Requiere Node 20.9 o superior.

```bash
npm ci
npm run dev        # http://localhost:3000
```

- **Windows:** la configuración de IA usa un sandbox que no existe en Windows nativo. Trabaje en
  **WSL2**: en VS Code, extensión «WSL» → `Open Folder in WSL` y use esa terminal. Abra Claude Code
  siempre en la raíz del repositorio.
- Para las pruebas de navegador, una sola vez: `npx playwright install chromium`.
- Opcional: `cp env.example .env.local` (solo define `NEXT_PUBLIC_SITE_URL`). **Nunca** suba `.env.local`.

## Rutas y API

| Ruta             | Qué muestra                                                                       |
| ---------------- | --------------------------------------------------------------------------------- |
| `/`              | Resumen del semestre: promedio ponderado por créditos y estado de cada materia    |
| `/materias/[id]` | Notas y porcentajes de una materia; el resultado se actualiza mientras se escribe |
| `/simulador`     | ¿Qué nota necesito? Para una materia y una meta de 3,0 a 5,0                      |

| API                                     | Respuesta                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `GET /api/semestres/:id`                | `200` semestre con sus materias · `404` · `400` identificador inválido          |
| `GET /api/semestres/:id/resumen?meta=4` | Promedios calculados en el servidor con enteros · `400` si la meta no es válida |

Error siempre `{ "error": "…", "detalles"?: [{ "campo": "…", "mensaje": "…" }] }`. Un `500` nunca
revela mensajes internos. Las lecturas correctas son cacheables; los errores, nunca.

## Scripts

| Comando         | Qué hace                                                                              |
| --------------- | ------------------------------------------------------------------------------------- |
| `npm run check` | `typecheck` + `lint` + `format:check` + `test`. **Si no pasa, no está terminado.**    |
| `npm test`      | Vitest con cobertura (80 %; 90 % en `schemas` y `services`) y `node:test` del hook    |
| `npm run e2e`   | Playwright en 360, 768 y 1024 px con axe (compila y levanta la app en el puerto 3100) |
| `npm run build` | Compilación de producción                                                             |

## Estructura y capas

```text
src/schemas/       esquemas Zod compartidos por el formulario y la API (las reglas, una sola vez)
src/services/      reglas de negocio puras: cálculo con enteros, estados, simulador
src/repositories/  único acceso a los datos (hoy ejemplo; Hito 3: Firestore con el Admin SDK)
src/lib/           errores, manejar() de la API, cliente de la API, formato
src/app/api/       Route Handlers: HTTP y validación → servicio → repositorio
src/storage/       único módulo que toca localStorage (borrador)
src/hooks/         useSemestre (fetch), useBorrador, useSemestreActual
src/components/    interfaz (CSS Modules); contenedores de datos y componentes de presentación
src/app/           páginas, loading, error, not-found, metadatos, sitemap
e2e/               Playwright + axe · calidad/ evidencias · ia/ y .claude/ configuración de IA
```

## Decisiones de diseño

- **Aritmética en enteros.** Notas en décimas y porcentajes en décimas de punto: `3,3 × 30 % + 2,7 × 30 %`
  nunca pasa por coma flotante. Los resultados se **truncan** a 2 decimales (2,996 se ve «2,99», no
  «3,00»), así lo que se ve coincide con lo que se decide.
- **La nota necesaria sube a la décima siguiente** (una nota válida, con un decimal) y es la más baja
  que de verdad alcanza. Si pasa de 5,0, la meta se avisa como «ya no es alcanzable».
- **Estados:** _aprobando_ (lo evaluado promedia 3,0 o más), _en riesgo_ (menos de 3,0 pero aún se
  puede aprobar) y _perdida_ (ni con 5,0 en lo que falta). Un icono y un texto acompañan al color.
- **Los porcentajes no pasan de 100 %.** Lo que falta hasta 100 % es lo pendiente; no hace falta
  registrar una nota para cada corte.
- **Borrador en `localStorage` mientras no hay sesión.** Lo que se lee se valida con el mismo esquema
  Zod; si está corrupto se ignora. Cuando haya Firestore, el borrador servirá solo sin sesión.
- **Estado derivado:** los promedios se calculan con `useMemo`, no se guardan.
- **Zod en modo `jitless`:** el CSP de producción no permite `unsafe-eval` y Zod, por defecto, prueba
  `new Function` (Chrome lo registraba como violación de CSP).
- **Sin fuentes web** (pila del sistema) y **`<dialog>`/`<details>` nativos**.
- **Los números se escriben con punto** en `<input type="number">` en navegadores en inglés y con
  coma en los de español: el valor que llega a la aplicación es siempre el mismo.

## Cumplimiento del documento del proyecto

| Sección                                                                     | Estado                                                                                                                      |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| RF-02 promedio ponderado · RF-03 simulador · RF-04 estados                  | ✅                                                                                                                          |
| RF-06 imprimir el resumen                                                   | ✅ `window.print()` con alternativa                                                                                         |
| RF-01 CRUD de semestres, materias y notas                                   | 🟡 solo se editan las notas de las materias; crear/borrar semestres y materias es del Hito 2                                |
| RF-05 comparar semestres · ruta `/historial`                                | ❌ Hito 2                                                                                                                   |
| Criterios de aceptación 1 a 4                                               | ✅ pruebas unitarias, de componentes, de API y de navegador                                                                 |
| Validación (nota 0,0–5,0 con un decimal, porcentajes ≤ 100 %, meta 3,0–5,0) | ✅ esquemas Zod compartidos, modo estricto                                                                                  |
| Estados de interfaz: carga, vacío, error y reintento                        | ✅ con `aria-live`                                                                                                          |
| APIs del navegador (≥ 2)                                                    | ✅ Constraint Validation API, `localStorage`, `window.print()`                                                              |
| React/Next (≥ 3 técnicas)                                                   | ✅ estado derivado con `useMemo`, formularios controlados con validación cruzada, contenedores y presentación               |
| Pruebas: lógica (6 casos), RTL, API (400/404), integración                  | ✅ · **falta** `401` (llega con la autenticación) y «guardar una nota de 5,5 → 400» (necesita la ruta de escritura, Hito 3) |
| Firestore, Auth con cookie de sesión, roles, `proxy.ts`                     | ❌ Hitos 3 y 4                                                                                                              |
| `openapi.yaml` y colección Bruno/Postman                                    | ❌ Hito 3                                                                                                                   |
| Despliegue en Vercel y URL pública                                          | ❌ Hito 4                                                                                                                   |
| Seguridad: cabeceras, CSP, errores sin detalles, `npm audit`                | ✅ (ver `CALIDAD.md`); rate limiting, CSRF por `Origin` y cookie de sesión son de los Hitos 3 y 4                           |
| Metas de calidad (sección 14) y configuración de IA (sección 15)            | ✅ con evidencias en `CALIDAD.md` e `IA.md`; faltan las comprobaciones que solo una persona puede hacer                     |

El documento muestra una carpeta `tests/`; aquí cada prueba vive junto a lo que prueba
(`*.test.ts(x)`), y las de navegador en `e2e/`.

## Dependencias (cada una justificada)

**Producción**

| Paquete                      | Por qué                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `next`, `react`, `react-dom` | Framework, rutas, Route Handlers e interfaz                                            |
| `zod`                        | Esquemas de validación compartidos por el cliente y el servidor (lo pide el documento) |

**Desarrollo**

| Paquete                                                                  | Por qué                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `typescript` (5.9), `@types/*`                                           | Tipado estricto. TypeScript 5.9 porque `typescript-eslint` aún no admite TS 7         |
| `eslint` (9), `eslint-config-next`, `eslint-config-prettier`, `prettier` | Lint con las reglas de la hoja (complejidad, tamaño de función, `jsx-a11y`) y formato |
| `vitest`, `@vitest/coverage-v8`, `vite`, `@vitejs/plugin-react`, `jsdom` | Pruebas con umbral de cobertura (`vite` explícito porque el plugin lo exige)          |
| `@testing-library/react`, `/dom`, `/user-event`, `/jest-dom`             | Probar por rol y etiqueta, como lo haría una persona                                  |
| `axe-core`                                                               | Accesibilidad dentro de Vitest                                                        |
| `@playwright/test`, `@axe-core/playwright`                               | Pruebas en navegador real a 3 anchos, con axe                                         |
| `husky`, `lint-staged`                                                   | Revisar lo modificado al hacer commit y `npm run check` al hacer push                 |

Herramientas que se usan **sin instalarlas** en el proyecto: Lighthouse, `puppeteer-core` y `vnu-jar`
(validador HTML de W3C).

## Calidad, IA y despliegue

- Requisitos de calidad y sus evidencias: [`CALIDAD.md`](CALIDAD.md).
- Configuración de IA, pruebas de contención y bitácora: [`IA.md`](IA.md).
- **No se ha desplegado en Vercel**: las mediciones son de la compilación de producción en local y
  deben repetirse sobre la URL pública (PageSpeed Insights).
- **Dependencias con avisos:** `npm audit --omit=dev` da 0. Las alertas «altas» de desarrollo son un
  solo aviso de `picomatch ≤ 4.0.7`, sin versión corregida publicada; la CI las muestra sin bloquear.
