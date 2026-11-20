/**
 * Efeitos sonoros sintetizados com Web Audio — sem arquivos para baixar.
 * O AudioContext só é criado após um gesto do usuário (política dos navegadores).
 */
export type Sfx =
  | "jump"
  | "pill"
  | "stomp"
  | "bump"
  | "powerup"
  | "hurt"
  | "die"
  | "shoot"
  | "clear"
  | "complain";

type Note = { f: number; d: number; type?: OscillatorType; slide?: number; gain?: number };

const SOUNDS: Record<Sfx, Note[]> = {
  jump: [{ f: 420, d: 0.12, type: "square", slide: 820, gain: 0.08 }],
  pill: [
    { f: 988, d: 0.06, type: "square", gain: 0.07 },
    { f: 1319, d: 0.12, type: "square", gain: 0.07 },
  ],
  stomp: [{ f: 300, d: 0.1, type: "triangle", slide: 120, gain: 0.2 }],
  bump: [{ f: 140, d: 0.08, type: "triangle", slide: 90, gain: 0.25 }],
  powerup: [
    { f: 523, d: 0.07, type: "square", gain: 0.07 },
    { f: 659, d: 0.07, type: "square", gain: 0.07 },
    { f: 784, d: 0.07, type: "square", gain: 0.07 },
    { f: 1047, d: 0.16, type: "square", gain: 0.07 },
  ],
  hurt: [{ f: 600, d: 0.25, type: "sawtooth", slide: 150, gain: 0.08 }],
  die: [
    { f: 523, d: 0.15, type: "square", gain: 0.07 },
    { f: 392, d: 0.15, type: "square", gain: 0.07 },
    { f: 262, d: 0.35, type: "square", slide: 130, gain: 0.07 },
  ],
  shoot: [{ f: 1200, d: 0.07, type: "sine", slide: 500, gain: 0.12 }],
  clear: [
    { f: 523, d: 0.1, type: "square", gain: 0.07 },
    { f: 659, d: 0.1, type: "square", gain: 0.07 },
    { f: 784, d: 0.1, type: "square", gain: 0.07 },
    { f: 1047, d: 0.1, type: "square", gain: 0.07 },
    { f: 784, d: 0.1, type: "square", gain: 0.07 },
    { f: 1047, d: 0.3, type: "square", gain: 0.07 },
  ],
  complain: [{ f: 220, d: 0.12, type: "sawtooth", slide: 180, gain: 0.04 }],
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  muted = false;

  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  play(name: Sfx) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    let t = ctx.currentTime;
    for (const n of SOUNDS[name]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = n.type ?? "square";
      osc.frequency.setValueAtTime(n.f, t);
      if (n.slide) osc.frequency.exponentialRampToValueAtTime(n.slide, t + n.d);
      const vol = n.gain ?? 0.08;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + n.d);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + n.d + 0.02);
      t += n.d;
    }
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
  }
}
