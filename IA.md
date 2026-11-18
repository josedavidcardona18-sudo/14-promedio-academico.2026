# Configuración de IA · índice

Reto adicional de todos los proyectos web: la IA se configura **antes** de usarla y las restricciones
las hace cumplir el programa. El historial lo comprueba: el primer commit contiene `AGENTS.md`,
`.claude/`, `.gitignore`, `env.example` y los scripts de calidad (`git show --stat $(git rev-list --max-parents=0 HEAD)`).

| Qué                                | Dónde                                                                                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reglas del proyecto para la IA     | [`AGENTS.md`](AGENTS.md) (67 líneas) y [`CLAUDE.md`](CLAUDE.md) (solo `@AGENTS.md`)                                                                  |
| Permisos, sandbox y hook           | [`.claude/settings.json`](.claude/settings.json)                                                                                                     |
| Hook `PreToolUse` propio + pruebas | [`.claude/hooks/guard.mjs`](.claude/hooks/guard.mjs) · [`guard.test.mjs`](.claude/hooks/guard.test.mjs)                                              |
| Subagente revisor y comando        | [`.claude/agents/revisor.md`](.claude/agents/revisor.md) · [`.claude/commands/revisar.md`](.claude/commands/revisar.md)                              |
| Qué riesgo cubre cada barrera      | [`ia/CONFIGURACION.md`](ia/CONFIGURACION.md)                                                                                                         |
| Las 10 pruebas de contención       | [`ia/PRUEBAS-CONTENCION.md`](ia/PRUEBAS-CONTENCION.md) · [`docs/trampa.md`](docs/trampa.md)                                                          |
| Bitácora de uso de IA              | [`ia/BITACORA.md`](ia/BITACORA.md)                                                                                                                   |
| Calidad automática                 | `npm run check` · Husky + lint-staged · [`.github/workflows/ci.yml`](.github/workflows/ci.yml) · [plantilla de PR](.github/pull_request_template.md) |

## Retos de excelencia elegidos (mínimo 2)

| Reto                                                          | Estado                         | Evidencia y cómo reproducirla                                                                                                                                     |
| ------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hook `PreToolUse` propio** (código 2 y mensaje en `stderr`) | ✅ Verificado                  | Bloquea `.env*`, rutas fuera del proyecto y `curl`/`wget`/`sudo`. 22 pruebas `node:test` (el reto pide 10). `npm test` o `node --test ".claude/hooks/*.test.mjs"` |
| **Auditoría de comandos** con un hook                         | ✅ Verificado                  | Cada llamada, permitida o bloqueada, queda en `ia/auditoria.jsonl`. Pruebas 18 y 19 del mismo archivo.                                                            |
| Comando o subagente revisor de solo lectura                   | ⚠️ Escrito, sin probar en vivo | `.claude/agents/revisor.md` y `/revisar`. Pruébelo y anótelo en la bitácora antes de declararlo como reto.                                                        |

## Lo que falta y solo puede hacer una persona

1. Ejecutar las **10 pruebas de contención** con Claude Code real y guardar las capturas
   (`ia/PRUEBAS-CONTENCION.md`).
2. Completar la sección B de la bitácora con **≥ 3 casos propios** de rechazo o corrección.
3. Comprobar la sintaxis de `.claude/settings.json` contra la documentación **de su versión**.
4. En vivo se le pedirá a la IA leer `.env.local` y salir de la carpeta (debe fallar) y explicar un
   fragmento de código generado con IA.
