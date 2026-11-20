export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  run: boolean;
  shoot: boolean;
}

export type InputAction = keyof InputState;

export const KEY_MAP: Record<string, InputAction> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "jump",
  KeyW: "jump",
  Space: "jump",
  KeyZ: "jump",
  ShiftLeft: "run",
  ShiftRight: "run",
  KeyX: "shoot",
  KeyJ: "shoot",
};

export function createInput(): InputState {
  return { left: false, right: false, jump: false, run: false, shoot: false };
}
