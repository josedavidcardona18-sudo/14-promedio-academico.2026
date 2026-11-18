import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContenedorMateria } from '@/components/ContenedorMateria';
import { idSchema } from '@/schemas/semestre';
import estilos from '../../paginas.module.css';

export const metadata: Metadata = {
  title: 'Notas de la materia',
  description:
    'Registra las notas de una materia y mira al instante tu promedio y lo que necesitas.',
};

export default async function Materia({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <Link href="/" className={estilos.volver}>
          ← Volver al resumen
        </Link>
        <h1>Notas de la materia</h1>
        <p className={`${estilos.intro} texto-legible`}>
          Escribe las notas y sus porcentajes: el resultado se actualiza mientras escribes.
        </p>
      </div>
      <ContenedorMateria materiaId={id} />
    </div>
  );
}
