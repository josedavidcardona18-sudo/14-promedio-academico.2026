# Guía: crear Firebase, conectarlo con la app y publicarla en Vercel

Esta guía lleva la aplicación de «funciona en mi PC en modo demostración» a «funciona con cuentas
reales, datos en Firestore y una URL pública». Sigue los pasos **en orden**. Los nombres de los menús
de la consola de Firebase y de Vercel pueden cambiar un poco con el tiempo; el nombre en inglés va
entre paréntesis cuando ayuda.

> **Regla de oro.** Hay variables **públicas** (`NEXT_PUBLIC_FIREBASE_*`: identifican el proyecto, no
> dan acceso a datos) y variables **secretas** (`FIREBASE_*`: la clave privada). Las secretas viven
> solo en `.env.local` (tu PC) y en Vercel. **Nunca** en GitHub, en un chat, en una captura ni en un
> correo. Si se filtra una clave, bórrala en Firebase y genera otra (paso 9 de «Si algo sale mal»).

## Qué necesitas

- Una cuenta de **Google** (para Firebase), una de **GitHub** y una de **Vercel** (entra con GitHub).
  Los tres planes gratuitos alcanzan para este proyecto.
- El proyecto ya corriendo en tu PC (`npm.cmd ci` y `npm.cmd run dev`, ver el `README`).

---

## Parte 1 · Crear el proyecto en Firebase (≈ 10 minutos)

### 1.1 El proyecto

1. Entra a <https://console.firebase.google.com> e inicia sesión con Google.
2. **Crear un proyecto** (Create a project) → ponle un nombre, por ejemplo `promedio-academico-tuapellido`
   → **Continuar**.
3. Google Analytics: puedes **desactivarlo** (no se usa) → **Crear proyecto** → espera → **Continuar**.

### 1.2 Authentication (inicio de sesión con correo y contraseña)

1. Menú izquierdo → **Compilación** (Build) → **Authentication** → **Comenzar** (Get started).
2. Pestaña **Método de acceso** (Sign-in method) → **Correo electrónico/contraseña**.
3. Activa el **primer** interruptor («Correo electrónico/contraseña»). **No** actives el de «vínculo
   por correo» → **Guardar**.

### 1.3 Firestore (la base de datos)

1. Menú izquierdo → **Compilación** → **Firestore Database** → **Crear base de datos** (Create database).
2. Si pregunta por la **edición**, elige **Standard**. Deja el ID `(default)`.
3. **Ubicación:** elige una cercana a tus usuarios (por ejemplo `nam5 (us-central)` o
   `southamerica-east1`). **No se puede cambiar después.**
4. Elige **Iniciar en modo de producción** (production mode) → **Crear**.
5. Pestaña **Reglas** (Rules): borra lo que haya, pega el contenido del archivo `firestore.rules` de este
   repositorio y pulsa **Publicar**. Debe quedar así:

   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

   Esas reglas **niegan todo** a los navegadores. La aplicación sí puede leer y escribir porque entra
   por el servidor con una cuenta de servicio (que no pasa por las reglas). Eso es lo que pide el documento.

### 1.3b Si prefieres desplegar las reglas por consola de comandos (opcional)

El repositorio trae `firebase.json` y `firestore.rules`. Con la CLI de Firebase instalada
(`npm install -g firebase-tools`, es opcional y no forma parte del proyecto): `firebase login`,
`firebase use <id-del-proyecto>` y `firebase deploy --only firestore`.

### 1.4 La configuración **web** (pública)

