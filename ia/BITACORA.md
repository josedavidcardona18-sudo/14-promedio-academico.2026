# Bitácora de uso de IA

> Cada entrada tiene: **propósito, evidencia, validación y decisión**. La IA de esta sesión fue
> Claude Code. Regla de oro: **el código de la IA es suyo y debe poder explicarlo línea por línea**
> (se pedirá en la sustentación). Las entradas 1–9 las redactó la IA sobre lo que hizo; las revisiones
> y rechazos **humanos** de la sección B los debe completar quien sustenta.

## A. Registro de lo que se hizo con IA

| #   | Propósito                                                                                | Evidencia (commit)                                                                                                   | Validación                                                                                                                                                                | Decisión                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Configurar la IA **antes** de generar código                                             | `chore: configuración inicial de IA, calidad y herramientas`                                                         | 23 pruebas `node:test` del hook y de commits; ESLint y Prettier sobre todo                                                                                                | Primer commit con `AGENTS.md`, `.claude/`, `.gitignore`, `env.example` y scripts de calidad                                           |
| 2   | Lógica del promedio con la prueba primero                                                | `test(dominio): …` (rojo) y `feat(dominio): …` (verde)                                                               | Las pruebas fallaron por «módulo inexistente» antes de implementar; después 56 verdes; cobertura de dominio 100 % de líneas                                               | Redondeo a 2 decimales para decidir; la nota necesaria se redondea **hacia arriba** (conservador)                                     |
| 3   | Guardado local validado                                                                  | `feat(almacen): …`                                                                                                   | Pruebas con datos corruptos, otra pestaña y almacenamiento bloqueado                                                                                                      | `useSyncExternalStore` en vez de `useEffect` + `setState` (evita parpadeo de hidratación)                                             |
| 4   | Interfaz accesible                                                                       | `feat(ui): …`                                                                                                        | Testing Library (comportamiento) + axe en jsdom                                                                                                                           | `<dialog>` nativo para confirmar; estados con icono **y** texto                                                                       |
| 5   | SEO y cabeceras de seguridad                                                             | `feat(seo): …`                                                                                                       | `next build`; cabeceras comprobadas con `curl -I`; consola sin violaciones de CSP                                                                                         | CSP solo en producción (React necesita `eval` en desarrollo)                                                                          |
| 6   | Pruebas en navegador real                                                                | `test(e2e): …`                                                                                                       | 132 pruebas en 3 anchos y 4 temas; **mutación deliberada** (rompí contraste, tamaño de texto y botones) y la suite falló como debía                                       | Las pruebas no son decorativas: detectan la regresión                                                                                 |
| 7   | Rendimiento                                                                              | `fix(rendimiento): …`                                                                                                | Lighthouse antes/después: CLS 0,057 → 0                                                                                                                                   | Reservar la altura del primer pantallazo en la página principal                                                                       |
| 8   | Auditoría de comandos en el hook                                                         | `feat(ia): …`                                                                                                        | Pruebas 18 y 19 (registra permitido y bloqueado; si no puede escribir, el bloqueo igual se aplica)                                                                        | El registro queda en `.gitignore`                                                                                                     |
| 9   | Vulnerabilidades de `npm audit`                                                          | `docs: …`                                                                                                            | `npm audit --omit=dev` = 0; las 19 «altas» son un solo aviso de `picomatch ≤ 4.0.7` **sin versión corregida**                                                             | **No** se tapó con `overrides`; la CI bloquea producción y solo informa de desarrollo                                                 |
| 10  | Adaptar todo al **documento real del proyecto 14** (llegó después de la primera versión) | `test(servicios)` + `feat(servicios)`, `feat(api)`, `fix(api)`, `feat(cliente)`, `docs(ia)`, `test(e2e)`, `fix(csp)` | Los criterios de aceptación 1–4 del documento son pruebas (unitarias, de componentes, de API y de navegador); `npm run check` y 189 pruebas de navegador                  | Retirar la calculadora de una pantalla, la escala configurable y `/acerca`: el documento pide cumplir lo suyo antes de agregar extras |
| 11  | Esquemas Zod compartidos y cálculo con enteros                                           | `test(servicios)` (rojo, 3 archivos sin módulo) → `feat(servicios)` (37 verdes)                                      | Rojo por «módulo inexistente»; luego verde. Repasé a mano la aritmética de las pruebas antes de ejecutar                                                                  | Truncar a 2 decimales y decidir con enteros; la nota necesaria sube a la décima siguiente                                             |
| 12  | API por capas con errores consistentes                                                   | `feat(api)`                                                                                                          | 200, 400, 404, 500 sin detalles internos e integración sobre el criterio 1. **Las pruebas se escribieron antes que el código, pero no ejecuté un paso rojo por separado** | El repositorio es una interfaz: en el Hito 3 se cambia por Firestore                                                                  |
| 13  | Auditoría de calidad sobre la versión nueva                                              | `fix(csp)`, `CALIDAD.md`                                                                                             | Lighthouse 100/100/100/100 en 3 páginas; INP 24 ms; validador de W3C 0 errores; axe 0 violaciones en 27 combinaciones                                                     | No reclamar nada de Vercel: todo es en local                                                                                          |

