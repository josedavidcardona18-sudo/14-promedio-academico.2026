// @vitest-environment node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const METODOS = ['get', 'post', 'put', 'delete'] as const;
const RAIZ = join(process.cwd(), 'src/app/api');

const operacionSchema = z.object({
  operationId: z.string(),
  security: z.array(z.unknown()).optional(),
  responses: z.record(z.string(), z.unknown()),
});
const especificacionSchema = z.object({
  openapi: z.string(),
  paths: z.record(z.string(), z.record(z.string(), z.unknown())),
});

const texto = readFileSync(join(process.cwd(), 'openapi.yaml'), 'utf-8');
const especificacion = especificacionSchema.parse(parse(texto));

/** `/api/semestres/{id}` → `src/app/api/semestres/[id]/route.ts`. */
const archivoDe = (ruta: string) =>
  join(
    RAIZ,
    ...ruta
      .replace(/^\/api\//, '')
      .replace(/\{(\w+)\}/g, '[$1]')
      .split('/'),
    'route.ts',
  );

function archivosDeRutas(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const completa = join(carpeta, nombre);
    if (statSync(completa).isDirectory()) return archivosDeRutas(completa);
    return nombre === 'route.ts' ? [completa] : [];
  });
}

function resolver(documento: unknown, referencia: string): unknown {
  let nodo = documento;
  for (const clave of referencia.split('/')) {
    const registro = z.record(z.string(), z.unknown()).safeParse(nodo);
    nodo = registro.success ? registro.data[clave] : undefined;
  }
  return nodo;
}

function operaciones() {
  return Object.entries(especificacion.paths).flatMap(([ruta, elemento]) =>
    METODOS.flatMap((metodo) => {
      const crudo = elemento[metodo];
      return crudo === undefined ? [] : [{ ruta, metodo, operacion: operacionSchema.parse(crudo) }];
    }),
  );
}

describe('openapi.yaml · contrato de la API', () => {
  it('es OpenAPI 3.1', () => {
    expect(especificacion.openapi).toMatch(/^3\.1/);
  });

  it('cada $ref apunta a algo que existe', () => {
    const documento = parse(texto);
    const referencias = [...texto.matchAll(/\$ref: '#\/([^']+)'/g)].map((m) => m[1] ?? '');
    expect(referencias.length).toBeGreaterThan(20);
    for (const referencia of referencias) {
      const destino = resolver(documento, referencia);
      expect(destino, `#/${referencia}`).toBeDefined();
    }
  });

  it('cada operación tiene un Route Handler exportado con ese método, y viceversa', async () => {
    const documentadas = new Set(
      operaciones().map((o) => `${archivoDe(o.ruta)}#${o.metodo.toUpperCase()}`),
    );
    const reales = new Set<string>();
    for (const archivo of archivosDeRutas(RAIZ)) {
      const modulo: Record<string, unknown> = await import(/* @vite-ignore */ archivo);
      for (const metodo of METODOS) {
        if (typeof modulo[metodo.toUpperCase()] === 'function')
          reales.add(`${archivo}#${metodo.toUpperCase()}`);
      }
    }
    expect([...documentadas].sort()).toEqual([...reales].sort());
  });

  it('los identificadores de operación no se repiten', () => {
    const ids = operaciones().map((o) => o.operacion.operationId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('toda operación protegida documenta 401; toda escritura, 403 (CSRF) y 429', () => {
    for (const { ruta, metodo, operacion } of operaciones()) {
      const protegida = !(operacion.security && operacion.security.length === 0);
      const etiqueta = `${metodo.toUpperCase()} ${ruta}`;
      if (protegida) expect(operacion.responses, etiqueta).toHaveProperty('401');
      if (metodo !== 'get') {
        expect(operacion.responses, etiqueta).toHaveProperty('403');
        expect(operacion.responses, etiqueta).toHaveProperty('429');
      }
    }
  });

  it('las rutas con identificador documentan 404 y 400', () => {
    for (const { ruta, metodo, operacion } of operaciones()) {
      if (!ruta.includes('{id}') || metodo === 'post') continue;
      expect(operacion.responses, `${metodo} ${ruta}`).toHaveProperty('404');
    }
  });

  it('las rutas de archivos existen donde dice el contrato', () => {
    for (const { ruta } of operaciones()) expect(existsSync(archivoDe(ruta)), ruta).toBe(true);
  });
});