1. Engranaje junto a «Descripción general del proyecto» → **Configuración del proyecto** (Project settings).
2. Pestaña **General** → baja a **Tus apps** → icono **`</>`** (Web).
3. Apodo: `web`. **No** marques «Firebase Hosting» → **Registrar app**.
4. Verás un bloque `const firebaseConfig = { ... }`. De ahí necesitas **cuatro** valores:

   | En Firebase  | Variable de entorno                |
   | ------------ | ---------------------------------- |
   | `apiKey`     | `NEXT_PUBLIC_FIREBASE_API_KEY`     |
   | `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
   | `projectId`  | `NEXT_PUBLIC_FIREBASE_PROJECT_ID`  |
   | `appId`      | `NEXT_PUBLIC_FIREBASE_APP_ID`      |

   Los demás (`storageBucket`, `messagingSenderId`, `measurementId`) no se usan. Estos cuatro **son
   públicos por diseño**: cualquiera que abra tu sitio los verá en el JavaScript, y no hay problema.

### 1.5 La cuenta de servicio (privada)

1. **Configuración del proyecto** → pestaña **Cuentas de servicio** (Service accounts).
2. **Generar nueva clave privada** (Generate new private key) → **Generar clave**. Se descarga un
   archivo `.json`.
3. Ábrelo con el Bloc de notas o con VS Code (no lo subas a GitHub: el `.gitignore` ya excluye
   `*firebase-adminsdk*.json`, pero no lo guardes dentro de la carpeta del proyecto de todos modos).
   De ahí salen **tres** valores:

   | En el `.json`  | Variable de entorno     | Nota                                                                            |
   | -------------- | ----------------------- | ------------------------------------------------------------------------------- |
   | `project_id`   | `FIREBASE_PROJECT_ID`   |                                                                                 |
   | `client_email` | `FIREBASE_CLIENT_EMAIL` | Termina en `.iam.gserviceaccount.com`                                           |
   | `private_key`  | `FIREBASE_PRIVATE_KEY`  | Todo el texto, de `-----BEGIN PRIVATE KEY-----` a `-----END PRIVATE KEY-----\n` |

4. Cuando termines de copiarlos (partes 2 y 4), **borra el `.json`** de tu PC o guárdalo en un
   gestor de contraseñas. Ya no hace falta.

---

## Parte 2 · Conectarlo en tu PC (`.env.local`)

1. En la carpeta del proyecto (donde está `package.json`) copia el ejemplo:

   - PowerShell: `Copy-Item env.example .env.local`
   - Mac/Linux/WSL: `cp env.example .env.local`

2. Abre `.env.local` en VS Code y reemplaza **todos** los valores falsos. Debe quedar así (con tus datos):

   ```text
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   FIREBASE_PROJECT_ID=promedio-academico-tuapellido
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@promedio-academico-tuapellido.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"

   NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=promedio-academico-tuapellido.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=promedio-academico-tuapellido
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

   - La clave privada va **en una sola línea**, entre **comillas dobles**, con los `\n` tal como están
     en el `.json` (no los conviertas en saltos de línea reales).
   - **No** pongas `MODO_DEMO` (con Firebase configurado, la aplicación trabaja con cuentas reales).

3. **Reinicia** el servidor (`Ctrl+C` y otra vez `npm.cmd run dev`): `.env.local` se lee al arrancar.
4. Abre <http://localhost:3000>: te lleva a **/login**. Pulsa **¿No tienes cuenta? Crear una**, escribe un
   correo y una contraseña (mínimo 6 caracteres) → **Crear cuenta**. Entras a la aplicación y verás
   «Aún no tienes semestres» → **Cargar datos de ejemplo**.
5. Compruébalo en Firebase:
   - **Authentication → Usuarios**: aparece tu correo.
   - **Firestore Database → Datos**: aparece `usuarios` → tu `uid` → `semestres` → `ejemplo` → `materias`.
6. Crea una **segunda cuenta** (ventana de incógnito): no debe ver los datos de la primera. Esa es la
   prueba de que cada persona solo ve lo suyo.

### Cómo asignar el rol `admin` (para demostrar el 403 y el 200)

Los roles son _custom claims_ y **no se pueden poner desde la consola**. Con tu `.env.local` ya listo:

