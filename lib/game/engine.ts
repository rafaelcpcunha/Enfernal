import type { Sfx } from "./audio";
import {
  COYOTE_TIME,
  GRAVITY,
  INVULNERABLE_TIME,
  JUMP_BUFFER,
  JUMP_CUT,
  JUMP_VELOCITY,
  LEVEL_TIME,
  MAX_FALL,
  MAX_RUN,
  MAX_WALK,
  MOVE_ACCEL,
  MOVE_FRICTION,
  START_LIVES,
  STOMP_BOUNCE,
  TILE,
  VIEW_W,
} from "./constants";
import type { InputState } from "./input";
import { LEVELS, ROWS } from "./levels";
import type {
  Body,
  Bump,
  Enemy,
  EnemyKind,
  Item,
  ItemKind,
  Particle,
  Phase,
  Player,
  Projectile,
  Rect,
  Tile,
} from "./types";

const SOLID = new Set<Tile>(["#", "B", "?", "H", "X", "u", "M"]);

const RECLAMACOES_CHATO = [
  "Enfermeeeira!",
  "Cadê meu remédio?",
  "Essa comida tá fria!",
  "Quero falar com o médico!",
  "A TV não pega!",
  "Tô esperando há horas!",
  "Esse soro tá doendo!",
  "Quero ir embora!",
  "Me dá outro travesseiro!",
  "Vou apertar a campainha!",
  "No outro hospital era melhor!",
  "Já tomei esse remédio?",
];

const RECLAMACOES_PACIENTE = ["Ai, ai...", "Que fome...", "Tô com frio", "Hmm...", "Cadê o controle?"];

const AI_CHATO = ["AI! Vou na ouvidoria!", "Isso é um absurdo!", "Vou te denunciar!"];

export interface EngineEvents {
  onPhase: (phase: Phase) => void;
  sfx: (s: Sfx) => void;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)] as T;

