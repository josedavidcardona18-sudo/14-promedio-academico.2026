// Verifica que el mensaje de commit siga Conventional Commits. Lo llama el hook commit-msg de Husky.
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const TIPOS = 'feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert';
const PRIMERA_LINEA = new RegExp(`^(${TIPOS})(\\([^)\\s][^)]*\\))?!?: \\S.{2,}$`);
const LARGO_MAXIMO = 100;

/** Devuelve null si el mensaje es válido, o el motivo por el que no lo es. */
export function validarMensaje(mensaje) {
  const linea = mensaje.split(/\r?\n/)[0] ?? '';
  if (/^(Merge|Revert) /.test(linea)) return null;
  if (linea.length > LARGO_MAXIMO) return `la primera línea supera ${LARGO_MAXIMO} caracteres`;
  if (!PRIMERA_LINEA.test(linea)) {
    return `use «tipo(ámbito opcional): descripción». Tipos: ${TIPOS.replaceAll('|', ', ')}`;
  }
  return null;
}

function main() {
  const archivo = process.argv[2];
  if (!archivo) {
    process.stderr.write('Uso: node scripts/verificar-commit.mjs <archivo-del-mensaje>\n');
    process.exit(1);
  }
  const motivo = validarMensaje(readFileSync(archivo, 'utf8'));
  if (motivo) {
    process.stderr.write(`Commit rechazado (Conventional Commits): ${motivo}.\n`);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
