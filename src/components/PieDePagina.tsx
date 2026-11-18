import estilos from './PieDePagina.module.css';

export function PieDePagina() {
  return (
    <footer className={`${estilos.pie} no-imprimir`}>
      <p className={estilos.interior}>
        Tus semestres se guardan en tu cuenta y solo tú puedes verlos. Los cálculos son
        orientativos: confirma siempre con el reglamento de tu institución.
      </p>
    </footer>
  );
}
