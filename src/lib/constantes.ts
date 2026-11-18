/** Usuario del modo demostración (sin cuentas) y semestre de ejemplo que se le siembra. */
export const UID_DEMO = 'demo';
export const ID_SEMESTRE_DE_EJEMPLO = 'ejemplo';

/** Frecuencia máxima por IP y ruta en operaciones que escriben o inician sesión. */
export const LIMITE_ESCRITURA = { maximo: 60, ventanaMs: 60_000 } as const;
export const LIMITE_SESION = { maximo: 10, ventanaMs: 60_000 } as const;
