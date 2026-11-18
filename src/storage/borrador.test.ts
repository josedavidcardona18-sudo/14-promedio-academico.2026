import { describe, expect, it } from 'vitest';
import { claveDeBorrador, leerBorrador, serializarBorrador } from './borrador';

const materia = {
  nombre: 'Física',
  creditos: 3,
  notas: [{ nombre: 'Parcial 1', valor: 4, porcentaje: 30 }],
};

describe('borrador', () => {
  it('ida y vuelta sin perder nada', () => {
    expect(leerBorrador(serializarBorrador(materia))).toEqual(materia);
  });

  it('sin nada guardado no hay borrador', () => {
    expect(leerBorrador(null)).toBeNull();
  });

  it('texto corrupto o de otra forma → se ignora, sin lanzar error', () => {
    for (const malo of ['{no es json', '[]', 'null', '{"version":2,"materia":{}}']) {
      expect(leerBorrador(malo)).toBeNull();
    }
  });

  it('un borrador que no cumple las reglas del documento se descarta', () => {
    const conNota55 = { ...materia, notas: [{ nombre: 'P', valor: 5.5, porcentaje: 30 }] };
    expect(leerBorrador(JSON.stringify({ version: 1, materia: conNota55 }))).toBeNull();
    expect(leerBorrador(JSON.stringify({ version: 1, materia, rol: 'admin' }))).toBeNull();
  });

  it('la clave incluye semestre y materia: cada materia tiene su borrador', () => {
    expect(claveDeBorrador('ejemplo', 'ingles-ii')).toBe(
      'promedio-academico:borrador:ejemplo:ingles-ii',
    );
  });
});
