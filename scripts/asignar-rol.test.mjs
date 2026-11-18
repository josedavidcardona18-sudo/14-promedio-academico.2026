import assert from 'node:assert/strict';
import { test } from 'node:test';
import { asignarRol, leerClave } from './asignar-rol.mjs';

function authFalso(persona) {
  const llamadas = [];
  return {
    llamadas,
    getUserByEmail: async (correo) => {
      llamadas.push(['getUserByEmail', correo]);
      if (!persona) throw Object.assign(new Error('no existe'), { code: 'auth/user-not-found' });
      return persona;
    },
    setCustomUserClaims: async (uid, claims) => llamadas.push(['setCustomUserClaims', uid, claims]),
  };
}

test('asigna el rol conservando los demás claims', async () => {
  const auth = authFalso({ uid: 'u1', email: 'ana@correo.com', customClaims: { otro: true } });
  const r = await asignarRol(auth, 'ana@correo.com', 'admin');
  assert.deepEqual(r, { uid: 'u1', correo: 'ana@correo.com', rol: 'admin' });
  assert.deepEqual(auth.llamadas.at(-1), [
    'setCustomUserClaims',
    'u1',
    { otro: true, rol: 'admin' },
  ]);
});

test('una persona sin claims previos también funciona', async () => {
  const auth = authFalso({ uid: 'u2', email: 'beto@correo.com' });
  await asignarRol(auth, 'beto@correo.com', 'estudiante');
  assert.deepEqual(auth.llamadas.at(-1), ['setCustomUserClaims', 'u2', { rol: 'estudiante' }]);
});

test('un rol inventado se rechaza antes de tocar Firebase', async () => {
  const auth = authFalso({ uid: 'u3' });
  await assert.rejects(() => asignarRol(auth, 'x@correo.com', 'superusuario'), /debe ser uno de/);
  assert.equal(auth.llamadas.length, 0);
});

test('si la persona no existe, el error de Firebase sale tal cual', async () => {
  await assert.rejects(() => asignarRol(authFalso(null), 'nadie@correo.com', 'admin'), /no existe/);
});

test('leerClave entiende los saltos de línea reales, los \\n literales y las comillas', () => {
  const pem = '-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----\n';
  assert.equal(leerClave(pem), pem);
  assert.equal(leerClave(pem.replaceAll('\n', '\\n')), pem);
  assert.equal(leerClave(`"${pem.replaceAll('\n', '\\n')}"`), pem);
  assert.equal(leerClave(`'${pem}'`), pem);
});
