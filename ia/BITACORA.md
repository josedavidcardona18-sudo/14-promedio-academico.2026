# Bitácora de uso de IA

> Cada entrada tiene: **propósito, evidencia, validación y decisión**. La IA de esta sesión fue
> Claude Code. Regla de oro: **el código de la IA es suyo y debe poder explicarlo línea por línea**
> (se pedirá en la sustentación). Las entradas 1–9 las redactó la IA sobre lo que hizo; las revisiones
> y rechazos **humanos** de la sección B los debe completar quien sustenta.

## A. Registro de lo que se hizo con IA

| #   | Propósito                                    | Evidencia (commit)                                           | Validación                                                                                                                          | Decisión                                                                                          |
| --- | -------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | Configurar la IA **antes** de generar código | `chore: configuración inicial de IA, calidad y herramientas` | 23 pruebas `node:test` del hook y de commits; ESLint y Prettier sobre todo                                                          | Primer commit con `AGENTS.md`, `.claude/`, `.gitignore`, `env.example` y scripts de calidad       |
| 2   | Lógica del promedio con la prueba primero    | `test(dominio): …` (rojo) y `feat(dominio): …` (verde)       | Las pruebas fallaron por «módulo inexistente» antes de implementar; después 56 verdes; cobertura de dominio 100 % de líneas         | Redondeo a 2 decimales para decidir; la nota necesaria se redondea **hacia arriba** (conservador) |
| 3   | Guardado local validado                      | `feat(almacen): …`                                           | Pruebas con datos corruptos, otra pestaña y almacenamiento bloqueado                                                                | `useSyncExternalStore` en vez de `useEffect` + `setState` (evita parpadeo de hidratación)         |
| 4   | Interfaz accesible                           | `feat(ui): …`                                                | Testing Library (comportamiento) + axe en jsdom                                                                                     | `<dialog>` nativo para confirmar; estados con icono **y** texto                                   |
| 5   | SEO y cabeceras de seguridad                 | `feat(seo): …`                                               | `next build`; cabeceras comprobadas con `curl -I`; consola sin violaciones de CSP                                                   | CSP solo en producción (React necesita `eval` en desarrollo)                                      |
| 6   | Pruebas en navegador real                    | `test(e2e): …`                                               | 132 pruebas en 3 anchos y 4 temas; **mutación deliberada** (rompí contraste, tamaño de texto y botones) y la suite falló como debía | Las pruebas no son decorativas: detectan la regresión                                             |
| 7   | Rendimiento                                  | `fix(rendimiento): …`                                        | Lighthouse antes/después: CLS 0,057 → 0                                                                                             | Reservar la altura del primer pantallazo en la página principal                                   |
| 8   | Auditoría de comandos en el hook             | `feat(ia): …`                                                | Pruebas 18 y 19 (registra permitido y bloqueado; si no puede escribir, el bloqueo igual se aplica)                                  | El registro queda en `.gitignore`                                                                 |
| 9   | Vulnerabilidades de `npm audit`              | `docs: …`                                                    | `npm audit --omit=dev` = 0; las 19 «altas» son un solo aviso de `picomatch ≤ 4.0.7` **sin versión corregida**                       | **No** se tapó con `overrides`; la CI bloquea producción y solo informa de desarrollo             |

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

1. **`src/domain/calculo.ts`**: ¿por qué se redondea la nota necesaria hacia arriba y la definitiva
   «mitad hacia arriba»? ¿Qué pasa con `4,000000000000001`?
2. **`src/domain/reducer.ts`**: ¿por qué se partió en `reducirMateria` y `reducirCorte`? (regla
   `complexity ≤ 10`).
3. **`src/hooks/useAlmacen.ts`**: ¿qué es `useSyncExternalStore` y por qué hay un `getServerSnapshot`?
4. **`src/components/CampoNumero.tsx`**: el patrón de «ajustar el estado cuando cambia una propiedad»
   y por qué conserva «3,» mientras se escribe.
5. **`src/components/DialogoConfirmar.tsx`**: qué hace `showModal()` por la accesibilidad.
6. **`.claude/hooks/guard.mjs`**: por qué sale con código 2 y qué falsos positivos tiene.
7. **`src/storage/serializar.ts`**: por qué se valida lo que viene de `localStorage`.
