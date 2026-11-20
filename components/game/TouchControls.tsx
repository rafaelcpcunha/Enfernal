"use client";

import { useRef, type PointerEvent } from "react";
import type { InputAction } from "@/lib/game/input";
import styles from "./game.module.css";

interface Props {
  onAction: (action: InputAction, down: boolean) => void;
}

/**
 * Direcional deslizável: o dedo pode escorregar entre ← e → sem levantar,
 * como num controle de verdade. Andar no toque já usa a velocidade de corrida.
 */
function DPad({ onAction }: Props) {
  const dirRef = useRef<-1 | 0 | 1>(0);
  const elRef = useRef<HTMLDivElement>(null);

  const setDir = (dir: -1 | 0 | 1) => {
    if (dir === dirRef.current) return;
    dirRef.current = dir;
    onAction("left", dir === -1);
    onAction("right", dir === 1);
    onAction("run", dir !== 0);
    elRef.current?.setAttribute("data-dir", String(dir));
  };

  const fromEvent = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    if (Math.abs(dx) < r.width * 0.08) return; // zona morta no centro mantém a direção atual
    setDir(dx < 0 ? -1 : 1);
  };

  return (
    <div
      ref={elRef}
      className={styles.dpad}
      data-dir="0"
      role="group"
      aria-label="Direcional: toque à esquerda ou à direita"
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        fromEvent(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) fromEvent(e);
      }}
      onPointerUp={() => setDir(0)}
      onPointerCancel={() => setDir(0)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className={styles.dpadLeft} aria-hidden>
        ◀
      </span>
      <span className={styles.dpadRight} aria-hidden>
        ▶
      </span>
    </div>
  );
}

function Pad({
  action,
  label,
  children,
  className,
  onAction,
}: Props & { action: InputAction; label: string; children: React.ReactNode; className?: string }) {
  const release = () => onAction(action, false);
  return (
    <button
      type="button"
      aria-label={label}
      className={`${styles.pad} ${className ?? ""}`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onAction(action, true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

/** Controles na tela — só aparecem em dispositivos com toque (via CSS). Multi-toque: andar + pular juntos. */
export function TouchControls({ onAction, canShoot }: Props & { canShoot: boolean }) {
  return (
    <div className={styles.touch}>
      <DPad onAction={onAction} />
      <div className={styles.touchRight}>
        {canShoot ? (
          <Pad action="shoot" label="Atirar calmante" onAction={onAction} className={styles.padShoot}>
            💉
          </Pad>
        ) : null}
        <Pad action="jump" label="Pular" onAction={onAction} className={styles.padJump}>
          ⤒
        </Pad>
      </div>
    </div>
  );
}