```text
node --env-file=.env.local scripts/asignar-rol.mjs tu-correo@ejemplo.com admin
```

Luego **cierra sesión y vuelve a entrar** (el rol viaja en el token nuevo). Para probarlo, abre en el
navegador `http://localhost:3000/api/auth/yo` (debe decir `"rol":"admin"`) y
`http://localhost:3000/api/admin/usuarios/<uid-de-otra-persona>/semestres`: con `admin` responde `200`;
con una cuenta normal, `403`. (El `uid` lo ves en **Authentication → Usuarios**.) Para volver a
estudiante: el mismo comando con `estudiante`.

---

## Parte 3 · Subir el código a GitHub

1. Configura **tu** nombre y correo para los commits que hagas tú (una sola vez):

   ```text
   git config --global user.name "Tu Nombre"
   git config --global user.email "tu-correo@ejemplo.com"
   ```

   El historial existente está a nombre de «Claude» con la línea `Co-Authored-By`: es lo que refleja la
   bitácora de IA. No lo reescribas para ocultar el uso de IA; si tu profesor pide algo distinto,
   consúltalo con él.

2. En <https://github.com/new> crea un repositorio **vacío** (sin README, sin `.gitignore`, sin licencia),
   por ejemplo `14-promedio-academico`. Puede ser privado.
3. En la carpeta del proyecto:

   ```text
   git remote add origin https://github.com/TU-USUARIO/14-promedio-academico.git
   git branch -M main
   git push -u origin main
   ```

   GitHub te pedirá iniciar sesión (se abre el navegador) o un token de acceso personal.

4. Antes de subir, comprueba que **`.env.local` no aparece** en `git status` (está en el `.gitignore`).
5. Al subir, GitHub Actions corre sola la revisión (`npm run check`, compilación y pruebas de navegador):
   mira la pestaña **Actions**.

> La carpeta del proyecto debe ser la **raíz del repositorio** (la que contiene `package.json`). Si
> descomprimiste el zip y quedó una carpeta dentro de otra, trabaja siempre en la de adentro.

---

## Parte 4 · Publicar en Vercel (≈ 10 minutos)

### 4.1 Importar el proyecto

1. Entra a <https://vercel.com> → **Sign Up / Log In** → **Continue with GitHub**.
2. **Add New… → Project** → busca `14-promedio-academico` → **Import**. (Si no aparece: **Adjust GitHub App
   Permissions** y da acceso a ese repositorio.)
3. **Framework Preset:** debe decir **Next.js**. **Root Directory:** el predeterminado (la raíz). No
   cambies los comandos de compilación.

### 4.2 Variables de entorno (antes de pulsar Deploy)

Despliega la sección **Environment Variables** y agrega estas **8** (nombre → valor). Déjalas para
**Production**; si quieres que las vistas previas (Preview) también funcionen, marca también **Preview**:

| Nombre                             | Valor                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `FIREBASE_PROJECT_ID`              | el `project_id` del `.json`                                             |
| `FIREBASE_CLIENT_EMAIL`            | el `client_email` del `.json`                                           |
| `FIREBASE_PRIVATE_KEY`             | la `private_key` completa (ver nota)                                    |
| `NEXT_PUBLIC_FIREBASE_API_KEY`     | `apiKey`                                                                |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain`                                                            |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`  | `projectId`                                                             |
| `NEXT_PUBLIC_FIREBASE_APP_ID`      | `appId`                                                                 |
| `NEXT_PUBLIC_SITE_URL`             | por ahora `https://TU-PROYECTO.vercel.app` (lo corriges en el paso 4.4) |

- **`FIREBASE_PRIVATE_KEY`:** pega el valor **sin las comillas de afuera**. Sirve pegada con saltos de
  línea reales o con los `\n` del `.json`: la aplicación convierte los `\n` literales y también
  ignora unas comillas que se hayan colado. Si Vercel te ofrece marcarla como **Sensitive**, márcala.
