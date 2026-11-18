import { describe, expect, it } from 'vitest';
import {
  cuerpoSesionSchema,
  idSchema,
  listaQuerySchema,
  materiaCreacionSchema,
  materiaEntradaSchema,
  metaSchema,
  notaSchema,
  semestreConMateriasSchema,
  semestreEntradaSchema,
} from './semestre';

const mensajes = (resultado: { success: boolean; error?: { issues: { message: string }[] } }) =>
  resultado.error?.issues.map((i) => i.message) ?? [];

const nota = (valor: unknown, porcentaje: unknown = 30, nombre: unknown = 'Parcial') => ({
  nombre,
  valor,
  porcentaje,
});

describe('notaSchema · el valor de una nota', () => {
  it('acepta de 0,0 a 5,0 con un decimal y también «sin nota» (null)', () => {
    for (const valor of [0, 0.5, 3, 4.5, 5, null]) {
      expect(notaSchema.safeParse(nota(valor)).success).toBe(true);
    }
  });

  it('rechaza 5,5 con un mensaje claro (criterio del documento)', () => {
    expect(mensajes(notaSchema.safeParse(nota(5.5)))).toEqual(['La nota no puede pasar de 5,0.']);
  });

  it('rechaza negativos, más de un decimal y lo que no es número', () => {
    expect(mensajes(notaSchema.safeParse(nota(-0.1)))).toEqual([
      'La nota no puede ser menor que 0,0.',
    ]);
    expect(mensajes(notaSchema.safeParse(nota(3.45)))).toEqual(['La nota admite un solo decimal.']);
    expect(mensajes(notaSchema.safeParse(nota('abc')))).toEqual(['Escribe un número.']);
  });

  it('tolera el ruido de coma flotante de un valor válido, pero no un decimal de más', () => {
    expect(notaSchema.safeParse(nota(0.1 + 0.2)).success).toBe(true);
    expect(notaSchema.safeParse(nota(3.30000001)).success).toBe(false);
  });
});

describe('notaSchema · porcentaje y nombre', () => {
  it('el porcentaje va de 0 a 100 con un decimal', () => {
    expect(notaSchema.safeParse(nota(3, 33.3)).success).toBe(true);
    expect(mensajes(notaSchema.safeParse(nota(3, 101)))).toEqual([
      'El porcentaje no puede pasar de 100.',
    ]);
    expect(mensajes(notaSchema.safeParse(nota(3, 33.33)))).toEqual([
      'El porcentaje admite un solo decimal.',
    ]);
  });

  it('el nombre es obligatorio y se recorta', () => {
    expect(mensajes(notaSchema.safeParse(nota(3, 30, '   ')))).toEqual([
      'Escribe el nombre de la nota.',
    ]);
    const ok = notaSchema.safeParse(nota(3, 30, '  Quiz  '));
    expect(ok.success && ok.data.nombre).toBe('Quiz');
  });
});

describe('materiaEntradaSchema', () => {
  const materia = (notas: unknown[], extra: object = {}) => ({
    nombre: 'Cálculo',
    creditos: 4,
    notas,
    ...extra,
  });

  it('acepta porcentajes que suman 100 o menos (lo que falta es lo pendiente)', () => {
    expect(materiaEntradaSchema.safeParse(materia([nota(4, 60), nota(3, 40)])).success).toBe(true);
    expect(materiaEntradaSchema.safeParse(materia([nota(4, 30), nota(3, 30)])).success).toBe(true);
    expect(materiaEntradaSchema.safeParse(materia([])).success).toBe(true);
  });

  it('rechaza porcentajes que suman 110 % (criterio del documento)', () => {
    const r = materiaEntradaSchema.safeParse(materia([nota(4, 60), nota(3, 50)]));
    expect(mensajes(r)).toEqual(['Los porcentajes suman 110 %; no pueden pasar de 100 %.']);
    expect(r.error?.issues[0]?.path).toEqual(['notas']);
  });

  it('suma bien con decimales (33,3 + 33,3 + 33,4 = 100, no 100,00000000000001)', () => {
    const r = materiaEntradaSchema.safeParse(
      materia([nota(3, 33.3), nota(3, 33.3), nota(3, 33.4)]),
    );
    expect(r.success).toBe(true);
  });

  it('los créditos son un entero entre 1 y 20', () => {
    for (const creditos of [0, 2.5, 21]) {
      expect(materiaEntradaSchema.safeParse(materia([], { creditos })).success).toBe(false);
    }
  });

  it('modo estricto: un campo desconocido se rechaza (evita mass assignment)', () => {
    const r = materiaEntradaSchema.safeParse(materia([], { rol: 'admin', uid: 'otro' }));
    expect(r.success).toBe(false);
  });
});

