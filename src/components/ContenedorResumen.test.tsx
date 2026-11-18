import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { claveDeBorrador, serializarBorrador } from '@/storage/borrador';
import { ContenedorResumen } from './ContenedorResumen';
import { responderConSemestre } from './pruebas-de-datos';

afterEach(() => vi.unstubAllGlobals());

const tarjeta = (nombre: string) => within(screen.getByRole('article', { name: nombre }));

describe('ContenedorResumen · carga, datos, error y vacío', () => {
  it('muestra «cargando» y luego el promedio ponderado y el estado de cada materia', async () => {
    responderConSemestre();
    render(<ContenedorResumen />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando tus materias');

    const resumen = await screen.findByRole('region', { name: /Resumen de 2026-2/ });
    expect(resumen).toHaveTextContent('3,37');
    expect(within(resumen).getByText('12 de 12')).toBeInTheDocument();
    expect(tarjeta('Cálculo diferencial').getByText('Aprobando')).toBeInTheDocument();
    expect(tarjeta('Álgebra lineal').getByText('En riesgo')).toBeInTheDocument();
    expect(tarjeta('Inglés II').getByText('Aprobada')).toBeInTheDocument();
  });

  it('cada materia dice qué necesita y enlaza a su pantalla de notas', async () => {
    responderConSemestre();
    render(<ContenedorResumen />);
    const calculo = await screen.findByRole('article', { name: 'Cálculo diferencial' });
    expect(
      within(calculo).getByText(/Necesitas al menos 2,8 en el 40 % que falta/),
    ).toBeInTheDocument();
    expect(
      within(calculo).getByRole('link', { name: 'Ver y editar notas de Cálculo diferencial' }),
    ).toHaveAttribute('href', '/materias/calculo-diferencial');
  });

  it('si la API falla muestra el error y «Reintentar» vuelve a pedir los datos', async () => {
    const user = userEvent.setup();
    responderConSemestre({ error: 'Error interno.' }, 500);
    render(<ContenedorResumen />);

    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent('No pudimos cargar tus datos');
    expect(alerta).toHaveTextContent('El servidor no pudo entregar los datos');

    responderConSemestre();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('region', { name: /Resumen de/ })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('sin conexión explica qué pasó, sin mostrar detalles técnicos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    render(<ContenedorResumen />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión con el servidor');
    expect(screen.getByRole('alert')).not.toHaveTextContent('Failed to fetch');
  });

  it('sin materias muestra el estado vacío y permite restablecer el ejemplo', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(claveDeBorrador('ejemplo'), serializarBorrador([]));
    responderConSemestre();
    render(<ContenedorResumen />);

    expect(await screen.findByRole('heading', { name: 'Aún no hay materias' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restablecer datos de ejemplo' }));
    expect(await screen.findByRole('region', { name: /Resumen de/ })).toBeInTheDocument();
  });
});

describe('ContenedorResumen · borrador, imprimir', () => {
  it('avisa que son datos de ejemplo y, con borrador, pide confirmar antes de restablecer', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      claveDeBorrador('ejemplo'),
      JSON.stringify({
        version: 1,
        materias: [{ id: 'solo-una', nombre: 'Solo una', creditos: 1, notas: [] }],
      }),
    );
    responderConSemestre();
    render(<ContenedorResumen />);

    await screen.findByRole('article', { name: 'Solo una' });
    expect(screen.getByText(/Tus cambios están guardados como borrador/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Restablecer datos de ejemplo' }));
    const dialogo = screen.getByRole('dialog', { name: '¿Restablecer los datos de ejemplo?' });
    await user.click(within(dialogo).getByRole('button', { name: 'Sí, restablecer' }));

    expect(await screen.findByRole('article', { name: 'Inglés II' })).toBeInTheDocument();
    expect(screen.getByText(/Cuando edites una materia/)).toBeInTheDocument();
  });

  it('«Imprimir resumen» usa window.print; si no existe, ofrece la alternativa', async () => {
    const user = userEvent.setup();
    responderConSemestre();
    render(<ContenedorResumen />);
    await screen.findByRole('region', { name: /Resumen de/ });

    const imprimir = vi.fn();
    vi.stubGlobal('print', imprimir);
    await user.click(screen.getByRole('button', { name: 'Imprimir resumen' }));
    expect(imprimir).toHaveBeenCalledTimes(1);

    vi.stubGlobal('print', undefined);
    await user.click(screen.getByRole('button', { name: 'Imprimir resumen' }));
    await waitFor(() =>
      expect(screen.getByText(/usa una captura de pantalla/)).toBeInTheDocument(),
    );
  });
});
