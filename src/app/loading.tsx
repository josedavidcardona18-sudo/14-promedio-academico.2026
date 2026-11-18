import { Esqueleto } from '@/components/EstadosDeDatos';

/** Se muestra mientras Next prepara la ruta. */
export default function Cargando() {
  return (
    <div className="contenedor">
      <Esqueleto />
    </div>
  );
}
