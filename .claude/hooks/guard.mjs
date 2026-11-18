#!/usr/bin/env node
// Hook PreToolUse: bloquea (exit 2 + mensaje en stderr) lo que AGENTS.md prohíbe.
// Es una capa más: NO sustituye al sandbox ni a no tener secretos reales en el disco.
import { appendFileSync, mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERRAMIENTAS_DE_ARCHIVO = new Set(['Read', 'Edit', 'Write', 'NotebookEdit', 'MultiEdit']);
const HERRAMIENTAS_DE_ESCRITURA = new Set(['Edit', 'Write', 'NotebookEdit', 'MultiEdit']);
const SENSIBLE = /(^|\/)(\.env($|\.[^/]*)|[^/]*\.(pem|key|p12)|[^/]*firebase-adminsdk[^/]*\.json)$/;
// Un filtro de búsqueda (glob) como «.env*» o «**/*.pem» también apunta a secretos.
const SENSIBLE_EN_FILTRO = /(^|\/)\.env|\.(pem|key|p12)\b|firebase-adminsdk/;
const PROHIBIDOS_EN_BASH = [
  [/(^|[\s;&|(`$'"])(\S*\/)?(curl|wget|sudo)(\s|$)/, 'curl, wget y sudo están prohibidos'],
  [/\bgit\s+push\b[^;&|]*(\s--force\S*|\s-f\b)/, 'git push --force está prohibido'],
  [/\bgit\s+reset\s+--hard/, 'git reset --hard está prohibido'],
  [/\brm\s+-\w*[rR]\w*[fF]|\brm\s+-\w*[fF]\w*[rR]/, 'rm -rf está prohibido'],
  [/\bvercel\s+env\s+pull/, 'vercel env pull baja secretos de producción al disco'],
];

function normalizar(ruta) {
  return ruta.replaceAll('\\', '/');
}

function resolver(ruta, cwd) {
  const conHome =
    ruta === '~' || ruta.startsWith('~/') ? path.join(homedir(), ruta.slice(1)) : ruta;
  const absoluta = path.resolve(cwd, conHome);
  try {
    return realpathSync(absoluta);
  } catch {
    return absoluta;
  }
}

function estaDentro(absoluta, proyecto) {
  const relativa = path.relative(proyecto, absoluta);
  return (
    relativa === '' ||
    (relativa !== '..' && !relativa.startsWith(`..${path.sep}`) && !path.isAbsolute(relativa))
  );
}

function motivoDeRuta(ruta, cwd, proyecto, escribe) {
  const absoluta = resolver(ruta, cwd);
  if (SENSIBLE.test(normalizar(absoluta))) return `«${ruta}» es un archivo con secretos`;
  if (!estaDentro(absoluta, proyecto)) return `«${ruta}» está fuera de la carpeta del proyecto`;
  if (escribe && estaDentro(absoluta, path.join(proyecto, '.claude'))) {
    return 'la IA no puede modificar su propia configuración (.claude/)';
  }
  return null;
}

function pareceRuta(token) {
  return token.startsWith('~') || token.startsWith('/') || token === '..' || token.includes('../');
}

function motivoDeBash(comando, cwd, proyecto) {
  for (const [patron, motivo] of PROHIBIDOS_EN_BASH) if (patron.test(comando)) return motivo;
  for (const token of comando.split(/[\s;&|<>()'"`]+/).filter(Boolean)) {
    if (SENSIBLE.test(normalizar(token))) return `«${token}» es un archivo con secretos`;
    if (token === '/dev/null' || !pareceRuta(token)) continue;
    const motivo = motivoDeRuta(token, cwd, proyecto, false);
    if (motivo) return motivo;
  }
  return null;
}

function motivoDeBusqueda(herramienta, datos, cwd, proyecto) {
  // En Glob el filtro es `pattern`; en Grep, `pattern` es el texto buscado y el filtro es `glob`.
  const filtro = herramienta === 'Glob' ? datos.pattern : datos.glob;
  if (typeof filtro === 'string' && SENSIBLE_EN_FILTRO.test(normalizar(filtro))) {
    return `«${filtro}» apunta a archivos con secretos`;
  }
  return typeof datos.path === 'string' ? motivoDeRuta(datos.path, cwd, proyecto, false) : null;
}

/** Devuelve el motivo del bloqueo, o null si la llamada es aceptable. */
export function evaluar(entrada, proyecto) {
  const herramienta = entrada.tool_name;
  const datos = entrada.tool_input ?? {};
  const cwd = entrada.cwd ?? proyecto;
  if (herramienta === 'Bash') return motivoDeBash(String(datos.command ?? ''), cwd, proyecto);
  if (herramienta === 'Glob' || herramienta === 'Grep') {
    return motivoDeBusqueda(herramienta, datos, cwd, proyecto);
  }
  if (!HERRAMIENTAS_DE_ARCHIVO.has(herramienta)) return null;
  const ruta = datos.file_path ?? datos.notebook_path;
  if (typeof ruta !== 'string') return null;
  return motivoDeRuta(ruta, cwd, proyecto, HERRAMIENTAS_DE_ESCRITURA.has(herramienta));
}

/** Registro de auditoría: qué intentó hacer la IA y qué se decidió. Nunca debe estorbar al hook. */
function registrar(proyecto, entrada, motivo) {
  try {
    const datos = entrada.tool_input ?? {};
    const resumen = String(datos.command ?? datos.file_path ?? datos.path ?? datos.pattern ?? '');
    mkdirSync(path.join(proyecto, 'ia'), { recursive: true });
    const linea = {
      momento: new Date().toISOString(),
      herramienta: entrada.tool_name,
      resumen: resumen.slice(0, 200),
      decision: motivo ? 'bloqueado' : 'permitido',
      ...(motivo && { motivo }),
    };
    appendFileSync(path.join(proyecto, 'ia', 'auditoria.jsonl'), `${JSON.stringify(linea)}\n`);
  } catch {
    // Si no se puede escribir, el bloqueo (o el permiso) igual se aplica.
  }
}

function bloquear(motivo) {
  process.stderr.write(`BLOQUEADO por .claude/hooks/guard.mjs: ${motivo}.\n`);
  process.exit(2);
}

function main() {
  let entrada;
  try {
    entrada = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return bloquear('la entrada del hook no es JSON válido');
  }
  const proyecto = resolver(process.env.CLAUDE_PROJECT_DIR ?? entrada.cwd ?? process.cwd(), '/');
  const motivo = evaluar(entrada, proyecto);
  registrar(proyecto, entrada, motivo);
  if (motivo) bloquear(motivo);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
