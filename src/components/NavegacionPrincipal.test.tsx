import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { violacionesDeAccesibilidad } from '../../vitest.axe';
import { NavegacionPrincipal } from './NavegacionPrincipal';
import { reiniciarNavegacion } from './pruebas-de-datos';

vi.mock('next/navigation', async () => (await import('./pruebas-de-datos')).moduloNavegacionFalso);

beforeEach(() => reiniciarNavegacion('/simulador', 'semestre=2027-1'));

const boton = () => screen.getByRole('button', { name: 'Menú' });

describe('NavegacionPrincipal · menú colapsable', () => {
  it('es una navegación con nombre y un botón que controla la lista, cerrado al empezar', () => {
    render(<NavegacionPrincipal />);
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
    expect(boton()).toHaveAttribute('aria-expanded', 'false');
    const lista = screen.getByRole('list');
    expect(boton()).toHaveAttribute('aria-controls', lista.id);
    expect(lista).toHaveAttribute('data-abierto', 'false');
  });

  it('los enlaces llevan al semestre elegido y marcan la página actual', () => {
    render(<NavegacionPrincipal />);
    expect(screen.getByRole('link', { name: 'Resumen' })).toHaveAttribute(
      'href',
      '/?semestre=2027-1',
    );
    expect(screen.getByRole('link', { name: 'Simulador' })).toHaveAttribute(
      'href',
      '/simulador?semestre=2027-1',
    );
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute('href', '/historial');
    expect(screen.getByRole('link', { name: 'Simulador' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Resumen' })).not.toHaveAttribute('aria-current');
  });

  it('sin semestre elegido los enlaces no llevan consulta', () => {
    reiniciarNavegacion('/', '');
    render(<NavegacionPrincipal />);
    expect(screen.getByRole('link', { name: 'Simulador' })).toHaveAttribute('href', '/simulador');
  });

  it('el botón abre y cierra el menú y lo anuncia con aria-expanded', async () => {
    const user = userEvent.setup();
    render(<NavegacionPrincipal />);
    await user.click(boton());
    expect(boton()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('list')).toHaveAttribute('data-abierto', 'true');
    await user.click(boton());
    expect(boton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('con el teclado: Enter abre, Tab recorre los enlaces y Esc cierra devolviendo el foco al botón', async () => {
    const user = userEvent.setup();
    render(<NavegacionPrincipal />);
    await user.tab();
    expect(boton()).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(boton()).toHaveAttribute('aria-expanded', 'true');
    await user.tab();
    expect(screen.getByRole('link', { name: 'Resumen' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(boton()).toHaveAttribute('aria-expanded', 'false');
    expect(boton()).toHaveFocus();
  });

  it('Esc con el menú cerrado no hace nada', async () => {
    const user = userEvent.setup();
    render(<NavegacionPrincipal />);
    await user.tab();
    await user.keyboard('{Escape}');
    expect(boton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('elegir un enlace cierra el menú', async () => {
    const user = userEvent.setup();
    render(<NavegacionPrincipal />);
    await user.click(boton());
    await user.click(screen.getByRole('link', { name: 'Historial' }));
    expect(boton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('si el foco sale del menú hacia otro control, se cierra (no queda tapando lo que se enfoca)', async () => {
    const user = userEvent.setup();
    render(
      <>
        <NavegacionPrincipal />
        <button type="button">Otro control</button>
      </>,
    );
    await user.click(boton());
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Otro control' })).toHaveFocus();
    expect(boton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('sin violaciones de accesibilidad (axe) con el menú cerrado y abierto', async () => {
    const user = userEvent.setup();
    const { container } = render(<NavegacionPrincipal />);
    expect(await violacionesDeAccesibilidad(container)).toEqual([]);
    await user.click(boton());
    expect(await violacionesDeAccesibilidad(container)).toEqual([]);
  });
});