export function overlaps(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class GameEngine {
  phase: Phase = "title";
  levelIndex = 0;
  tiles: Tile[][] = [];
  cols = 0;
  widthPx = 0;
  heightPx = ROWS * TILE;

  player!: Player;
  enemies: Enemy[] = [];
  items: Item[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  bumps: Bump[] = [];
  exit: Rect = { x: 0, y: 0, w: 0, h: 0 };

  camX = 0;
  score = 0;
  pills = 0;
  lives = START_LIVES;
  time = LEVEL_TIME;
  /** Tempo total de jogo — usado para animações. */
  clock = 0;
  phaseTimer = 0;
  bannerTimer = 0;
  deathReason = "";

  private nextId = 1;
  private prevJump = false;
  private prevShoot = false;
  private combo = 0;
  private pausedFrom: Phase | null = null;

  constructor(private readonly events: EngineEvents) {
    this.loadLevel(0);
  }

  get level() {
    return LEVELS[this.levelIndex] ?? LEVELS[0]!;
  }

  get totalLevels() {
    return LEVELS.length;
  }

  // ───────────────────────── Ciclo de vida ─────────────────────────

  startGame() {
    this.score = 0;
    this.pills = 0;
    this.lives = START_LIVES;
    this.loadLevel(0);
    this.player.power = 0;
    this.setPhase("playing");
  }

  togglePause() {
    if (this.phase === "paused") {
      this.setPhase(this.pausedFrom ?? "playing");
      this.pausedFrom = null;
    } else if (this.phase === "playing") {
      this.pausedFrom = this.phase;
      this.setPhase("paused");
    }
  }

  private setPhase(p: Phase) {
    this.phase = p;
    this.phaseTimer = 0;
    this.events.onPhase(p);
  }

  loadLevel(index: number) {
    this.levelIndex = index;
    const rows = this.level.rows;
    this.cols = rows[0]?.length ?? 0;
    this.widthPx = this.cols * TILE;
    this.enemies = [];
    this.items = [];
    this.projectiles = [];
    this.particles = [];
    this.bumps = [];
    this.time = LEVEL_TIME;
    this.bannerTimer = 2.4;
    this.combo = 0;

    let startX = TILE * 2;
    let startY = TILE * 10;
    this.tiles = rows.map((row, ty) =>
      [...row].map((ch, tx) => {
        const px = tx * TILE;
        const py = ty * TILE;
        switch (ch) {
          case "S":
            startX = px + 5;
            startY = py + TILE - 44;
            return ".";
          case "E":
            this.exit = { x: px, y: py + TILE - TILE * 3, w: TILE * 2, h: TILE * 3 };
            return ".";
          case "o":
            this.items.push(this.makeItem("pilula", px + 8, py + 6, true));
            return ".";
          case "p":
          case "c":
            this.enemies.push(this.makeEnemy(ch === "p" ? "paciente" : "chato", px, py));
            return ".";
          default:
            return ch as Tile;
        }
      }),
    );

    const keepPower = this.player?.power ?? 0;
    this.player = {
      x: startX,
      y: startY,
      w: 22,
      h: 44,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      power: this.phase === "dying" ? 0 : keepPower,
      invulnerable: 0,
      coyote: 0,
      jumpBuffer: 0,
      jumpHeld: false,
      shootCooldown: 0,
      walkCycle: 0,
    };
    this.camX = 0;
  }

  private makeEnemy(kind: EnemyKind, px: number, py: number): Enemy {
    const w = kind === "chato" ? 28 : 26;
    const h = kind === "chato" ? 42 : 38;
    return {
      id: this.nextId++,
      kind,
      x: px + (TILE - w) / 2,
      y: py + TILE - h,
      w,
      h,
      vx: 0,
      vy: 0,
      onGround: false,
      dir: -1,
      hp: kind === "chato" ? 2 : 1,
      state: "walk",
      timer: 0,
      hopTimer: rand(1, 2.5),
      throwTimer: rand(1.5, 3),
      bubble: null,
      bubbleTimer: rand(0.5, 3),
      active: false,
      walkCycle: Math.random() * 10,
      hurtFlash: 0,
    };
  }

  private makeItem(kind: ItemKind, x: number, y: number, floating = false): Item {
    const size = kind === "pilula" ? 16 : 24;
    return {
      id: this.nextId++,
      kind,
      x,
      y,
      w: size,
      h: size,
      vx: 0,
      vy: 0,
      onGround: false,
      dir: 1,
      emerge: floating ? 0 : 0.5,
      floating,
      t: Math.random() * 6,
    };
  }

  // ───────────────────────── Mapa ─────────────────────────

  tileAt(tx: number, ty: number): Tile {
    if (ty < 0 || ty >= ROWS) return ".";
    if (tx < 0 || tx >= this.cols) return "#";
    return this.tiles[ty]?.[tx] ?? ".";
  }

  isSolid(tx: number, ty: number) {
    return SOLID.has(this.tileAt(tx, ty));
  }

  private setTile(tx: number, ty: number, t: Tile) {
    const row = this.tiles[ty];
    if (row && tx >= 0 && tx < row.length) row[tx] = t;
  }

  /**
   * Move um corpo resolvendo colisões eixo a eixo contra o tilemap.
   * Retorna se bateu em parede e o tile atingido com a cabeça (se houver).
   */
  private moveBody(b: Body, dt: number) {
    let hitWall = false;
    let headTile: { tx: number; ty: number } | null = null;

    b.x += b.vx * dt;
    let x0 = Math.floor(b.x / TILE);
    let x1 = Math.floor((b.x + b.w - 0.01) / TILE);
    let y0 = Math.floor(b.y / TILE);
    let y1 = Math.floor((b.y + b.h - 0.01) / TILE);
    if (b.vx > 0) {
      for (let ty = y0; ty <= y1; ty++)
        if (this.isSolid(x1, ty)) {
          b.x = x1 * TILE - b.w;
          b.vx = 0;
          hitWall = true;
          break;
        }
    } else if (b.vx < 0) {
      for (let ty = y0; ty <= y1; ty++)
        if (this.isSolid(x0, ty)) {
          b.x = (x0 + 1) * TILE;
          b.vx = 0;
          hitWall = true;
          break;
        }
    }

    b.y += b.vy * dt;
    b.onGround = false;
    x0 = Math.floor(b.x / TILE);
    x1 = Math.floor((b.x + b.w - 0.01) / TILE);
    y0 = Math.floor(b.y / TILE);
    y1 = Math.floor((b.y + b.h - 0.01) / TILE);
    if (b.vy > 0) {
      for (let tx = x0; tx <= x1; tx++)
        if (this.isSolid(tx, y1)) {
          b.y = y1 * TILE - b.h;
          b.vy = 0;
          b.onGround = true;
          break;
        }
    } else if (b.vy < 0) {
      // Escolhe o tile mais próximo do centro do corpo (como nos clássicos).
      const cx = b.x + b.w / 2;
      let best = Infinity;
      for (let tx = x0; tx <= x1; tx++)
        if (this.isSolid(tx, y0)) {
          const d = Math.abs(tx * TILE + TILE / 2 - cx);
          if (d < best) {
            best = d;
            headTile = { tx, ty: y0 };
          }
        }
      if (headTile) {
        b.y = (y0 + 1) * TILE;
        b.vy = 0;
      }
    }
    return { hitWall, headTile };
  }

  // ───────────────────────── Atualização ─────────────────────────

  update(dt: number, input: InputState) {
    this.clock += dt;
    this.phaseTimer += dt;
    const jumpPressed = input.jump && !this.prevJump;
    const shootPressed = input.shoot && !this.prevShoot;
    this.prevJump = input.jump;
    this.prevShoot = input.shoot;

    switch (this.phase) {
      case "playing":
        this.updatePlaying(dt, input, jumpPressed, shootPressed);
        break;
      case "dying":
        this.updateDying(dt);
        break;
      case "levelClear":
        this.updateLevelClear(dt);
        break;
      default:
        // title / paused / gameOver / victory: o mundo fica parado
        break;
    }
  }

  private updatePlaying(dt: number, input: InputState, jumpPressed: boolean, shootPressed: boolean) {
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.time -= dt;
    if (this.time <= 0) {
      this.time = 0;
      this.kill("O plantão acabou!");
      return;
    }

    this.updatePlayer(dt, input, jumpPressed, shootPressed);
    if (this.phase !== "playing") return;
    this.updateEnemies(dt);
    this.updateItems(dt);
    this.updateProjectiles(dt);
    this.updateEffects(dt);
    this.updateCamera(dt);

    if (overlaps(this.player, { x: this.exit.x + 16, y: this.exit.y, w: this.exit.w - 32, h: this.exit.h })) {
      this.events.sfx("clear");
      this.setPhase("levelClear");
    }
  }

  private updatePlayer(dt: number, input: InputState, jumpPressed: boolean, shootPressed: boolean) {
    const p = this.player;
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const max = input.run ? MAX_RUN : MAX_WALK;

    if (dir !== 0) {
      const turning = Math.sign(p.vx) !== dir && p.vx !== 0;
      p.vx += dir * MOVE_ACCEL * (turning ? 1.8 : 1) * dt;
      p.facing = dir as 1 | -1;
    } else {
      const f = MOVE_FRICTION * (p.onGround ? 1 : 0.4) * dt;
      p.vx = Math.abs(p.vx) <= f ? 0 : p.vx - Math.sign(p.vx) * f;
    }
    p.vx = Math.max(-max, Math.min(max, p.vx));

    p.coyote = p.onGround ? COYOTE_TIME : p.coyote - dt;
    p.jumpBuffer = jumpPressed ? JUMP_BUFFER : p.jumpBuffer - dt;
    if (p.jumpBuffer > 0 && p.coyote > 0) {
      p.vy = -(JUMP_VELOCITY + Math.abs(p.vx) * 0.12);
      p.coyote = 0;
      p.jumpBuffer = 0;
      p.jumpHeld = true;
      this.events.sfx("jump");
    }
    if (p.jumpHeld && !input.jump && p.vy < 0) {
      p.vy *= JUMP_CUT;
      p.jumpHeld = false;
    }
    if (p.vy >= 0) p.jumpHeld = false;

    p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt);

    const { headTile } = this.moveBody(p, dt);
    if (p.x < 0) {
      p.x = 0;
      p.vx = 0;
    }
    if (headTile) this.hitTileFromBelow(headTile.tx, headTile.ty);
    if (p.onGround) this.combo = 0;

    p.walkCycle += Math.abs(p.vx) * dt * 0.05;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.shootCooldown = Math.max(0, p.shootCooldown - dt);

    if (shootPressed && p.power === 2 && p.shootCooldown === 0) {
      const darts = this.projectiles.filter((pr) => pr.kind === "dardo").length;
      if (darts < 3) {
        this.projectiles.push({
          id: this.nextId++,
          kind: "dardo",
          x: p.facing === 1 ? p.x + p.w : p.x - 18,
          y: p.y + 18,
          w: 18,
          h: 6,
          vx: p.facing * 560,
          vy: 0,
          ttl: 1.2,
          spin: 0,
        });
        p.shootCooldown = 0.3;
        this.events.sfx("shoot");
      }
    }

    if (p.y > this.heightPx + 40) this.kill("Caiu no poço do elevador!");
  }

  private hitTileFromBelow(tx: number, ty: number) {
    const t = this.tileAt(tx, ty);
    const px = tx * TILE;
    const py = ty * TILE;

    if (t === "B" || t === "?" || t === "H" || t === "X") {
      this.bumps.push({ tx, ty, t: 0.2 });
      // Quem estiver deitado/em pé em cima do tile leva um susto.
      const top: Rect = { x: px, y: py - 6, w: TILE, h: 8 };
      for (const e of this.enemies)
        if (e.state === "walk" && overlaps(e, top)) this.defeatEnemy(e, true);
      for (const it of this.items)
        if (!it.floating && overlaps(it, top)) {
          it.vy = -400;
          it.dir = it.x + it.w / 2 < px + TILE / 2 ? -1 : 1;
        }
    }

    if (t === "?") {
      this.setTile(tx, ty, "u");
      this.addPill(px + TILE / 2, py);
    } else if (t === "H" || t === "X") {
      this.setTile(tx, ty, "u");
      this.items.push(this.makeItem(t === "H" ? "coracao" : "seringa", px + 4, py));
      this.events.sfx("powerup");
    } else {
      this.events.sfx("bump");
      if (t === "B") this.spark(px + TILE / 2, py, "#ffffff", 4);
    }
  }

  private addPill(x: number, y: number) {
    this.pills++;
    this.addScore(200, x, y - 20);
    this.particles.push({ x, y, vx: 0, vy: -420, ttl: 0.5, maxTtl: 0.5, kind: "pill", color: "#ff6b8b" });
    this.events.sfx("pill");
    if (this.pills % 100 === 0) this.oneUp(x, y);
  }

  private oneUp(x: number, y: number) {
    this.lives++;
    this.text(x, y - 30, "+1 VIDA", "#2a9d8f");
    this.events.sfx("powerup");
  }

  private addScore(n: number, x: number, y: number) {
    this.score += n;
    this.text(x, y, `+${n}`, "#12343b");
  }

  private updateEnemies(dt: number) {
    const p = this.player;
    const prevBottom = p.y + p.h - p.vy * dt;

    for (const e of this.enemies) {
      if (!e.active) {
        if (e.x < this.camX + VIEW_W + 64) e.active = true;
        else continue;
      }
      e.walkCycle += dt * (e.kind === "chato" ? 10 : 6);
      e.hurtFlash = Math.max(0, e.hurtFlash - dt);

      if (e.state === "sleep") {
        e.timer -= dt;
        e.vx = 0;
        e.vy = Math.min(MAX_FALL, e.vy + GRAVITY * dt);
        this.moveBody(e, dt);
        if (Math.random() < dt * 3) this.particles.push(this.zzz(e.x + e.w, e.y));
        continue;
      }

      // Balões de reclamação
      e.bubbleTimer -= dt;
      if (e.bubble) {
        e.bubble.ttl -= dt;
        if (e.bubble.ttl <= 0) e.bubble = null;
      }
      if (e.bubbleTimer <= 0) {
        const chato = e.kind === "chato";
        if (chato || Math.random() < 0.35) {
          e.bubble = { text: pick(chato ? RECLAMACOES_CHATO : RECLAMACOES_PACIENTE), ttl: 1.8 };
          if (chato && this.onScreen(e)) this.events.sfx("complain");
        }
        e.bubbleTimer = chato ? rand(2.2, 4.5) : rand(4, 9);
      }

      const dx = p.x + p.w / 2 - (e.x + e.w / 2);
      let speed = 55;
      if (e.kind === "chato") {
        const angry = e.hp < 2;
        speed = angry ? 125 : 85;
        const near = Math.abs(dx) < 400 && Math.abs(p.y - e.y) < 220;
        if (near && Math.abs(dx) > 10) e.dir = dx > 0 ? 1 : -1;

        e.hopTimer -= dt;
        if (e.onGround && e.hopTimer <= 0) {
          e.vy = -rand(420, 600);
          e.hopTimer = rand(1.2, 2.6);
        }

        e.throwTimer -= dt;
        if (near && e.throwTimer <= 0 && this.onScreen(e)) {
          this.projectiles.push({
            id: this.nextId++,
            kind: "controle",
            x: e.x + e.w / 2 - 7,
            y: e.y + 8,
            w: 14,
            h: 14,
            vx: e.dir * rand(200, 300),
            vy: -rand(320, 460),
            ttl: 4,
            spin: 0,
          });
          e.throwTimer = angry ? rand(1.4, 2.2) : rand(2.2, 3.4);
          if (!e.bubble) e.bubble = { text: "Toma isso!", ttl: 1 };
        }
      }

      // Não cai da beirada: vira (paciente) ou para e reclama (chato).
      let vx = e.dir * speed;
      if (e.onGround) {
        const aheadX = e.dir > 0 ? e.x + e.w + 2 : e.x - 2;
        const footY = e.y + e.h + 4;
        if (!this.isSolid(Math.floor(aheadX / TILE), Math.floor(footY / TILE))) {
          if (e.kind === "paciente") e.dir = (e.dir * -1) as 1 | -1;
          vx = 0;
        }
      }
      e.vx = vx;
      e.vy = Math.min(MAX_FALL, e.vy + GRAVITY * dt);
      const { hitWall } = this.moveBody(e, dt);
      if (hitWall) e.dir = (e.dir * -1) as 1 | -1;

      if (e.y > this.heightPx + 40) {
        e.state = "sleep";
        e.timer = 0;
        continue;
      }

      // Colisão com a enfermeira
      if (this.phase === "playing" && overlaps(p, e)) {
        const stomp = p.vy > 0 && prevBottom <= e.y + 12;
        if (stomp) {
          p.vy = -(this.prevJump ? JUMP_VELOCITY * 0.8 : STOMP_BOUNCE);
          p.jumpHeld = this.prevJump;
          this.combo++;
          this.damageEnemy(e);
        } else if (p.invulnerable <= 0) {
          this.hurtPlayer(e.kind === "chato" ? "O paciente chato venceu!" : "Um paciente te derrubou!");
        }
      }
    }

    this.enemies = this.enemies.filter((e) => !(e.state === "sleep" && e.timer <= 0));
  }

  private damageEnemy(e: Enemy) {
    e.hp--;
    this.events.sfx("stomp");
    if (e.hp <= 0) {
      this.defeatEnemy(e, false);
    } else {
      e.hurtFlash = 0.4;
      e.bubble = { text: pick(AI_CHATO), ttl: 1.6 };
      e.bubbleTimer = 2;
      e.hopTimer = 0.4;
      this.spark(e.x + e.w / 2, e.y, "#ffd166", 6);
    }
  }

  private defeatEnemy(e: Enemy, knocked: boolean) {
    e.state = "sleep";
    e.hp = 0;
    e.timer = 1.4;
    e.bubble = null;
    if (knocked) e.vy = -380;
    const base = e.kind === "chato" ? 500 : 100;
    const mult = 2 ** Math.min(Math.max(this.combo - 1, 0), 3);
    this.addScore(base * mult, e.x + e.w / 2, e.y - 10);
    this.text(e.x + e.w / 2, e.y - 34, e.kind === "chato" ? "Acalmou!" : "Medicado!", "#2a9d8f");
    this.particles.push(this.zzz(e.x + e.w, e.y));
    if (knocked) this.events.sfx("stomp");
  }

  private hurtPlayer(reason: string) {
    const p = this.player;
    if (p.power > 0) {
      p.power = 0;
      p.invulnerable = INVULNERABLE_TIME;
      this.events.sfx("hurt");
      this.spark(p.x + p.w / 2, p.y + p.h / 2, "#e63946", 10);
    } else {
      this.kill(reason);
    }
  }

  private kill(reason: string) {
    if (this.phase !== "playing") return;
    this.deathReason = reason;
    this.lives--;
    this.player.vy = -700;
    this.player.vx = 0;
    this.player.power = 0;
    this.events.sfx("die");
    this.setPhase("dying");
  }

  private updateDying(dt: number) {
    const p = this.player;
    if (this.phaseTimer > 0.4) {
      p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt);
      p.y += p.vy * dt;
    }
    this.updateEffects(dt);
    if (this.phaseTimer > 2.4) {
      if (this.lives > 0) {
        this.loadLevel(this.levelIndex);
        this.setPhase("playing");
      } else {
        this.setPhase("gameOver");
      }
    }
  }

  private updateLevelClear(dt: number) {
    this.updateEffects(dt);
    if (this.time > 0) {
      const dec = Math.min(this.time, 150 * dt);
      this.time -= dec;
      this.score += Math.round(dec * 10);
      return;
    }
    if (this.phaseTimer > 3) {
      if (this.levelIndex + 1 < LEVELS.length) {
        this.loadLevel(this.levelIndex + 1);
        this.setPhase("playing");
      } else {
        this.setPhase("victory");
      }
    }
  }

  private updateItems(dt: number) {
    const p = this.player;
    for (const it of this.items) {
      it.t += dt;
      if (it.floating) {
        if (overlaps(p, it)) this.collect(it);
        continue;
      }
      if (it.emerge > 0) {
        it.emerge -= dt;
        it.y -= (TILE / 0.5) * dt;
        continue;
      }
      if (it.kind === "coracao") it.vx = it.dir * 100;
      else it.vx *= 0.9;
      it.vy = Math.min(MAX_FALL, it.vy + GRAVITY * dt);
      const { hitWall } = this.moveBody(it, dt);
      if (hitWall) it.dir = (it.dir * -1) as 1 | -1;
      if (overlaps(p, it)) this.collect(it);
      if (it.y > this.heightPx + 40) it.t = -1;
    }
    this.items = this.items.filter((it) => it.t >= 0);
  }

  private collect(it: Item) {
    it.t = -1;
    const p = this.player;
    if (it.kind === "pilula") {
      this.pills++;
      this.score += 50;
      this.events.sfx("pill");
      this.spark(it.x + it.w / 2, it.y + it.h / 2, "#ff6b8b", 4);
      if (this.pills % 100 === 0) this.oneUp(it.x, it.y);
    } else if (it.kind === "coracao") {
      p.power = Math.max(p.power, 1) as 1 | 2;
      this.addScore(1000, it.x, it.y);
      this.text(it.x, it.y - 24, "Touca reforçada!", "#e63946");
      this.events.sfx("powerup");
    } else {
      p.power = 2;
      this.addScore(1000, it.x, it.y);
      this.text(it.x, it.y - 24, "Seringa de calmante! (X)", "#2a6fdb");
      this.events.sfx("powerup");
    }
  }

  private updateProjectiles(dt: number) {
    const p = this.player;
    for (const pr of this.projectiles) {
      pr.ttl -= dt;
      pr.spin += dt * 14;
      if (pr.kind === "controle") pr.vy = Math.min(MAX_FALL, pr.vy + 1400 * dt);
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      const tx = Math.floor((pr.x + pr.w / 2) / TILE);
      const ty = Math.floor((pr.y + pr.h / 2) / TILE);
      if (this.isSolid(tx, ty)) {
        pr.ttl = 0;
        this.spark(pr.x + pr.w / 2, pr.y + pr.h / 2, pr.kind === "dardo" ? "#9ad1f5" : "#555", 4);
        continue;
      }

      if (pr.kind === "dardo") {
        for (const e of this.enemies)
          if (e.state === "walk" && e.active && overlaps(pr, e)) {
            pr.ttl = 0;
            this.combo = 0;
            this.damageEnemy(e);
            break;
          }
      } else if (overlaps(pr, p) && p.invulnerable <= 0 && this.phase === "playing") {
        pr.ttl = 0;
        this.hurtPlayer("Levou uma controlada na cabeça!");
      }
    }
    this.projectiles = this.projectiles.filter(
      (pr) => pr.ttl > 0 && pr.x > this.camX - 100 && pr.x < this.camX + VIEW_W + 100,
    );
  }

  private updateEffects(dt: number) {
    for (const b of this.bumps) b.t -= dt;
    this.bumps = this.bumps.filter((b) => b.t > 0);
    for (const pa of this.particles) {
      pa.ttl -= dt;
      pa.x += pa.vx * dt;
      pa.y += pa.vy * dt;
      if (pa.kind === "spark" || pa.kind === "pill") pa.vy += 1400 * dt;
    }
    this.particles = this.particles.filter((pa) => pa.ttl > 0);
  }

  private updateCamera(dt: number) {
    const target = this.player.x + this.player.w / 2 - VIEW_W * 0.42;
    const max = Math.max(0, this.widthPx - VIEW_W);
    const clamped = Math.max(0, Math.min(max, target));
    this.camX += (clamped - this.camX) * Math.min(1, dt * 8);
  }

  private onScreen(r: Rect) {
    return r.x + r.w > this.camX && r.x < this.camX + VIEW_W;
  }

  // ───────────────────────── Partículas ─────────────────────────

  private text(x: number, y: number, text: string, color: string) {
    this.particles.push({ x, y, vx: 0, vy: -50, ttl: 1, maxTtl: 1, kind: "text", text, color });
  }

  private spark(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++)
      this.particles.push({
        x,
        y,
        vx: rand(-160, 160),
        vy: rand(-380, -120),
        ttl: 0.6,
        maxTtl: 0.6,
        kind: "spark",
        color,
      });
  }

  private zzz(x: number, y: number): Particle {
    return { x, y, vx: rand(10, 30), vy: -40, ttl: 1.2, maxTtl: 1.2, kind: "zzz", text: "z", color: "#4f9fca" };
  }
}
