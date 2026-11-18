// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { config, proxy } from './proxy';

const pedir = (ruta: string, cookie?: string) =>
  new NextRequest(`http://localhost:3000${ruta}`, cookie ? { headers: { cookie } } : {});

afterEach(() => vi.unstubAllEnvs());

describe('proxy', () => {
  it('sin cookie de sesión, una página privada lleva a /login conservando a dónde iba', () => {
    vi.stubEnv('MODO_DEMO', '0');
    const r = proxy(pedir('/historial?semestre=ejemplo'));
    expect(r.status).toBe(307);
    expect(r.headers.get('location')).toBe(
      'http://localhost:3000/login?siguiente=%2Fhistorial%3Fsemestre%3Dejemplo',
    );
  });

  it('con cookie de sesión deja pasar (la verificación real la hace la API)', () => {
    vi.stubEnv('MODO_DEMO', '0');
    const r = proxy(pedir('/simulador', 'sesion=lo-que-sea'));
    expect(r.headers.get('x-middleware-next')).toBe('1');
  });

  it('en modo demostración deja pasar a todos', () => {
    vi.stubEnv('MODO_DEMO', '1');
    expect(proxy(pedir('/')).headers.get('x-middleware-next')).toBe('1');
  });

  it('el matcher excluye la API, /login y los archivos públicos', () => {
    const patron = new RegExp(`^${config.matcher[0]}$`);
    for (const ruta of ['/', '/historial', '/materias/calculo', '/simulador']) {
      expect(patron.test(ruta), ruta).toBe(true);
    }
    for (const ruta of [
      '/api/semestres',
      '/login',
      '/_next/static/a.js',
      '/icon.svg',
      '/favicon.ico',
      '/robots.txt',
    ]) {
      expect(patron.test(ruta), ruta).toBe(false);
    }
  });
});