- **No agregues `MODO_DEMO`.** (Aunque la agregaras, con credenciales de Firebase en producción se
  ignora a propósito: no puede abrir tu API.)
- Las variables `NEXT_PUBLIC_*` se **incrustan al compilar**: si las cambias después, hay que
  **volver a desplegar** (4.4).

### 4.3 Desplegar

Pulsa **Deploy**. En 1–2 minutos aparece la URL, algo como `https://14-promedio-academico.vercel.app`
(el nombre sale del proyecto). Si la compilación falla, abre **Build Logs** y copia el error.

### 4.4 Ajustes que hay que hacer **después** del primer despliegue

1. **`NEXT_PUBLIC_SITE_URL`:** en Vercel → **Settings → Environment Variables** → edita con la URL real
   → **Deployments** → el último → **⋯ → Redeploy**.
2. **Dominio autorizado en Firebase:** **Authentication → Configuración** (Settings) → **Dominios
   autorizados** (Authorized domains) → **Agregar dominio** → pon `14-promedio-academico.vercel.app`
   (sin `https://`). Si luego usas un dominio propio, agrégalo también.
3. Pon la URL real en `openapi.yaml` (sección `servers`) y en `bruno/environments/produccion.bru`
   (`baseUrl`), haz commit y `git push`: Vercel vuelve a desplegar solo cada vez que subes a `main`.

### 4.5 Comprobar que funciona en producción (lo que pide el documento)

Haz estas pruebas con la URL pública y anota cada resultado:

1. Abre la URL → te lleva a `/login` ✔.
2. Abre `https://TU-URL/api/auth/yo` **sin** haber iniciado sesión → debe responder
   `{"error":"Necesitas iniciar sesión."}` con código **401** ✔.
3. Crea una cuenta o entra → ves tus semestres. Luego abre `https://TU-URL/api/auth/yo` → ahora
   `{"usuario":{"uid":"…","correo":"…","rol":"estudiante"},"demo":false}` ✔.
4. Con **otra cuenta** (ventana de incógnito) no ves los datos de la primera ✔.
5. DevTools (F12) → **Aplicación** (Application) → **Cookies**: la cookie `sesion` tiene **HttpOnly**,
   **Secure** y **SameSite = Lax** ✔.
6. DevTools → **Red** (Network) → el documento → **Encabezados de respuesta**: aparecen
   `Content-Security-Policy`, `Strict-Transport-Security` y `X-Content-Type-Options` ✔.
7. Firebase → **Firestore → Datos**: aparecen tus documentos bajo `usuarios/{uid}` ✔.
8. Vercel → tu proyecto → **Logs**: una línea JSON por petición (con `metodo`, `ruta`, `estado`), sin
   correos, tokens ni claves ✔.
