"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { AudioEngine } from "@/lib/game/audio";
import { FIXED_DT, VIEW_H, VIEW_W } from "@/lib/game/constants";
import { GameEngine } from "@/lib/game/engine";
import { createInput, KEY_MAP, type InputAction } from "@/lib/game/input";
import { render } from "@/lib/game/render";
import type { Phase } from "@/lib/game/types";
import { getHighScore, getServerHighScore, submitScore, subscribeHighScore } from "@/lib/highscore";
import { PORTRAIT_QUERY, TOUCH_QUERY, useMediaQuery } from "@/lib/useMediaQuery";
import type { Sfx } from "@/lib/game/audio";
import { Overlay } from "./Overlay";
import { TouchControls } from "./TouchControls";
import styles from "./game.module.css";

export interface RunSummary {
  score: number;
  pills: number;
  newRecord: boolean;
}

/** Vibração curta em celulares Android (iOS ignora silenciosamente). */
const HAPTICS: Partial<Record<Sfx, number | number[]>> = {
  stomp: 18,
  bump: 10,
  powerup: [20, 40, 20],
  hurt: 90,
  die: [80, 60, 160],
};

/** Tela cheia + travar em paisagem quando o navegador permitir (Android/Chrome). */
async function enterImmersive() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    }
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (o: "landscape") => Promise<void>;
    };
    await orientation.lock?.("landscape");
  } catch {
    // iPhone e alguns navegadores não suportam: o layout fixo em tela cheia cobre esse caso.
  }
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const inputRef = useRef(createInput());

  const [phase, setPhase] = useState<Phase>("title");
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [muted, setMuted] = useState(false);
  const [canShoot, setCanShoot] = useState(false);
  const isTouch = useMediaQuery(TOUCH_QUERY);
  const isPortrait = useMediaQuery(PORTRAIT_QUERY);
  const highScore = useSyncExternalStore(subscribeHighScore, getHighScore, getServerHighScore);

  // Motor, loop de jogo e redimensionamento — montados uma única vez.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const touchMql = window.matchMedia(TOUCH_QUERY);
    const audio = new AudioEngine();
    audioRef.current = audio;
    const engine = new GameEngine({
      sfx: (s) => {
        audio.play(s);
        const buzz = HAPTICS[s];
        if (buzz && touchMql.matches && "vibrate" in navigator) navigator.vibrate(buzz);
      },
      onPhase: (p) => {
        setPhase(p);
        if (p === "gameOver" || p === "victory") {
          setSummary({ score: engine.score, pills: engine.pills, newRecord: submitScore(engine.score) });
        }
      },
    });
    engineRef.current = engine;

    // Canvas nítido em telas de alta densidade: resolução real = tamanho exibido × DPR.
    let scale = 1;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth || VIEW_W;
      scale = (cssW / VIEW_W) * dpr;
      canvas.width = Math.round(VIEW_W * scale);
      canvas.height = Math.round(VIEW_H * scale);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Passo fixo: física idêntica em 60Hz, 120Hz ou 144Hz.
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let lastShoot = false;
    const frame = (now: number) => {
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      while (acc >= FIXED_DT) {
        engine.update(FIXED_DT, inputRef.current);
        acc -= FIXED_DT;
      }
      // Estado transitório fica no motor; o React só re-renderiza quando o botão de seringa muda.
      const shoot = engine.player.power === 2;
      if (shoot !== lastShoot) {
        lastShoot = shoot;
        setCanShoot(shoot);
      }
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      render(ctx, engine);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onVisibility = () => {
      if (document.hidden && engine.phase === "playing") engine.togglePause();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      audio.dispose();
      engineRef.current = null;
      audioRef.current = null;
    };
  }, []);

  // Handlers simples: o React Compiler memoiza o que for preciso.
  const start = () => {
    audioRef.current?.unlock();
    if (isTouch) void enterImmersive();
    setSummary(null);
    engineRef.current?.startGame();
    canvasRef.current?.focus();
  };

  const togglePause = () => engineRef.current?.togglePause();

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  };

  const setAction = (action: InputAction, down: boolean) => {
    inputRef.current[action] = down;
    if (down) audioRef.current?.unlock();
  };

  // useEffectEvent: o listener global é registrado uma única vez e sempre
  // enxerga os handlers mais recentes (advanced-event-handler-refs).
  const onKey = useEffectEvent((e: KeyboardEvent, down: boolean) => {
    const engine = engineRef.current;
    if (!engine) return;
    const action = KEY_MAP[e.code];
    const active = engine.phase === "playing" || engine.phase === "dying" || engine.phase === "levelClear";
    if (action) {
      inputRef.current[action] = down;
      if (active) e.preventDefault();
    }
    if (!down || e.repeat) return;
    if (e.code === "Escape" || e.code === "KeyP") togglePause();
    else if (e.code === "KeyM") toggleMute();
    else if (
      (e.code === "Enter" || e.code === "Space") &&
      (engine.phase === "title" || engine.phase === "gameOver" || engine.phase === "victory")
    ) {
      e.preventDefault();
      start();
    }
  });

  // Celular girado para retrato no meio da partida: pausa até voltar para paisagem.
  useEffect(() => {
    const engine = engineRef.current;
    if (isTouch && isPortrait && engine?.phase === "playing") engine.togglePause();
  }, [isTouch, isPortrait]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    // Solta tudo ao perder o foco para a enfermeira não sair andando sozinha.
    const blur = () => Object.assign(inputRef.current, createInput());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const inGame = phase === "playing" || phase === "dying" || phase === "levelClear" || phase === "paused";
  // No celular o jogo sempre ocupa a tela inteira (menus inclusive).
  const immersive = isTouch;

  return (
    <div className={styles.wrapper} data-immersive={immersive}>
      <div className={immersive ? `${styles.stage} ${styles.immersive}` : styles.stage}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={VIEW_W}
          height={VIEW_H}
          tabIndex={0}
          aria-label="Tela do jogo Enfernal"
          role="img"
        />

        {inGame ? (
          <div className={styles.topButtons}>
            <button type="button" onClick={togglePause} aria-label={phase === "paused" ? "Continuar" : "Pausar"}>
              {phase === "paused" ? "▶" : "❚❚"}
            </button>
            <button type="button" onClick={toggleMute} aria-label={muted ? "Ativar som" : "Silenciar"}>
              {muted ? "🔇" : "🔊"}
            </button>
          </div>
        ) : null}

        <Overlay
          phase={phase}
          summary={summary}
          highScore={highScore}
          onStart={start}
          onResume={togglePause}
          isTouch={isTouch}
        />

        {inGame ? <TouchControls onAction={setAction} canShoot={canShoot} /> : null}

        {immersive && inGame && isPortrait ? (
          <div className={styles.rotate} role="alert">
            <div className={styles.rotateIcon} aria-hidden>
              📱
            </div>
            <p>Gire o celular para jogar na horizontal</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