## Casos en que se corrigió lo que produjo la IA (detectados por pruebas y herramientas)

1. **Hook con dos errores.** La IA escribió expresiones que no reconocían `.env*` (glob) ni
   `sh -c 'wget …'`. Las pruebas 5 y 10 fallaron al ejecutarlas; se corrigió el código, no las pruebas.
   Después se encontró un tercer defecto antes de que una prueba lo detectara: el hook trataba el
   texto buscado por `Grep` como una ruta (falso positivo); se corrigió y se añadió la prueba 5b.
2. **Aritmética mala en las propias pruebas.** Al repasar antes de ejecutar, la IA detectó tres
   expectativas erróneas que había escrito (`1,8 ÷ 0,7 = 2,57…` se redondea a **2,58**, no 2,57; con
   meta 4,0 hacen falta 5,275, que es imposible; y una materia «en curso» contada como «asegurada»).
   Se corrigieron las expectativas tras recalcular a mano, no se ajustó el código para que pasaran.
3. **Nombre accesible roto.** Testing Library mostró botones llamados «EditarCálculo diferencial»
   (sin espacio) porque el espacio quedó dentro del `<span>` oculto. Era un defecto real para
   lectores de pantalla; se movió el espacio al texto visible.
4. **Regiones repetidas.** axe marcó `landmark-unique`: cuatro `<section>` con el mismo nombre
   «¿Qué nota necesito?». Se cambió a un bloque con encabezado, no a un landmark.
5. **Texto de 14 px.** La hoja pide ≥ 16 px; la IA había usado 14 px en ayudas y errores. Se subió a
   1 rem y se añadió una prueba que revisa el tamaño de **todo** el texto visible.
6. **Botón duplicado.** La prueba encontró dos botones idénticos «Cargar datos de ejemplo» en el
   estado vacío (confuso con lector de pantalla). Se dejó uno solo.
7. **Prueba mal planteada.** Una prueba de foco en el diálogo asumía que Tab nunca sale del
   `<dialog>`; en un navegador real puede pasar a la interfaz del navegador. Se corrigió la prueba
   para verificar lo que el navegador sí garantiza (el fondo es inerte).
8. **Husky inactivo en el primer commit.** `npm install <paquete>` no ejecuta `prepare`, así que los
   hooks no estaban activos al hacer el primer commit. Se advirtió, se activó con `npm run prepare` y
   se comprobó que `commit-msg` rechaza un mensaje inválido.

9. **Trabajé sobre un resumen, no sobre el documento.** La primera versión salió de la hoja de
   calidad y de IA, no del documento del proyecto 14. Al llegar el documento había que rehacer el
   dominio (notas de 0,0 a 5,0 con un decimal en lugar de escala configurable, porcentajes ≤ 100 %,
   estados aprobando/en riesgo/perdida), la arquitectura (API, Zod, repositorio) y las rutas. Lección:
   leer el requisito completo antes de construir. Se hizo sin pasar por encima del trabajo previo:
   quedó todo en el historial.
