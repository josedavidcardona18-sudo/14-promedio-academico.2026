import { describe, expect, it } from 'vitest';
import { rutaSegura } from './redireccion';

describe('rutaSegura', () => {
  it('acepta rutas del sitio, con consulta', () => {
    expect(rutaSegura('/simulador')).toBe('/simulador');
    expect(rutaSegura('/historial?semestre=ejemplo')).toBe('/historial?semestre=ejemplo');
  });

  it('descarta todo lo que saldría del sitio (redirección abierta)', () => {
    for (const malo of [
      '//malo.com',
      'https://malo.com',
      '/\\malo.com',
      'javascript:alert(1)',
      'malo',
      '',
      '/a\nb',
    ]) {
      expect(rutaSegura(malo), malo).toBe('/');
    }
  });

  it('sin valor, con varios valores o apuntando al propio login, vuelve al inicio', () => {
    expect(rutaSegura(undefined)).toBe('/');
    expect(rutaSegura(['/a', '/b'])).toBe('/');
    expect(rutaSegura('/login?siguiente=/')).toBe('/');
  });
});
