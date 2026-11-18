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

Las solicitudes están numeradas y se pueden correr en orden con _Run Collection_: la carpeta de
semestres crea un semestre, la de materias lo usa y al final se elimina.
