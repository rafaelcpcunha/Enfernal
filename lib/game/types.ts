export type Phase =
  | "title"
  | "playing"
  | "paused"
  | "dying"
  | "levelClear"
  | "gameOver"
  | "victory";

/**
 * Tiles do mapa:
 *  .  vazio
 *  #  piso do hospital (sólido)
 *  B  cama (sólida — a enfermeira pula nela e pode "bater" por baixo)
 *  ?  kit médico com pílula
 *  H  kit médico com coração (power-up)
 *  X  kit médico com seringa de calmante (power-up)
 *  u  kit médico já usado (sólido)
 *  M  armário de remédios (sólido)
 */
export type Tile = "." | "#" | "B" | "?" | "H" | "X" | "u" | "M";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Body extends Rect {
  vx: number;
  vy: number;
  onGround: boolean;
}

export type PowerLevel = 0 | 1 | 2; // 0 normal · 1 com coração · 2 com seringa

export interface Player extends Body {
  facing: 1 | -1;
  power: PowerLevel;
  invulnerable: number;
  coyote: number;
  jumpBuffer: number;
  jumpHeld: boolean;
  shootCooldown: number;
  walkCycle: number;
}

export type EnemyKind = "paciente" | "chato";

export interface Enemy extends Body {
  id: number;
  kind: EnemyKind;
  dir: 1 | -1;
  hp: number;
  state: "walk" | "sleep";
  timer: number;
  hopTimer: number;
  throwTimer: number;
  bubble: { text: string; ttl: number } | null;
  bubbleTimer: number;
  active: boolean;
  walkCycle: number;
  hurtFlash: number;
}

export type ItemKind = "pilula" | "coracao" | "seringa";

export interface Item extends Body {
  id: number;
  kind: ItemKind;
  dir: 1 | -1;
  /** Animação de "sair" do kit médico antes de ter física. */
  emerge: number;
  floating: boolean;
  t: number;
}

export interface Projectile extends Rect {
  id: number;
  vx: number;
  vy: number;
  kind: "dardo" | "controle";
  ttl: number;
  spin: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
  maxTtl: number;
  kind: "text" | "spark" | "zzz" | "pill";
  text?: string;
  color: string;
}

export interface Bump {
  tx: number;
  ty: number;
  t: number;
}

export interface LevelDef {
  name: string;
  subtitle: string;
  rows: string[];
}

export interface Hud {
  score: number;
  pills: number;
  lives: number;
  time: number;
  levelIndex: number;
  levelName: string;
}
