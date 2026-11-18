# Colección de Bruno

Abre esta carpeta con **Bruno** (Collection → Open Collection) y elige el entorno `local` o `produccion`.

## Variables

| Variable       | Qué es                                  | De dónde sale                                             |
| -------------- | --------------------------------------- | --------------------------------------------------------- |
| `baseUrl`      | Dirección de la API                     | Ya está en cada entorno                                   |
| `idToken`      | Token de una persona **estudiante**     | Ver abajo (es secreto: no se guarda en el repositorio)    |
| `idTokenAdmin` | Token de una persona con el rol `admin` | Ver abajo (solo para la prueba del 200 de administración) |

Las variables secretas se escriben en Bruno, en _Environments → Secret_; **no** se suben al repositorio.

## Obtener un `idToken`

El token dura una hora. Con la app corriendo y la persona ya registrada, en la consola del navegador
de `/login` (o con la API REST de Firebase Auth `accounts:signInWithPassword` y tu API key web):

```
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<NEXT_PUBLIC_FIREBASE_API_KEY>
{ "email": "...", "password": "...", "returnSecureToken": true }
```

Copia el `idToken` de la respuesta. Para el rol `admin`, asígnalo antes con el Admin SDK
(`getAuth().setCustomUserClaims(uid, { rol: 'admin' })`) y vuelve a iniciar sesión para que el token lo traiga.

## Modo demostración

Con `MODO_DEMO=1` la API no pide token (hay una persona fija): las solicitudes `401` y `403 admin`
**no** se cumplen en ese modo. Para ver el 401 de verdad, prueba contra Firebase.

## Orden

Las carpetas están numeradas y se pueden correr en orden con _Run Collection_:

1. **Cuenta**: quién soy (200) y sin sesión (401).
2. **Semestres**: crea un semestre (guarda su `id` en `semestreId`) y prueba 200, 400, 401, 403 y 404.
3. **Materias**: usa ese semestre (guarda `materiaId`), incluida la paginación con cursor.
4. **Administración**: 403 para un estudiante, 200 solo con `idTokenAdmin`.
5. **Limpieza**: elimina el semestre.
6. **Sesión** (**al final, a propósito**): _registro de sesión_ (`POST /api/auth/sesion`: 400, 401, 403 y 204 con
   la cookie), quién soy con la cookie y cerrar sesión.

Esa última carpeta va al final por dos razones: al crear la cookie, Bruno la envía en todas las
solicitudes siguientes (las pruebas «sin sesión» dejarían de dar 401) y **cerrar sesión revoca los
tokens**: el `idToken` que usabas deja de servir. Para repetir la colección, obtén un token nuevo.
El `idToken` del registro de sesión debe ser **reciente** (menos de 5 minutos desde que inició sesión).
