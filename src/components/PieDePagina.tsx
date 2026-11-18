import estilos from './PieDePagina.module.css';

export function PieDePagina() {
  return (
    <footer className={`${estilos.pie} no-imprimir`}>
      <p className={estilos.interior}>
        Tus datos se guardan solo en este navegador. Los cálculos son orientativos: confirma siempre
        con el reglamento de tu institución.
      </p>
    </footer>
  );
}
