import Game from "@/components/game/Game";
import styles from "./page.module.css";

/**
 * Server Component: o HTML da página (cabeçalho, rodapé, SEO) é renderizado
 * no servidor/estaticamente; só o jogo (<Game />) é hidratado no cliente.
 */
export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.brand}>
          <span aria-hidden className={styles.cross}>
            ✚
          </span>
          Enfernal
        </h1>
        <p className={styles.tagline}>Pule de cama em cama. Medique os pacientes. Sobreviva aos chatos.</p>
      </header>

      <Game />

      <footer className={styles.footer}>
        Teclado: setas/WASD para andar, espaço para pular, Shift para correr, X para a seringa. No celular, use os
        botões na tela.
      </footer>
    </main>
  );
}
