# Configuración de IA: qué riesgo cubre cada barrera

> Esta hoja explica **qué barrera hay, qué riesgo cubre y dónde se rompe**. La configuración vive en
> `AGENTS.md`, `.claude/settings.json` y `.claude/hooks/guard.mjs`. Abra siempre la IA **en la raíz
> de este repositorio**.

## Qué está verificado y qué no

| Pieza                                                | Estado                                                                                                                                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hook `guard.mjs` (bloqueo, auditoría, falla cerrado) | **Verificado**: 22 pruebas `node:test` en `.claude/hooks/guard.test.mjs` (`npm test`), incluida la prueba como proceso con código de salida 2.                                                                                                               |
| Sintaxis de `settings.json`                          | **Contrastada con la documentación** de Claude Code (permisos, sandbox, hooks, subagentes) el día en que se escribió. Revíselo contra la documentación **de su versión**: las claves cambian.                                                                |
| Reglas `permissions`, sandbox, subagente `revisor`   | **Sin verificar en vivo.** Esta configuración se escribió desde una sesión que no la tenía cargada (Claude Code lee `.claude/` al arrancar en la carpeta). Las pruebas de `ia/PRUEBAS-CONTENCION.md` son las que lo comprueban, y deben ejecutarlas ustedes. |
| Sandbox en Linux/WSL2                                | **Sin verificar.** Necesita `bubblewrap` y `socat`. Compruebe con `/sandbox`.                                                                                                                                                                                |

## Barreras

| #   | Barrera                                                                                                                    | Riesgo que cubre                                                                                            | Límite (dónde se rompe)                                                                                                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `AGENTS.md` (60 líneas) + `CLAUDE.md` con `@AGENTS.md`                                                                     | La IA ignora el estilo, las capas o lo prohibido                                                            | **No protege**: es una sugerencia. Un texto malicioso o el propio modelo pueden ignorarla.                                                                                                                             |
| 2   | `permissions.deny` de `Read` para `.env*`, `*.pem`, `*.key`, `*firebase-adminsdk*.json`                                    | La IA lee o imprime secretos                                                                                | Solo aplica a las herramientas de archivo. **No ve** un `grep -r` ni un `node -e` que abra el archivo: eso lo ataja el sandbox.                                                                                        |
| 3   | `env.example` con valores falsos + `.gitignore` de `.env*`                                                                 | Subir secretos al repositorio o tenerlos al alcance                                                         | Si alguien pega una clave real, **rotarla**: borrarla no basta. No hay `.env*` en este repo.                                                                                                                           |
| 4   | `blockReadsOutsideWorkingDirectories: true`                                                                                | Leer otros proyectos o el home                                                                              | Cubre las herramientas de archivo, no los subprocesos de Bash.                                                                                                                                                         |
| 5   | Sandbox (`enabled`, `failIfUnavailable`, `allowUnsandboxedCommands: false`, `denyRead: ["~/"]`, `allowRead: ["."]`)        | Que un comando de Bash lea o escriba fuera del proyecto                                                     | `denyRead` **no** frena a la herramienta `Read` (para eso es la barrera 2/4). No existe en Windows nativo: use WSL2.                                                                                                   |
| 6   | `sandbox.filesystem.denyRead` con **rutas literales** de `.env*`                                                           | `grep -r CANARIO .` o `node -e` leyendo `.env.local`                                                        | Se listaron archivos concretos porque **no se pudo confirmar** que los comodines (`.env*`) funcionen en Linux. Un `.env.otro` no listado queda abierto: por eso no debe haber secretos reales en disco.                |
| 7   | `sandbox.network.allowedDomains: ["registry.npmjs.org"]`                                                                   | Exfiltrar datos o descargar código arbitrario                                                               | Solo el registro de npm, justificado por `npm install` y `npm audit`. **GitHub no se incluyó a propósito**: `git push` pide permiso. No limita a `WebFetch`.                                                           |
| 8   | `deny` de Bash: `sudo`, `rm -rf`, `curl`, `wget`, `git push --force`, `git push -f`, `git reset --hard`, `vercel env pull` | Acciones destructivas o con efecto                                                                          | Una regla de Bash **no es una frontera**: `/usr/bin/curl` o `sh -c '…'` la esquivan. Por eso existen el hook (barrera 11) y el sandbox de red (7).                                                                     |
| 9   | `ask`: `git push`, `git commit`, `npm install/add/uninstall/update`, `npx`, `vercel`                                       | Cambios que deben revisarse con ojos humanos                                                                | Dependen de que la persona lea antes de aceptar.                                                                                                                                                                       |
| 10  | `Edit(./.claude/**)` y `Edit(./.husky/**)` denegados                                                                       | La IA reescribe su propia jaula o los hooks de calidad                                                      | No impide que **usted** los edite, ni que un script de Node de la IA los toque (lo ataja el sandbox).                                                                                                                  |
| 11  | Hook `PreToolUse` (`guard.mjs`)                                                                                            | Lo que los patrones de permisos no ven: rutas con `..`, `~`, secretos en comandos, `curl` dentro de `sh -c` | **Falla abierto** si Node no existe o el hook se cuelga. Tiene falsos positivos: bloquea una palabra `curl` o una ruta que empieza con `/` aunque esté dentro de un mensaje de commit. No detecta `grep -r CANARIO .`. |
| 12  | `disableBypassPermissionsMode: "disable"` y `defaultMode: "plan"`                                                          | Saltarse todos los permisos; editar sin que se haya planeado                                                | `defaultMode: "plan"` es un punto de partida, la persona puede cambiarlo en la sesión.                                                                                                                                 |
| 13  | Auditoría: `ia/auditoria.jsonl` (la escribe el hook)                                                                       | Poder reconstruir qué intentó hacer la IA y qué se decidió                                                  | Está en `.gitignore` (puede contener comandos). Registra el intento, no su resultado.                                                                                                                                  |
| 14  | Subagente `revisor` (solo lectura) y comando `/revisar`                                                                    | Revisar el diff contra `AGENTS.md` antes de cada commit                                                     | Tiene `Bash` para correr `npm run check` y `git diff`; su «solo lectura» lo hacen cumplir los permisos y el hook, no el propio texto del subagente. **No se ha probado en vivo.**                                      |
| 15  | `npm run check` + Husky (pre-commit y pre-push) + CI                                                                       | Código roto o sin pruebas en la rama principal                                                              | `--no-verify` salta los hooks locales: la CI es la red de seguridad (y está prohibido en `AGENTS.md`).                                                                                                                 |