10. **Aritmética mala en mis pruebas, otra vez.** Al repasar antes de ejecutar encontré cuatro
    expectativas erróneas (p. ej. meta 3,5 pide exactamente 3,5 y no 3,6; con los estados nuevos
    «Cálculo» cuenta como _aprobando_). Se corrigieron las expectativas tras recalcular, no el código.
11. **El mismo defecto de accesibilidad, reintroducido.** Al reescribir los componentes de memoria volví
    a dejar el espacio dentro del `<span>` oculto («Ver y editar notasde Cálculo»). Testing Library lo
    volvió a detectar. Lección: la IA repite errores que ya corrigió; la prueba es la que la corrige.
12. **Una respuesta de error se cacheaba.** Al leer una respuesta 400 con `curl -i` vi
    `Cache-Control: public, s-maxage=60`: una CDN la habría guardado un minuto. Escribí la prueba
    (falló) y luego el arreglo.
13. **El mismo CSP bloqueaba a Zod.** Lighthouse bajó buenas prácticas de 100 a 96. No lo dejé pasar:
    capturé el aviso por el protocolo de Chrome (`kEvalViolation`), lo atribuí a Zod, escribí la prueba
    de navegador (falló) y apliqué `jitless`. Además escribí una prueba unitaria que **pasaba antes
    del arreglo** (no detectaba nada) y la **retiré** en vez de dejar una garantía falsa.
14. **Dos selectores ambiguos en mis pruebas de navegador** (`role="alert"` de Next y dos enlaces
    «Volver al resumen»). Eran de la prueba, no de la aplicación; se hicieron precisos.
15. **La sesión se reinició a mitad de una suite.** Se comprobó el estado en disco, se relanzó en
    segundo plano con registro y se completó; no se dio nada por bueno sin ver el resultado.

## B. A completar por quien sustenta (≥ 3 casos propios)

La rúbrica pide **≥ 3 casos en que usted rechazó o corrigió lo que propuso la IA**. Los casos de la
sección anterior los corrigió la IA con ayuda de las pruebas; **no sustituyen a los suyos**. Revise el
diff completo (`git log -p`) y anote aquí lo que usted cambió o rechazó, con este formato:

```text
Caso N — qué propuso la IA: ____
Por qué no lo acepté / lo corregí: ____
Evidencia (commit, captura o prueba): ____
```

## C. Para poder explicarlo en la sustentación

Se le pedirá explicar «un fragmento de código generado con IA». Prepárese con estos (de más a menos
probable):

1. **`src/services/promedios.ts`**: ¿por qué todo se calcula en enteros (décimas)? ¿Por qué la nota
   necesaria se redondea hacia arriba con `(a + b - 1) / b` y los promedios se truncan? ¿Qué pasaría
   con `3,3 × 30 % + 2,7 × 30 %` en coma flotante?
2. **`src/schemas/semestre.ts`**: ¿qué es `superRefine` y por qué la suma de porcentajes se valida
   ahí? ¿Por qué `strictObject` (mass assignment) y qué es `jitless`?
3. **`src/lib/http.ts`**: ¿qué hace `manejar()`? ¿Por qué un 500 no devuelve el mensaje del error y por
   qué los errores no se cachean?
4. **`src/hooks/useSemestre.ts`**: ¿por qué «cargando» se deduce con una clave en vez de llamar a
   `setState` dentro del efecto? ¿Para qué sirve el `AbortController`?
5. **`src/hooks/useBorrador.ts`**: `useSyncExternalStore` y por qué hay un `getServerSnapshot`.
6. **`src/components/CampoNumero.tsx`**: la Constraint Validation API (`validity.badInput`,
   `setCustomValidity`) y el patrón de «ajustar el estado cuando cambia una propiedad».
7. **`src/components/ConSemestre.tsx`** y **`EditorMateria.tsx`**: contenedor frente a presentación, y
   estado derivado con `useMemo`.
8. **`.claude/hooks/guard.mjs`**: por qué sale con código 2 y qué falsos positivos tiene.
