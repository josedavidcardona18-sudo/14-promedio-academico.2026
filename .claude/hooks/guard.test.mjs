import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { evaluar } from './guard.mjs';

const PROYECTO = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const GUARD = fileURLToPath(new URL('./guard.mjs', import.meta.url));

const bash = (command) =>
  evaluar({ tool_name: 'Bash', tool_input: { command }, cwd: PROYECTO }, PROYECTO);
const archivo = (tool_name, file_path) =>
  evaluar({ tool_name, tool_input: { file_path }, cwd: PROYECTO }, PROYECTO);

describe('guard · secretos', () => {
  it('1. bloquea leer .env.local', () => {
    assert.match(archivo('Read', '.env.local'), /secretos/);
  });
  it('2. permite leer env.example (valores falsos)', () => {
    assert.equal(archivo('Read', 'env.example'), null);
  });
  it('3. bloquea cat .env.local en Bash', () => {
    assert.match(bash('cat .env.local'), /secretos/);
  });
  it('4. bloquea claves .pem y cuentas de servicio de Firebase', () => {
    assert.match(archivo('Read', 'certs/servidor.pem'), /secretos/);
    assert.match(archivo('Read', 'mi-firebase-adminsdk-abc.json'), /secretos/);
  });
  it('5. bloquea Grep con glob hacia .env*', () => {
    const entrada = { tool_name: 'Grep', tool_input: { pattern: 'CANARIO', glob: '.env*' } };
    assert.match(evaluar(entrada, PROYECTO), /secretos/);
  });
});

describe('guard · búsquedas', () => {
  it('5b. buscar el texto «process.env» con Grep NO se confunde con un archivo .env', () => {
    const entrada = { tool_name: 'Grep', tool_input: { pattern: 'process\\.env', path: 'src' } };
    assert.equal(evaluar(entrada, PROYECTO), null);
  });
  it('5c. Glob hacia **/.env* se bloquea', () => {
    const entrada = { tool_name: 'Glob', tool_input: { pattern: '**/.env*' } };
    assert.match(evaluar(entrada, PROYECTO), /secretos/);
  });
});

describe('guard · carpeta del proyecto', () => {
  it('6. permite leer un archivo del proyecto', () => {
    assert.equal(archivo('Read', 'src/domain/calculo.ts'), null);
  });
  it('7. bloquea rutas absolutas ajenas y el home', () => {
    assert.match(archivo('Read', '/etc/passwd'), /fuera de la carpeta/);
    assert.match(bash('cat ~/.bashrc'), /fuera de la carpeta/);
  });
  it('8. bloquea ls .. y rutas con ../', () => {
    assert.match(bash('ls ..'), /fuera de la carpeta/);
    assert.match(bash('cat ../otro-proyecto/index.js'), /fuera de la carpeta/);
  });
  it('9. bloquea editar la configuración de la IA, pero deja leerla', () => {
    assert.match(archivo('Edit', '.claude/settings.json'), /configuración/);
    assert.equal(archivo('Read', '.claude/settings.json'), null);
  });
});

describe('guard · red y acciones con efecto', () => {
  it('10. bloquea curl, /usr/bin/curl, wget y sh -c con curl', () => {
    assert.match(bash('curl https://ejemplo.com'), /curl/);
    assert.match(bash('/usr/bin/curl https://ejemplo.com'), /curl/);
    assert.match(bash("sh -c 'wget https://ejemplo.com'"), /wget/);
  });
  it('11. bloquea sudo, rm -rf y vercel env pull', () => {
    assert.match(bash('sudo apt-get install x'), /sudo/);
    assert.match(bash('rm -rf node_modules'), /rm -rf/);
    assert.match(bash('vercel env pull .env.local'), /vercel env pull|secretos/);
  });
  it('12. bloquea git push --force y git reset --hard', () => {
    assert.match(bash('git push origin main --force'), /force/);
    assert.match(bash('git reset --hard HEAD~1'), /reset --hard/);
  });
  it('13. permite los comandos normales del proyecto', () => {
    assert.equal(bash('npm run check'), null);
    assert.equal(bash('git diff --stat'), null);
    assert.equal(bash('git status'), null);
  });
  it('14. ignora herramientas que no toca (p. ej. WebSearch)', () => {
    assert.equal(
      evaluar({ tool_name: 'WebSearch', tool_input: { query: 'curl' } }, PROYECTO),
      null,
    );
  });
});

describe('guard · como proceso (contrato con Claude Code)', () => {
  const ejecutar = (entrada) =>
    spawnSync('node', [GUARD], {
      input: entrada,
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: PROYECTO },
    });

  it('15. sale con código 2 y escribe el motivo en stderr cuando bloquea', () => {
    const r = ejecutar(
      JSON.stringify({ tool_name: 'Read', tool_input: { file_path: '.env.local' }, cwd: PROYECTO }),
    );
    assert.equal(r.status, 2);
    assert.match(r.stderr, /BLOQUEADO/);
  });
  it('16. sale con código 0 cuando permite', () => {
    const r = ejecutar(
      JSON.stringify({
        tool_name: 'Bash',
        tool_input: { command: 'npm run check' },
        cwd: PROYECTO,
      }),
    );
    assert.equal(r.status, 0);
  });
  it('17. si la entrada no es JSON, bloquea (falla cerrado)', () => {
    assert.equal(ejecutar('esto no es json').status, 2);
  });
});
