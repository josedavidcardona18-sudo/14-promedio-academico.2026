import { vi } from 'vitest';
import { SEMESTRE_DE_EJEMPLO } from '@/repositories/ejemplo';

/** Simula `fetch` para las pruebas de interfaz: devuelve lo que se pida, sin red. */
export function responderConSemestre(cuerpo: unknown = SEMESTRE_DE_EJEMPLO, estado = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(cuerpo), { status: estado })),
  );
}