9. **Evidencias de calidad** (sección 14 del documento) sobre la URL pública: Lighthouse (DevTools →
   Lighthouse → Móvil) en `/login` (pública), en `/materias/…` (con formulario) y en `/historial`
   (con la sesión abierta), y PageSpeed Insights (<https://pagespeed.web.dev>) en `/login`. Guarda los
   informes en `calidad/` y apunta los resultados en `CALIDAD.md`.

---

## Si algo sale mal

Mira siempre **dos lugares**: la terminal donde corre `npm run dev` (en local) o **Vercel → Logs** (en
producción), y la consola del navegador (F12). Los errores del servidor se anotan como una línea JSON
con `"error"` (el tipo) y `"codigo"` (el código de Firebase), **sin** claves ni datos personales.

| Lo que ves                                                                        | Causa probable                                                                                      | Qué hacer                                                                                                                        |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| «El inicio de sesión no está configurado todavía» al pulsar Entrar                | Faltan las `NEXT_PUBLIC_FIREBASE_*` (o se agregaron en Vercel **después** de compilar)              | Revisa las 4 variables y **vuelve a desplegar**; en local, reinicia `npm run dev`                                                |
| «El acceso con correo y contraseña no está activado en Firebase»                  | No activaste el proveedor                                                                           | Paso 1.2                                                                                                                         |
| «La configuración de Firebase no es válida»                                       | `NEXT_PUBLIC_FIREBASE_API_KEY` mal copiada                                                          | Cópiala de nuevo de **Configuración del proyecto → Tus apps**                                                                    |
| «Este dominio no está autorizado en Firebase»                                     | Falta el dominio de Vercel                                                                          | Paso 4.4 (2)                                                                                                                     |
| Tras entrar: «El servicio de cuentas no está configurado» (503)                   | Falta alguna de las 3 variables `FIREBASE_*` en el servidor                                         | Revísalas (en local, reinicia el servidor; en Vercel, **Redeploy**)                                                              |
| Tras entrar: «Error interno» y en el registro `"codigo":"app/invalid-credential"` | La **clave privada** está mal pegada o es de otro proyecto                                          | Pégala otra vez completa (de `BEGIN` a `END`); comprueba que `FIREBASE_PROJECT_ID` es el mismo proyecto                          |
| «Error interno» y `"codigo":"5"` o `NOT_FOUND`                                    | No creaste la base de Firestore                                                                     | Paso 1.3                                                                                                                         |
| «Error interno» y `"codigo":"7"` o `PERMISSION_DENIED`                            | La cuenta de servicio es de otro proyecto o le quitaron permisos                                    | Genera una clave nueva del **mismo** proyecto (1.5)                                                                              |
| «Tu inicio de sesión es muy antiguo. Vuelve a ingresar.»                          | El reloj de tu PC está desfasado, o pasaron más de 5 minutos entre iniciar sesión y crear la cookie | Sincroniza la hora de Windows e inténtalo otra vez                                                                               |
| Entras, pero te devuelve a `/login`                                               | La cookie no se guardó (en `http://` con Safari) o venció                                           | Prueba con Chrome/Edge en `http://localhost:3000`; en producción siempre es HTTPS                                                |
| Una pantalla de Vercel pide iniciar sesión **en Vercel**                          | «Deployment Protection» de Vercel                                                                   | **Settings → Deployment Protection**: desactívala para Production, o usa el dominio de producción en vez del de una vista previa |
| Cambié una variable y no pasa nada                                                | Las variables se leen al arrancar / compilar                                                        | En local reinicia; en Vercel **Redeploy**                                                                                        |
| «Demasiadas solicitudes» (429)                                                    | El límite de frecuencia (60 escrituras/min por IP y ruta; 30/min para iniciar sesión)               | Espera los segundos que indica `Retry-After`                                                                                     |

### Si se filtró una clave privada

1. Firebase → **Configuración del proyecto → Cuentas de servicio → Administrar permisos de cuentas de
   servicio** (te lleva a Google Cloud) → la cuenta `firebase-adminsdk-…` → pestaña **Claves** →
   **elimina** la clave filtrada.
2. Genera una nueva (paso 1.5) y actualízala en `.env.local` y en Vercel (**Redeploy**).
3. Si estuvo en GitHub, **borrar el archivo no basta** (queda en el historial): la clave ya eliminada en
   el paso 1 es lo que la deja inútil.

## Límites de los planes gratuitos (por si preguntan)

- **Firebase Spark:** Firestore incluye por día unas 50 000 lecturas y 20 000 escrituras. Cada carga de
  pantalla lee los semestres de la persona con sus materias (≈ 5 lecturas por semestre): para uso
  personal sobra; si creciera, habría que paginar o guardar un resumen.
- **Vercel Hobby:** pensado para uso personal/no comercial, suficiente para el curso.
- El límite de frecuencia de la API es **por instancia** (en memoria). Para un límite global se usa el
  Firewall de Vercel.
