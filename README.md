# 14 · Calculadora de promedio académico

Registra semestres, materias y notas por corte, calcula el promedio ponderado por créditos y simula
**«¿qué nota necesito para aprobar?»**. Un solo proyecto Next.js (App Router, React 19, TypeScript)
con la interfaz y la API; los datos viven en **Firestore** (solo desde el servidor) y el acceso es
con **Firebase Auth** y una **cookie de sesión**.

> **Estado: Hitos 1 a 4 en el código.** Lo que no se puede comprobar sin su cuenta (Firebase, Vercel,
> GitHub) está en [«Lo que falta por hacer»](#lo-que-falta-por-hacer-y-solo-usted-puede-hacer),
> dicho sin rodeos. La tabla de cumplimiento más abajo dice qué está probado y cómo.

## Cómo correrlo

No hay que usar un editor concreto: son comandos de terminal desde la **carpeta raíz del proyecto**
(donde está `package.json`). Sirve la terminal integrada de **Visual Studio Code**
(`File → Open Folder` y `` Ctrl+` ``). Requiere Node 22.12 o superior.

```bash
npm ci
npm run dev        # http://localhost:3000
```

En Windows con PowerShell, si `npm` falla por la política de scripts, use `npm.cmd ci` y `npm.cmd run dev`.

### Dos modos

| Modo                | Cuándo                                       | Qué pasa                                                                                              |
| ------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Demostración**    | `npm run dev` sin Firebase, o `MODO_DEMO=1`  | Sin cuentas: una persona fija y datos **en memoria** (con el semestre de ejemplo). Ideal para probar. |
| **Firebase (real)** | Con las variables de `env.example` definidas | Inicio de sesión, cookie de sesión, datos en Firestore, rutas privadas.                               |

En producción, **sin Firebase y sin `MODO_DEMO=1` la API se cierra** (responde `503`): nunca queda
abierta por olvido. Y al revés: en producción, **con** credenciales de Firebase, `MODO_DEMO=1` se
**ignora** (un valor olvidado en Vercel no puede saltarse el inicio de sesión).

### Crear Firebase, conectarlo y publicar en Vercel

La guía paso a paso (con capturas de lo que se espera ver, tabla de errores y comprobaciones de
producción) está en **[`docs/FIREBASE-Y-VERCEL.md`](docs/FIREBASE-Y-VERCEL.md)**. En resumen:

1. Proyecto de Firebase → **Authentication** con correo y contraseña → **Firestore** en modo producción
   con las reglas de `firestore.rules` (todo cerrado) → app **Web** (4 valores públicos) → **cuenta de
   servicio** (3 valores secretos).
2. `.env.local` desde `env.example` (**nunca** a Git) y `npm run dev`.
3. Roles: `node --env-file=.env.local scripts/asignar-rol.mjs correo@ejemplo.com admin`.
4. GitHub (`git remote add origin …` y `git push -u origin main`) → importar en **Vercel** con las
   mismas 8 variables → agregar el dominio de Vercel en **Authentication → Dominios autorizados**.

### Pruebas de navegador

Una sola vez: `npx playwright install chromium`. Las pruebas de navegador corren siempre en modo
demostración (`playwright.config.ts` define `MODO_DEMO=1`): no necesitan Firebase.

## Rutas

| Ruta             | Qué muestra                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `/`              | Resumen del semestre elegido: promedio ponderado, estado de cada materia, agregar una materia |
| `/materias/[id]` | Notas y porcentajes de una materia; **guardado explícito** con borrador local                 |
| `/simulador`     | ¿Qué nota necesito? Para una materia y una meta de 3,0 a 5,0                                  |
| `/historial`     | Promedio de todos los semestres, comparación entre dos y crear/editar/eliminar semestres      |
| `/login`         | Entrar o crear cuenta (Firebase Auth en el navegador; la sesión es una cookie HttpOnly)       |

El semestre activo va en la dirección (`?semestre=<id>`) y se conserva al moverse por la navegación.
`proxy.ts` solo **redirige** a `/login` si no hay cookie: la seguridad real está en la API.

## API REST

El contrato completo está en [`openapi.yaml`](openapi.yaml) y la colección de pruebas en
[`bruno/`](bruno/LEEME.md) (registro de sesión y 200, 400, 401, 403 y 404 por ruta principal).

| Método y ruta                              | Qué hace                                                     |
| ------------------------------------------ | ------------------------------------------------------------ |
| `GET /api/semestres?limite=&cursor=`       | Lista paginada por cursor (más reciente primero)             |
| `POST /api/semestres`                      | Crea un semestre (máximo 20 por cuenta → `409`)              |
| `GET · PUT · DELETE /api/semestres/:id`    | Lee, cambia nombre y meta, elimina (con sus materias)        |
| `GET /api/semestres/:id/resumen?meta=`     | Promedios calculados en el servidor con enteros              |
| `GET · POST /api/semestres/:id/materias`   | Lista paginada (cursor) · crea una (máximo 30 → `409`)       |
| `GET · PUT · DELETE …/materias/:materiaId` | Lee, reemplaza (nombre, créditos y notas) o elimina          |
| `POST /api/ejemplo`                        | Copia el semestre de ejemplo a la cuenta (`409` si ya está)  |
| `POST · DELETE /api/auth/sesion`           | `idToken` → cookie de sesión (`204`) · cierra sesión (`204`) |
| `GET /api/auth/yo`                         | `200 { usuario: { uid, correo, rol } }` o `401`              |
| `GET /api/admin/usuarios/:uid/semestres`   | Solo rol `admin`; un estudiante recibe `403`                 |

Códigos: `200/201/204`, `400` (con detalle por campo), `401` (sin sesión o sesión inválida),
`403` (rol o `Origin` ajeno), `404`, `409` (límites), `413`, `415`, `429` (con `Retry-After`).
Error siempre `{ "error": "…", "detalles"?: [{ "campo": "…", "mensaje": "…" }] }`. Un `500` nunca revela
mensajes internos. **Todo es privado: `Cache-Control: no-store`** también en los errores.

## Seguridad

- **La persona sale siempre de la sesión verificada** (`requerirUsuario`): cookie `sesion` o
  `Authorization: Bearer` (Bruno/Postman). Ningún cuerpo ni ruta recibe un `uid`.
- **Aislamiento entre personas:** todo cuelga de `usuarios/{uid}/…`. El semestre ajeno responde `404`
  (no se revela que existe). Hay pruebas con dos usuarios.
- **Cookie:** `HttpOnly`, `Secure` en producción, `SameSite=Lax`, 5 días. Se crea con
  `createSessionCookie` solo si el `idToken` es reciente (≤ 5 min); `verifySessionCookie(…, true)`
  comprueba además que no esté revocada. Cerrar sesión revoca los tokens.
- **CSRF:** las escrituras exigen `Origin` igual al sitio (o `Bearer`); si no, `403`. Más `SameSite=Lax`.
- **Límite de frecuencia:** 60 escrituras/min por IP y ruta, 30/min para la sesión → `429` con
  `Retry-After`. Es por instancia (en memoria); para un límite global use el Firewall de Vercel.
- **Roles:** _custom claim_ `rol` (`estudiante` por defecto, `admin`). Se comprueba en el servidor.
  Se asigna con `scripts/asignar-rol.mjs` (la consola de Firebase no permite poner claims).
- **Modo demostración cerrado en producción** si hay credenciales de Firebase; si no hay ninguna, la
  API responde `503` en vez de quedar abierta.
- **Registro de errores sin datos:** una línea JSON por petición (id, método, ruta, estado, duración);
  un `500` anota solo el tipo y el código del error, nunca su mensaje ni claves.
- **Firestore cerrado:** `firestore.rules` niega todo; solo el Admin SDK (servidor) lee y escribe.
  La clave privada nunca llega al navegador (no tiene prefijo `NEXT_PUBLIC_`).
- **Validación:** esquemas Zod estrictos compartidos con los formularios; cuerpo máximo de 100 000
  caracteres; identificadores que no pueden salir de su ruta.
- **Sin sesión guardada en el navegador:** Firebase Auth usa persistencia en memoria; el único
  almacenamiento local es el borrador de una materia.

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
src/services/      reglas de negocio: cálculo con enteros, estados, simulador, CRUD con límites
src/repositories/  único acceso a los datos: almacén en memoria o Firestore, siempre bajo usuarios/{uid}
src/lib/           sesión (auth.ts), configuración, errores, manejar() de la API, cliente de la API
src/proxy.ts       redirige a /login si no hay cookie (comodidad, no seguridad)
src/app/api/       Route Handlers: HTTP y validación → servicio → repositorio
src/storage/       único módulo que toca localStorage (borrador de una materia)
src/hooks/         useSemestres (fetch + acciones), useEdicionMateria, useBorrador, useUsuario
src/components/    interfaz (CSS Modules); contenedores de datos y componentes de presentación
src/app/           páginas, loading, error, not-found, metadatos, sitemap
scripts/           asignar-rol.mjs (rol de admin) y verificar-commit.mjs
docs/              FIREBASE-Y-VERCEL.md (guía paso a paso)
openapi.yaml · bruno/ · firestore.rules · firebase.json   contrato, solicitudes y reglas de Firestore
e2e/               Playwright + axe · calidad/ evidencias · ia/ y .claude/ configuración de IA
```

## Decisiones de diseño

- **Aritmética en enteros.** Notas en décimas y porcentajes en décimas de punto: `3,3 × 30 % + 2,7 × 30 %`
  nunca pasa por coma flotante. Los resultados se **truncan** a 2 decimales (2,996 se ve «2,99», no
  «3,00»), así lo que se ve coincide con lo que se decide. La diferencia entre semestres se hace en
  centésimas enteras.
- **La nota necesaria sube a la décima siguiente** (una nota válida, con un decimal) y es la más baja
  que de verdad alcanza. Si pasa de 5,0, la meta se avisa como «ya no es alcanzable».
- **Estados:** _aprobando_ (lo evaluado promedia 3,0 o más), _en riesgo_ (menos de 3,0 pero aún se
  puede aprobar) y _perdida_ (ni con 5,0 en lo que falta). Un icono y un texto acompañan al color.
- **Guardado explícito.** Escribir actualiza el resultado al instante pero no envía nada: «Guardar
  cambios» lleva la materia completa a la cuenta. Lo escrito queda como **borrador** en `localStorage`
  (validado con el mismo Zod; si está corrupto se ignora) para no perderlo si se cierra la pestaña.
- **Un almacén, dos implementaciones.** El repositorio habla con una interfaz mínima de documentos:
  en memoria (demostración y pruebas) y Firestore. La lógica se prueba una vez; el adaptador de
  Firestore se prueba con un doble sin red.
- **Las pruebas de interfaz usan los Route Handlers reales** (con repositorio en memoria): la pantalla
  y la API se prueban juntas y no pueden separarse sin que una prueba falle.
- **`openapi.yaml` se prueba contra el código:** cada operación documentada tiene su Route Handler y
  cada Route Handler está documentado (`src/app/api/openapi.test.ts`).
- **Navegación accesible en móvil.** Menos de 768 px: un botón «Menú» (`aria-expanded` y
  `aria-controls`, patrón _disclosure_ del WAI) abre la lista; **Esc** la cierra y devuelve el foco al
  botón, y también se cierra al elegir un enlace o al mover el foco fuera. Desde 768 px los enlaces se
  ven siempre. La lista se superpone (no empuja el contenido) y la cabecera reserva el espacio de la
  cuenta desde el principio: sin saltos de diseño. Los enlaces de la navegación no se precargan, para
  no gastar el presupuesto de 200 kB de JavaScript.
- **Los topes (20 semestres, 30 materias) no son atómicos.** Se comprueban leyendo antes de escribir:
  dos peticiones simultáneas podrían pasarse por uno. Para exactitud haría falta una transacción con
  un contador; con el límite de frecuencia y el uso previsto se aceptó el riesgo.
- **Cada carga lee todos los semestres con sus materias** (≈ 1 + n lecturas por semestre). Basta para el
  uso del curso (hasta 20 semestres); si creciera, se paginaría o se guardaría un resumen.
- **Estado derivado:** los promedios se calculan con `useMemo`, no se guardan.
- **Zod en modo `jitless`:** el CSP de producción no permite `unsafe-eval` y Zod, por defecto, prueba
  `new Function` (Chrome lo registraba como violación de CSP).
- **Sin fuentes web** (pila del sistema) y **`<dialog>`/`<details>` nativos**.
- **Los números se escriben con punto** en `<input type="number">` en navegadores en inglés y con
  coma en los de español: el valor que llega a la aplicación es siempre el mismo.

## Cumplimiento del documento del proyecto

| Sección                                                                      | Estado                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF-01 CRUD de semestres, materias y notas                                    | ✅ UI, API y pruebas (RTL con la API real + e2e)                                                                                                                                                          |
| RF-02 promedio ponderado · RF-03 simulador · RF-04 estados                   | ✅                                                                                                                                                                                                        |
| RF-05 comparar semestres · ruta `/historial`                                 | ✅ tabla con el cambio respecto al anterior y comparador de dos semestres                                                                                                                                 |
| RF-06 imprimir el resumen                                                    | ✅ `window.print()` con alternativa                                                                                                                                                                       |
| Criterios de aceptación 1 a 4                                                | ✅ unitarias, componentes, API (por ruta) y navegador                                                                                                                                                     |
| Validación (nota 0,0–5,0 con un decimal, porcentajes ≤ 100 %, meta 3,0–5,0)  | ✅ esquemas Zod compartidos, modo estricto; «guardar una nota de 5,5 → 400» probado en API, interfaz y navegador                                                                                          |
| Estados de interfaz: carga, vacío, error, reintento y sesión vencida         | ✅ con `aria-live`                                                                                                                                                                                        |
| APIs del navegador (≥ 2)                                                     | ✅ Constraint Validation API, `localStorage`, `window.print()`                                                                                                                                            |
| React/Next (≥ 3 técnicas)                                                    | ✅ estado derivado con `useMemo`, formularios controlados con validación cruzada, contenedores y presentación, `Suspense`                                                                                 |
| Pruebas: lógica, RTL, API (200/201/204/400/401/403/404/409/429), integración | ✅ dos usuarios, cookie y Bearer, CSRF, límite de frecuencia                                                                                                                                              |
| REST con Firestore, paginación por cursor (semestres y materias), límites    | ✅ adaptador probado con doble y comprobado contra los tipos del SDK; **falta** probarlo con su proyecto de Firebase                                                                                      |
| Auth con cookie de sesión, roles, `proxy.ts`                                 | ✅ `204` y `{ usuario }` como pide el documento; el SDK web corre en el navegador con la red de Google interceptada y el Admin SDK arranca con una clave de prueba; **falta** probarlo con cuentas reales |
| Menú colapsable accesible por teclado a 360 px (sección 14.2)                | ✅ botón con `aria-expanded`, Esc y foco; pruebas de componente y de navegador                                                                                                                            |
| `openapi.yaml` y colección Bruno                                             | ✅ `openapi.yaml` verificado contra las rutas; Bruno por ruta principal                                                                                                                                   |
| Despliegue en Vercel y URL pública                                           | ❌ **lo hace usted** (ver abajo)                                                                                                                                                                          |
| Seguridad: cabeceras, CSP, errores sin detalles, `npm audit`, CSRF, límite   | ✅ (ver `CALIDAD.md`)                                                                                                                                                                                     |
| Metas de calidad (sección 14) y configuración de IA (sección 15)             | ✅ con evidencias en `CALIDAD.md` e `IA.md`; faltan las comprobaciones que solo una persona puede hacer                                                                                                   |

El documento muestra una carpeta `tests/`; aquí cada prueba vive junto a lo que prueba
(`*.test.ts(x)`), y las de navegador en `e2e/`.

## Lo que falta por hacer (y solo usted puede hacer)

Esto no se pudo comprobar en el entorno donde se escribió el código, y no se afirma que funcione. La
guía **[`docs/FIREBASE-Y-VERCEL.md`](docs/FIREBASE-Y-VERCEL.md)** lleva cada paso con su comprobación:

1. **Probar con Firebase de verdad:** crear el proyecto, definir `.env.local`, crear dos cuentas en
   `/login`, comprobar que cada una ve solo lo suyo y que los datos aparecen en Firestore.
2. **Subir el código a GitHub** y **desplegar en Vercel** con las mismas variables (sin `MODO_DEMO`);
   agregar el dominio de Vercel en Firebase → Authentication → **Dominios autorizados**.
3. **Comprobar en producción** `GET /api/auth/yo` (401 sin sesión, 200 con ella) y el flujo de inicio de
   sesión, como pide el documento.
4. **Repetir Lighthouse y PageSpeed Insights sobre la URL pública** (incluida una página con la sesión
   abierta) y anotar los resultados en `CALIDAD.md`.
5. **Revisiones manuales** (lector de pantalla, teléfono real) y las **10 pruebas de contención de la
   IA**: están como plantillas en `CALIDAD.md` e `ia/`.
6. **Poner su nombre y correo en git** (`git config`) para los commits que haga usted; el historial
   actual está a nombre de «Claude» con la línea `Co-Authored-By`, que es lo que refleja la bitácora de IA.

## Dependencias (cada una justificada)

**Producción**

| Paquete                           | Por qué                                                                                                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `next`, `react`, `react-dom`      | Framework, rutas, Route Handlers e interfaz                                                                                                                                         |
| `zod`                             | Esquemas de validación compartidos por el cliente y el servidor (lo pide el documento)                                                                                              |
| `firebase-admin`                  | **Solo servidor:** Firestore y verificación de sesiones. La clave privada nunca llega al navegador                                                                                  |
| `@firebase/app`, `@firebase/auth` | **Solo en `/login`:** inicio de sesión. Se usan los módulos sueltos, no el paquete `firebase`, que arrastra Firestore para el navegador (y avisos de seguridad) que no se necesitan |

**Desarrollo**

| Paquete                                                                  | Por qué                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `typescript` (5.9), `@types/*`                                           | Tipado estricto. TypeScript 5.9 porque `typescript-eslint` aún no admite TS 7         |
| `eslint` (9), `eslint-config-next`, `eslint-config-prettier`, `prettier` | Lint con las reglas de la hoja (complejidad, tamaño de función, `jsx-a11y`) y formato |
| `vitest`, `@vitest/coverage-v8`, `vite`, `@vitejs/plugin-react`, `jsdom` | Pruebas con umbral de cobertura (`vite` explícito porque el plugin lo exige)          |
| `@testing-library/react`, `/dom`, `/user-event`, `/jest-dom`             | Probar por rol y etiqueta, como lo haría una persona                                  |
| `axe-core`                                                               | Accesibilidad dentro de Vitest                                                        |
| `@playwright/test`, `@axe-core/playwright`                               | Pruebas en navegador real a 3 anchos, con axe                                         |
| `yaml`                                                                   | Leer `openapi.yaml` en la prueba que lo compara con las rutas (ya estaba en el árbol) |
| `husky`, `lint-staged`                                                   | Revisar lo modificado al hacer commit y `npm run check` al hacer push                 |

Herramientas que se usan **sin instalarlas** en el proyecto: Lighthouse, `puppeteer-core` y `vnu-jar`
(validador HTML de W3C).

## Calidad, IA y despliegue

- Requisitos de calidad y sus evidencias: [`CALIDAD.md`](CALIDAD.md).
- Configuración de IA, pruebas de contención y bitácora: [`IA.md`](IA.md).
- **No se ha desplegado en Vercel**: las mediciones son de la compilación de producción en local y
  deben repetirse sobre la URL pública (PageSpeed Insights).
- **Dependencias con avisos:** `npm audit --omit=dev` da **0** (lo que se despliega). El `npm audit`
  completo muestra «19 altas», pero son **un solo aviso** (`picomatch ≤ 4.0.7`, ReDoS) que npm repite en
  cada paquete de las herramientas de desarrollo (ESLint, typescript-eslint…) que lo usan; no hay versión
  corregida publicada y la CI lo muestra sin bloquear.