## Ajustes hechos mientras se construía (y por qué)

1. **El hook fallaba dos pruebas al escribirlas.** Un glob como `.env*` no se reconocía como secreto
   (la expresión exigía que `.env` terminara o siguiera con punto) y `sh -c 'wget …'` se escapaba
   porque la comilla antes del comando no contaba como separador. Se corrigieron y las pruebas se
   quedaron como protección.
2. **Falso positivo en `Grep`.** Al principio el hook trataba el texto buscado como si fuera una ruta
   y habría bloqueado a la IA cada vez que buscara «.env» en el código. Ahora, en `Grep` solo se
   mira `glob`, y en `Glob` solo `pattern`.
3. **Sandbox con rutas literales** en vez de comodines, porque la documentación no confirma comodines
   en Linux para `sandbox.filesystem`.
4. **Solo el registro de npm** en `allowedDomains`. Se descartó GitHub: el único comando que lo usaría
   (`git push`) ya pide permiso.
5. **Auditoría añadida al hook** para poder demostrar qué se bloqueó. Si no puede escribir el
   registro, el bloqueo igual se aplica (prueba 19).
6. **`onFailure: "block"` no se usó**: solo existe desde Claude Code 2.1.295 y una clave desconocida
   puede dar error. Si su versión lo soporta, añádalo para que el hook falle cerrado también cuando
   Node no esté disponible.

## Si algo falla en su máquina

- **`npm` o Node fallan dentro del sandbox** (típico con `nvm`): abra **solo** la ruta necesaria con
  `allowRead` (p. ej. `~/.nvm`) y, si hace falta escribir en la caché, `allowWrite` (`~/.npm`).
  Anote el cambio aquí, en esta sección.
- **Windows:** use WSL2 (Ubuntu) y `sudo apt-get install bubblewrap socat`.
- **Una regla no hace lo esperado:** deny → ask → allow, y gana la primera que coincide. Un `allow`
  nunca abre una excepción dentro de un `deny`.