describe('metaSchema, idSchema y semestre completo', () => {
  it('la meta va de 3,0 a 5,0 con un decimal', () => {
    for (const meta of [3, 3.5, 5]) expect(metaSchema.safeParse(meta).success).toBe(true);
    expect(mensajes(metaSchema.safeParse(2.9))).toEqual(['La meta no puede ser menor que 3,0.']);
    expect(mensajes(metaSchema.safeParse(5.1))).toEqual(['La meta no puede pasar de 5,0.']);
    expect(metaSchema.safeParse(4.25).success).toBe(false);
  });

  it('un identificador solo lleva letras, números y guiones', () => {
    expect(idSchema.safeParse('ejemplo').success).toBe(true);
    expect(idSchema.safeParse('calculo-diferencial').success).toBe(true);
    for (const malo of ['', '../etc', 'a b', '-x', 'x'.repeat(41)]) {
      expect(idSchema.safeParse(malo).success).toBe(false);
    }
  });

  it('un semestre con sus materias se valida entero', () => {
    const semestre = {
      id: 'ejemplo',
      creadoEn: '2026-08-01T00:00:00.000Z',
      nombre: '2026-2',
      meta: 3,
      materias: [{ id: 'calculo', nombre: 'Cálculo', creditos: 4, notas: [nota(4, 30)] }],
    };
    expect(semestreConMateriasSchema.safeParse(semestre).success).toBe(true);
    const roto = { ...semestre, materias: [{ ...semestre.materias[0], creditos: 0 }] };
    expect(semestreConMateriasSchema.safeParse(roto).success).toBe(false);
  });
});

describe('esquemas de la API de escritura', () => {
  it('al crear una materia las notas son opcionales y quedan vacías', () => {
    const r = materiaCreacionSchema.safeParse({ nombre: 'Física', creditos: 3 });
    expect(r.success && r.data.notas).toEqual([]);
  });

  it('al reemplazar una materia (PUT) las notas son obligatorias', () => {
    expect(materiaEntradaSchema.safeParse({ nombre: 'Física', creditos: 3 }).success).toBe(false);
  });

  it('el semestre de entrada pide nombre y una meta de 3,0 a 5,0, y nada más', () => {
    expect(semestreEntradaSchema.safeParse({ nombre: '2026-2', meta: 3.5 }).success).toBe(true);
    expect(semestreEntradaSchema.safeParse({ nombre: '2026-2', meta: 2 }).success).toBe(false);
    expect(
      semestreEntradaSchema.safeParse({ nombre: '2026-2', meta: 3, uid: 'otro' }).success,
    ).toBe(false);
  });

  it('la paginación: límite por defecto 20, máximo 100, cursor opcional', () => {
    const vacio = listaQuerySchema.safeParse({});
    expect(vacio.success && vacio.data.limite).toBe(20);
    const texto = listaQuerySchema.safeParse({ limite: '50', cursor: 'abc-1' });
    expect(texto.success && [texto.data.limite, texto.data.cursor]).toEqual([50, 'abc-1']);
    expect(listaQuerySchema.safeParse({ limite: '101' }).success).toBe(false);
    expect(listaQuerySchema.safeParse({ limite: '0' }).success).toBe(false);
    expect(listaQuerySchema.safeParse({ cursor: '../x' }).success).toBe(false);
  });

  it('el cuerpo de la sesión solo lleva el token', () => {
    expect(cuerpoSesionSchema.safeParse({ idToken: 'x'.repeat(30) }).success).toBe(true);
    expect(cuerpoSesionSchema.safeParse({ idToken: 'corto' }).success).toBe(false);
    expect(cuerpoSesionSchema.safeParse({ idToken: 'x'.repeat(30), rol: 'admin' }).success).toBe(
      false,
    );
  });
});
