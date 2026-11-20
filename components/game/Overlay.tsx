import type { Phase } from "@/lib/game/types";
import type { RunSummary } from "./Game";
import styles from "./game.module.css";

interface Props {
  phase: Phase;
  summary: RunSummary | null;
  highScore: number;
  onStart: () => void;
  onResume: () => void;
  isTouch: boolean;
}

/** JSX estático içado para fora do componente (rendering-hoist-jsx). */
const controlsHelp = (
  <>
    <dl className={styles.controls}>
      <div>
        <dt>← → / A D</dt>
        <dd>andar</dd>
      </div>
      <div>
        <dt>Espaço / ↑ / Z</dt>
        <dd>pular (segure = mais alto)</dd>
      </div>
      <div>
        <dt>Shift</dt>
        <dd>correr</dd>
      </div>
      <div>
        <dt>X</dt>
        <dd>seringa de calmante</dd>
      </div>
      <div>
        <dt>P / Esc</dt>
        <dd>pausar · M som</dd>
      </div>
    </dl>
    <ul className={styles.legend}>
      <li>
        <span className={styles.dotBlue} /> Paciente: um pulo na cabeça e ele dorme
      </li>
      <li>
        <span className={styles.dotRed} /> Paciente chato: precisa de dois pulos
      </li>
      <li>
        <span className={styles.dotKit} /> Kit médico: bata por baixo para ganhar itens
      </li>
    </ul>
  </>
);

const touchHelp = (
  <dl className={styles.controls}>
    <div>
      <dt>◀ ▶</dt>
      <dd>deslize o dedo para andar</dd>
    </div>
    <div>
      <dt>⤒</dt>
      <dd>pular (segure = mais alto)</dd>
    </div>
    <div>
      <dt>💉</dt>
      <dd>aparece com a seringa</dd>
    </div>
    <div>
      <dt>📱</dt>
      <dd>jogue com o celular deitado</dd>
    </div>
  </dl>
);

const fmt = (n: number) => n.toLocaleString("pt-BR");

export function Overlay({ phase, summary, highScore, onStart, onResume, isTouch }: Props) {
  if (phase === "title") {
    return (
      <div className={styles.overlay} role="dialog" aria-labelledby="titulo-jogo">
        <div className={styles.card}>
          <p className={styles.kicker}>Plantão de plataforma</p>
          <h2 id="titulo-jogo" className={styles.logo}>
            <span aria-hidden>✚</span> Enfernal
          </h2>
          <p className={styles.lead}>
            Atravesse o hospital pulando de cama em cama, medique os pacientes e cuidado com os{" "}
            <strong>pacientes chatos</strong> — eles reclamam, perseguem e jogam o controle da TV!
          </p>
          <button type="button" className={styles.primary} onClick={onStart} autoFocus>
            Começar plantão
          </button>
          {isTouch ? touchHelp : controlsHelp}
          {highScore > 0 ? <p className={styles.record}>Recorde: {fmt(highScore)} pontos</p> : null}
        </div>
      </div>
    );
  }

  if (phase === "paused") {
    return (
      <div className={styles.overlay} role="dialog" aria-label="Jogo pausado">
        <div className={styles.card}>
          <h2 className={styles.title}>Pausa para o cafezinho ☕</h2>
          <button type="button" className={styles.primary} onClick={onResume} autoFocus>
            Voltar ao plantão
          </button>
        </div>
      </div>
    );
  }

  if (phase === "gameOver" || phase === "victory") {
    const win = phase === "victory";
    return (
      <div className={styles.overlay} role="dialog" aria-live="polite" aria-label={win ? "Vitória" : "Fim de jogo"}>
        <div className={styles.card}>
          <h2 className={styles.title}>{win ? "Plantão concluído! 🏥" : "Fim do plantão"}</h2>
          <p className={styles.lead}>
            {win
              ? "Todos os pacientes receberam alta. Até os chatos ficaram satisfeitos (por enquanto)."
              : "Os pacientes venceram desta vez. Respira fundo e volta pro plantão!"}
          </p>
          {summary ? (
            <div className={styles.stats}>
              <div>
                <span>Pontos</span>
                <strong>{fmt(summary.score)}</strong>
              </div>
              <div>
                <span>Pílulas</span>
                <strong>{summary.pills}</strong>
              </div>
              <div>
                <span>Recorde</span>
                <strong>{fmt(Math.max(highScore, summary.score))}</strong>
              </div>
            </div>
          ) : null}
          {summary?.newRecord ? <p className={styles.newRecord}>Novo recorde! ✨</p> : null}
          <button type="button" className={styles.primary} onClick={onStart} autoFocus>
            Jogar de novo
          </button>
        </div>
      </div>
    );
  }

  return null;
}
