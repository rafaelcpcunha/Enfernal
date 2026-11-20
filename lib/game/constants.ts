/** Tamanho de um bloco (tile) em pixels lógicos. */
export const TILE = 32;

/** Resolução lógica do canvas — escalada para caber na tela mantendo proporção. */
export const VIEW_W = 960;
export const VIEW_H = 540;

/** Física (unidades: px por segundo / px por segundo²). */
export const GRAVITY = 2200;
export const MAX_FALL = 900;
export const MOVE_ACCEL = 2400;
export const MOVE_FRICTION = 2000;
export const MAX_WALK = 230;
export const MAX_RUN = 330;
export const JUMP_VELOCITY = 820;
export const JUMP_CUT = 0.45;
export const COYOTE_TIME = 0.1;
export const JUMP_BUFFER = 0.12;
export const STOMP_BOUNCE = 520;

/** Passo fixo da simulação, desacoplado do framerate. */
export const FIXED_DT = 1 / 120;

export const START_LIVES = 3;
export const LEVEL_TIME = 300;
export const INVULNERABLE_TIME = 1.6;

export const COLORS = {
  wall: "#dff3f1",
  wallStripe: "#c6e8e4",
  wallBase: "#9fd4cd",
  floor: "#7aa5a8",
  floorDark: "#5c8588",
  floorLight: "#a9cbcd",
  bedFrame: "#8a96a3",
  bedFrameDark: "#5f6b78",
  mattress: "#ffffff",
  sheet: "#7cc4e8",
  sheetDark: "#4f9fca",
  pillow: "#fdfdfd",
  medkit: "#ffffff",
  medkitUsed: "#c9ced4",
  cross: "#e63946",
  nurseUniform: "#f4f8ff",
  nurseAccent: "#4fb3d9",
  skin: "#f2c39b",
  hair: "#5a3825",
  gown: "#9ad1f5",
  gownChato: "#f5a99a",
  text: "#12343b",
} as const;
