import { describe, expect, it } from 'vitest';
import { SEMESTRE_DE_EJEMPLO } from '@/repositories/ejemplo';
import { claveDeBorrador, leerBorrador, serializarBorrador } from './borrador';

const materias = SEMESTRE_DE_EJEMPLO.materias;

describe('borrador', () => {
  it('ida y vuelta sin perder nada', () => {
    expect(leerBorrador(serializarBorrador(materias))).toEqual(materias);
  });

  it('sin nada guardado no hay borrador', () => {
    expect(leerBorrador(null)).toBeNull();
  });

  it('texto corrupto o de otra forma → se ignora, sin lanzar error', () => {
    for (const malo of ['{no es json', '[]', 'null', '{"version":2,"materias":[]}']) {
      expect(leerBorrador(malo)).toBeNull();
    }
  });

  it('una materia que no cumple las reglas del documento invalida todo el borrador', () => {
    const conNota55 = materias.map((m, i) =>
      i === 0 ? { ...m, notas: [{ nombre: 'Parcial', valor: 5.5, porcentaje: 30 }] } : m,
    );
    expect(leerBorrador(JSON.stringify({ version: 1, materias: conNota55 }))).toBeNull();
    const conCampoExtra = { version: 1, materias, rol: 'admin' };
    expect(leerBorrador(JSON.stringify(conCampoExtra))).toBeNull();
  });

  it('la clave incluye el semestre, así cada semestre tiene su borrador', () => {
    expect(claveDeBorrador('ejemplo')).toBe('promedio-academico:borrador:ejemplo');
  });
});
