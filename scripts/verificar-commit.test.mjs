import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validarMensaje } from './verificar-commit.mjs';

describe('validarMensaje', () => {
  it('acepta tipo, ámbito y descripción', () => {
    assert.equal(validarMensaje('feat(dominio): calcula la nota necesaria\n\ncuerpo'), null);
    assert.equal(validarMensaje('fix: corrige el redondeo'), null);
    assert.equal(validarMensaje('chore!: cambia el esquema de datos'), null);
  });
  it('rechaza mensajes sin tipo o con tipo desconocido', () => {
    assert.match(validarMensaje('arreglos varios'), /tipo/);
    assert.match(validarMensaje('feature: algo'), /tipo/);
  });
  it('rechaza descripción vacía o primera línea demasiado larga', () => {
    assert.match(validarMensaje('feat: '), /tipo/);
    assert.match(validarMensaje(`feat: ${'x'.repeat(100)}`), /100/);
  });
  it('deja pasar los commits de merge', () => {
    assert.equal(validarMensaje("Merge branch 'main' into feature"), null);
  });
});
