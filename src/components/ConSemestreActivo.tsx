'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import type { SemestreConMaterias } from '@/schemas/semestre';
import { ConSemestres, type DatosCuenta } from './ConSemestres';
import { EstadoSinSemestres } from './EstadoSinSemestres';
import { SelectorSemestre } from './SelectorSemestre';

export interface DatosActivo extends DatosCuenta {
  semestre: SemestreConMaterias;
}

interface Props {
  /** En la pantalla de una materia el semestre no se cambia (la materia pertenece a uno). */
  selector?: boolean;
  children: (datos: DatosActivo) => ReactNode;
}

function Activo({ datos, selector, children }: Props & { datos: DatosCuenta }) {
  const parametros = useSearchParams();
  const router = useRouter();
  const ruta = usePathname();
  const pedido = parametros.get('semestre');
  const semestre = datos.semestres.find((s) => s.id === pedido) ?? datos.semestres[0];
  if (!semestre) return <EstadoSinSemestres acciones={datos.acciones} />;
  return (
    <>
      {selector && (
        <SelectorSemestre
          semestres={datos.semestres}
          activoId={semestre.id}
          onElegir={(id) => router.replace(`${ruta}?semestre=${encodeURIComponent(id)}`)}
        />
      )}
      {children({ ...datos, semestre })}
    </>
  );
}

/**
 * Elige el semestre con el que se trabaja: el de `?semestre=` o, si no hay, el más reciente.
 * Resuelve también el estado vacío (sin semestres) con «Cargar datos de ejemplo».
 */
export function ConSemestreActivo({ selector = true, children }: Props) {
  return (
    <ConSemestres>
      {(datos) => (
        <Activo datos={datos} selector={selector}>
          {children}
        </Activo>
      )}
    </ConSemestres>
  );
}
