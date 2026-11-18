import { ImageResponse } from 'next/og';

export const alt =
  'Calculadora de promedio académico: notas por corte y nota necesaria para aprobar';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function ImagenSocial() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: 80,
        background: '#0b5cad',
        color: '#ffffff',
      }}
    >
      <div style={{ fontSize: 40, opacity: 0.9 }}>Promedio académico</div>
      <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>
        ¿Qué nota necesito para aprobar?
      </div>
      <div style={{ fontSize: 36, marginTop: 32, opacity: 0.9 }}>
        Materias, cortes y promedio ponderado. Tus datos, solo tuyos.
      </div>
    </div>,
    size,
  );
}
