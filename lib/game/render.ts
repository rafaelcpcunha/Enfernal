import { COLORS as C, TILE, VIEW_H, VIEW_W } from "./constants";
import type { GameEngine } from "./engine";
import type { Enemy, Item, Particle, Player, Projectile } from "./types";

type Ctx = CanvasRenderingContext2D;

const FONT = 'ui-rounded, "Segoe UI", system-ui, -apple-system, sans-serif';

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function cross(ctx: Ctx, cx: number, cy: number, size: number, color: string = C.cross) {
  const t = size / 3;
  ctx.fillStyle = color;
  ctx.fillRect(cx - t / 2, cy - size / 2, t, size);
  ctx.fillRect(cx - size / 2, cy - t / 2, size, t);
}

// ───────────────────────── Cenário ─────────────────────────

function drawBackground(ctx: Ctx, g: GameEngine) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, "#e9f7f5");
  sky.addColorStop(1, C.wall);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Faixa decorativa da parede + rodapé
  ctx.fillStyle = C.wallStripe;
  ctx.fillRect(0, 300, VIEW_W, 16);
  ctx.fillStyle = C.wallBase;
  ctx.fillRect(0, 400, VIEW_W, 80);
  ctx.fillStyle = "#8cc7bf";
  ctx.fillRect(0, 396, VIEW_W, 6);

  // Elementos com parallax (andam a 50% da câmera)
  const par = g.camX * 0.5;
  const span = 420;
  const first = Math.floor(par / span) - 1;
  for (let i = first; i < first + VIEW_W / span + 3; i++) {
    const x = i * span - par;
    const kind = ((i % 4) + 4) % 4;

    // Janela com céu e nuvem
    if (kind !== 2) {
      rr(ctx, x + 40, 110, 150, 120, 8);
      ctx.fillStyle = "#b9e3f7";
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      const cx = x + 80 + ((g.clock * 6 + i * 37) % 90);
      ctx.arc(cx, 150, 14, 0, Math.PI * 2);
      ctx.arc(cx + 16, 145, 18, 0, Math.PI * 2);
      ctx.arc(cx + 34, 152, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6;
      rr(ctx, x + 40, 110, 150, 120, 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 115, 110);
      ctx.lineTo(x + 115, 230);
      ctx.moveTo(x + 40, 170);
      ctx.lineTo(x + 190, 170);
      ctx.lineWidth = 4;
      ctx.stroke();
    } else {
      // Porta de quarto numerada
      ctx.fillStyle = "#b8d8d3";
      ctx.fillRect(x + 50, 220, 90, 180);
      ctx.fillStyle = "#9cc5bf";
      ctx.fillRect(x + 60, 232, 70, 60);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + 72, 240, 46, 22);
      ctx.fillStyle = C.text;
      ctx.font = `bold 14px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(String(100 + ((i * 7) % 90)), x + 95, 256);
      ctx.fillStyle = "#6e9e98";
      ctx.fillRect(x + 122, 315, 10, 4);
    }

    // Placas
    if (kind === 1) {
      rr(ctx, x + 250, 140, 110, 40, 6);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.fillStyle = "#2a9d8f";
      ctx.font = `bold 15px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("SILÊNCIO", x + 305, 166);
    } else if (kind === 3) {
      rr(ctx, x + 260, 120, 70, 70, 10);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      cross(ctx, x + 295, 155, 40);
    } else if (kind === 0) {
      // Suporte de soro
      ctx.strokeStyle = "#9aa7b2";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 300, 250);
      ctx.lineTo(x + 300, 398);
      ctx.moveTo(x + 285, 398);
      ctx.lineTo(x + 315, 398);
      ctx.moveTo(x + 288, 250);
      ctx.lineTo(x + 312, 250);
      ctx.stroke();
      rr(ctx, x + 292, 254, 16, 26, 4);
      ctx.fillStyle = "rgba(170,220,255,0.9)";
      ctx.fill();
    }
  }

  // Corrimão
  ctx.fillStyle = "#c9d6de";
  ctx.fillRect(0, 352, VIEW_W, 8);
  ctx.fillStyle = "#e9eef2";
  ctx.fillRect(0, 352, VIEW_W, 3);
}

function drawFloorTile(ctx: Ctx, x: number, y: number, top: boolean) {
  ctx.fillStyle = top ? C.floor : C.floorDark;
  ctx.fillRect(x, y, TILE, TILE);
  if (top) {
    ctx.fillStyle = C.floorLight;
    ctx.fillRect(x, y, TILE, 5);
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(x + TILE - 2, y + 5, 2, TILE - 5);
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(x, y, TILE, 2);
    ctx.fillRect(x + TILE - 2, y, 2, TILE);
  }
}

/** Cama: tiles vizinhos formam uma cama só, com cabeceira, travesseiro e peseira. */
function drawBedTile(ctx: Ctx, x: number, y: number, left: boolean, right: boolean, index: number) {
  // Estrutura metálica e pés com rodinhas
  ctx.fillStyle = C.bedFrame;
  ctx.fillRect(x, y + 18, TILE, 5);
  ctx.fillStyle = C.bedFrameDark;
  if (left) ctx.fillRect(x + 3, y + 22, 3, 7);
  if (right) ctx.fillRect(x + TILE - 6, y + 22, 3, 7);
  ctx.fillStyle = "#333d47";
  if (left) {
    ctx.beginPath();
    ctx.arc(x + 4.5, y + 29.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (right) {
    ctx.beginPath();
    ctx.arc(x + TILE - 4.5, y + 29.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Colchão
  ctx.fillStyle = C.mattress;
  ctx.fillRect(x + (left ? 4 : 0), y + 4, TILE - (left ? 4 : 0) - (right ? 4 : 0), 14);
  ctx.fillStyle = "#e3e9ef";
  ctx.fillRect(x + (left ? 4 : 0), y + 15, TILE - (left ? 4 : 0) - (right ? 4 : 0), 3);

  // Lençol azul (exceto no tile do travesseiro)
  if (!left) {
    ctx.fillStyle = C.sheet;
    ctx.fillRect(x, y + 5, TILE - (right ? 4 : 0), 12);
    ctx.fillStyle = C.sheetDark;
    ctx.fillRect(x, y + 14, TILE - (right ? 4 : 0), 3);
    if (index === 1) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y + 5, 4, 12);
    }
  } else {
    // Travesseiro
    rr(ctx, x + 6, y, 22, 10, 5);
    ctx.fillStyle = C.pillow;
    ctx.fill();
    ctx.strokeStyle = "#d5dde5";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Cabeceira (alta) e peseira (baixa)
  ctx.fillStyle = C.bedFrame;
  if (left) {
    rr(ctx, x, y - 12, 6, 36, 2);
    ctx.fill();
    ctx.fillRect(x, y - 12, 12, 4);
  }
  if (right) {
    rr(ctx, x + TILE - 6, y - 2, 6, 26, 2);
    ctx.fill();
    ctx.fillRect(x + TILE - 12, y - 2, 12, 3);
  }
}

function drawMedkit(ctx: Ctx, x: number, y: number, used: boolean, clock: number) {
  rr(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 5);
  ctx.fillStyle = used ? C.medkitUsed : C.medkit;
  ctx.fill();
  ctx.strokeStyle = used ? "#9aa1a8" : "#e63946";
  ctx.lineWidth = 2;
  ctx.stroke();
  if (used) {
    cross(ctx, x + TILE / 2, y + TILE / 2, 14, "#a7aeb5");
  } else {
    const pulse = 16 + Math.sin(clock * 6) * 2;
    cross(ctx, x + TILE / 2, y + TILE / 2, pulse);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(x + 4, y + 4, 8, 3);
  }
}

function drawCabinet(ctx: Ctx, x: number, y: number, isTop: boolean, isLeft: boolean) {
  ctx.fillStyle = "#d6dee5";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#b5c0ca";
  ctx.fillRect(isLeft ? x : x + TILE - 2, y, 2, TILE);
  if (isTop) {
    ctx.fillStyle = "#eef3f7";
    ctx.fillRect(x, y, TILE, 4);
    ctx.fillStyle = "rgba(160,215,240,0.7)";
    ctx.fillRect(x + 4, y + 7, TILE - 8, TILE - 11);
    const colors = ["#e76f51", "#2a9d8f", "#f4a261"];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = colors[(i + (isLeft ? 0 : 1)) % 3]!;
      ctx.fillRect(x + 7 + i * 7, y + 14, 4, 11);
    }
  } else {
    ctx.fillStyle = "#c3ccd5";
    ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
    ctx.fillStyle = "#7f8b96";
    ctx.fillRect(x + TILE / 2 - 5, y + TILE / 2 - 1, 10, 3);
  }
}

function drawExit(ctx: Ctx, g: GameEngine) {
  const { x, y, w, h } = g.exit;
  // Batente e portas duplas
  ctx.fillStyle = "#7fa9a3";
  ctx.fillRect(x - 6, y - 6, w + 12, h + 6);
  ctx.fillStyle = "#cfe9e5";
  ctx.fillRect(x, y, w / 2 - 1, h);
  ctx.fillRect(x + w / 2 + 1, y, w / 2 - 1, h);
  ctx.fillStyle = "#a9d6ef";
  ctx.fillRect(x + 6, y + 12, w / 2 - 13, 26);
  ctx.fillRect(x + w / 2 + 7, y + 12, w / 2 - 13, 26);
  ctx.fillStyle = "#6e8a86";
  ctx.fillRect(x + w / 2 - 6, y + 50, 3, 14);
  ctx.fillRect(x + w / 2 + 3, y + 50, 3, 14);
  // Placa "ALTA"
  rr(ctx, x - 14, y - 40, w + 28, 28, 6);
  ctx.fillStyle = "#2a9d8f";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 18px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("ALTA ➜", x + w / 2, y - 20);
}

function drawTiles(ctx: Ctx, g: GameEngine) {
  const x0 = Math.max(0, Math.floor(g.camX / TILE) - 1);
  const x1 = Math.min(g.cols - 1, Math.ceil((g.camX + VIEW_W) / TILE) + 1);
  const bumpOf = (tx: number, ty: number) => {
    const b = g.bumps.find((b) => b.tx === tx && b.ty === ty);
    return b ? Math.sin((b.t / 0.2) * Math.PI) * 8 : 0;
  };

  for (let ty = 0; ty < g.tiles.length; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const t = g.tileAt(tx, ty);
      if (t === ".") continue;
      const x = tx * TILE;
      const y = ty * TILE - bumpOf(tx, ty);
      switch (t) {
        case "#":
          drawFloorTile(ctx, x, y, g.tileAt(tx, ty - 1) !== "#");
          break;
        case "B": {
          const left = g.tileAt(tx - 1, ty) !== "B";
          const right = g.tileAt(tx + 1, ty) !== "B";
          let index = 0;
          while (g.tileAt(tx - index - 1, ty) === "B") index++;
          drawBedTile(ctx, x, y, left, right, index);
          break;
        }
        case "?":
        case "H":
        case "X":
          drawMedkit(ctx, x, y, false, g.clock);
          break;
        case "u":
          drawMedkit(ctx, x, y, true, g.clock);
          break;
        case "M":
          drawCabinet(ctx, x, y, g.tileAt(tx, ty - 1) !== "M", g.tileAt(tx - 1, ty) !== "M");
          break;
      }
    }
  }
}

// ───────────────────────── Personagens ─────────────────────────

function drawNurse(ctx: Ctx, p: Player, clock: number, dead: boolean) {
  if (p.invulnerable > 0 && Math.floor(clock * 20) % 2 === 0) return;
  const cx = p.x + p.w / 2;
  const top = p.y;
  const f = p.facing;
  const moving = Math.abs(p.vx) > 10 && p.onGround;
  const swing = moving ? Math.sin(p.walkCycle) * 6 : 0;
  const airborne = !p.onGround && !dead;

  ctx.save();
  ctx.translate(cx, 0);
  ctx.scale(f, 1);

  // Pernas (calça branca) e sapatos
  ctx.fillStyle = "#e8eef7";
  const legY = top + 32;
  const l1 = airborne ? -5 : swing;
  const l2 = airborne ? 5 : -swing;
  ctx.fillRect(-6 + l1 * 0.4, legY, 5, 10);
  ctx.fillRect(1 + l2 * 0.4, legY, 5, 10);
  ctx.fillStyle = "#ffffff";
  rr(ctx, -8 + l1 * 0.4, legY + 9, 8, 4, 2);
  ctx.fill();
  rr(ctx, 0 + l2 * 0.4, legY + 9, 8, 4, 2);
  ctx.fill();
  ctx.fillStyle = "#b8c4d3";
  ctx.fillRect(-8 + l1 * 0.4, legY + 12, 8, 1);
  ctx.fillRect(0 + l2 * 0.4, legY + 12, 8, 1);

  // Braço de trás
  ctx.fillStyle = C.skin;
  ctx.save();
  ctx.translate(-5, top + 18);
  ctx.rotate(airborne ? -2.4 : (-swing * Math.PI) / 60);
  ctx.fillRect(-2, 0, 4, 12);
  ctx.restore();

  // Uniforme (vestido branco com detalhes azuis)
  ctx.fillStyle = C.nurseUniform;
  ctx.beginPath();
  ctx.moveTo(-8, top + 16);
  ctx.lineTo(8, top + 16);
  ctx.lineTo(11, top + 34);
  ctx.lineTo(-11, top + 34);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#cfd9e6";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = C.nurseAccent;
  ctx.fillRect(-11, top + 32, 22, 2);
  ctx.fillRect(-1, top + 17, 2, 14);
  // Bolso com cruz
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(2, top + 20, 6, 5);
  cross(ctx, 5, top + 22.5, 4);

  // Estetoscópio
  ctx.strokeStyle = "#2b3a4a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-5, top + 16);
  ctx.quadraticCurveTo(-6, top + 24, -2, top + 26);
  ctx.moveTo(5, top + 16);
  ctx.quadraticCurveTo(4, top + 22, 1, top + 26);
  ctx.stroke();
  ctx.fillStyle = "#9aa7b2";
  ctx.beginPath();
  ctx.arc(0, top + 27, 2, 0, Math.PI * 2);
  ctx.fill();

  // Cabeça
  ctx.fillStyle = C.skin;
  ctx.beginPath();
  ctx.arc(1, top + 10, 7.5, 0, Math.PI * 2);
  ctx.fill();
  // Cabelo + coque
  ctx.fillStyle = C.hair;
  ctx.beginPath();
  ctx.arc(0, top + 8, 7.5, Math.PI * 0.95, Math.PI * 2.05);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-7, top + 9, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-7, top + 7, 4, 8);
  // Olho, bochecha e sorriso
  if (dead) {
    ctx.strokeStyle = "#2b2b2b";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(3, top + 8);
    ctx.lineTo(6, top + 11);
    ctx.moveTo(6, top + 8);
    ctx.lineTo(3, top + 11);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#2b2b2b";
    ctx.fillRect(4, top + 8, 2, 3);
    ctx.fillStyle = "rgba(240,120,120,0.5)";
    ctx.fillRect(3, top + 12, 4, 2);
    ctx.strokeStyle = "#8a4b3a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(5, top + 13, 2, 0.1, Math.PI * 0.9);
    ctx.stroke();
  }

  // Touca de enfermeira com cruz vermelha
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-7, top + 3);
  ctx.lineTo(-5, top - 4);
  ctx.lineTo(7, top - 4);
  ctx.lineTo(8, top + 3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = p.power >= 1 ? "#e63946" : "#d4dce6";
  ctx.lineWidth = p.power >= 1 ? 2 : 1;
  ctx.stroke();
  cross(ctx, 1, top - 0.5, 5);
  if (p.power >= 1) {
    ctx.fillStyle = `rgba(230,57,70,${0.25 + Math.sin(clock * 8) * 0.15})`;
    ctx.beginPath();
    ctx.arc(1, top, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Braço da frente (com seringa se tiver o power-up)
  ctx.save();
  ctx.translate(4, top + 18);
  ctx.rotate(airborne ? -2.2 : p.power === 2 ? -1.3 : (swing * Math.PI) / 60);
  ctx.fillStyle = C.skin;
  ctx.fillRect(-2, 0, 4, 12);
  if (p.power === 2) {
    ctx.fillStyle = "rgba(200,235,255,0.95)";
    ctx.fillRect(-2.5, 10, 5, 12);
    ctx.fillStyle = "#4f9fca";
    ctx.fillRect(-2.5, 16, 5, 6);
    ctx.fillStyle = "#9aa7b2";
    ctx.fillRect(-0.5, 22, 1, 6);
  }
  ctx.restore();

  ctx.restore();
}

function drawPatient(ctx: Ctx, e: Enemy, clock: number) {
  const chato = e.kind === "chato";
  const sleeping = e.state === "sleep";
  const cx = e.x + e.w / 2;
  const bottom = e.y + e.h;

  ctx.save();
  if (sleeping) {
    // Deitado, dormindo tranquilo
    ctx.translate(cx, bottom - 6);
    ctx.rotate(-Math.PI / 2 * e.dir);
    ctx.translate(0, -e.h / 2 + 6);
  } else {
    ctx.translate(cx, e.y + e.h / 2);
    if (e.dir < 0) ctx.scale(-1, 1);
  }
  const h = e.h;
  const top = -h / 2;
  const swing = sleeping ? 0 : Math.sin(e.walkCycle) * 4;
  const angry = chato && (e.hp < 2 || e.hurtFlash > 0);

  // Pernas e chinelos
  ctx.fillStyle = C.skin;
  ctx.fillRect(-6 + swing * 0.5, top + h - 12, 4, 10);
  ctx.fillRect(2 - swing * 0.5, top + h - 12, 4, 10);
  ctx.fillStyle = chato ? "#7b4b94" : "#3d7ea6";
  ctx.fillRect(-8 + swing * 0.5, top + h - 3, 7, 3);
  ctx.fillRect(1 - swing * 0.5, top + h - 3, 7, 3);

  // Camisola hospitalar com bolinhas
  const gown = chato ? (angry ? "#f0806b" : C.gownChato) : C.gown;
  ctx.fillStyle = gown;
  ctx.beginPath();
  ctx.moveTo(-9, top + 14);
  ctx.lineTo(9, top + 14);
  ctx.lineTo(12, top + h - 10);
  ctx.lineTo(-12, top + h - 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(-6 + (i % 3) * 6, top + 19 + Math.floor(i / 3) * 8, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pulseira de identificação
  ctx.fillStyle = C.skin;
  ctx.fillRect(7, top + 16, 4, 11);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(7, top + 23, 4, 2);

  // Cabeça
  ctx.fillStyle = angry ? "#f2a08a" : C.skin;
  ctx.beginPath();
  ctx.arc(1, top + 8, 8, 0, Math.PI * 2);
  ctx.fill();
  // Cabelo bagunçado / careca grisalho
  ctx.fillStyle = chato ? "#bfbfbf" : "#6b4a2f";
  ctx.beginPath();
  if (chato) {
    ctx.arc(-6, top + 5, 3.5, 0, Math.PI * 2);
    ctx.arc(-2, top + 1, 3, 0, Math.PI * 2);
  } else {
    ctx.arc(0, top + 5, 8, Math.PI, Math.PI * 2);
    ctx.moveTo(-6, top + 1);
    ctx.lineTo(-3, top - 4);
    ctx.lineTo(0, top);
    ctx.lineTo(3, top - 4);
    ctx.lineTo(5, top + 1);
  }
  ctx.fill();

  if (sleeping) {
    ctx.strokeStyle = "#2b2b2b";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(5, top + 7, 2, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(5, top + 12, 1.5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (chato) {
    // Sobrancelha franzida, óculos e boca reclamando
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(1, top + 3);
    ctx.lineTo(8, top + 6);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(5, top + 8, 2.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#222";
    ctx.fillRect(4.5, top + 7, 1.5, 2);
    const open = 1.5 + Math.abs(Math.sin(clock * 12)) * (e.bubble ? 2.5 : 0.5);
    ctx.fillStyle = "#7a2222";
    rr(ctx, 3, top + 12, 5, open, 1);
    ctx.fill();
    if (angry) {
      ctx.fillStyle = "#e63946";
      ctx.font = `bold 10px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("💢", -6, top - 2);
    }
  } else {
    // Cara cansada
    ctx.fillStyle = "#2b2b2b";
    ctx.fillRect(4, top + 6, 2, 2);
    ctx.strokeStyle = "#9b6b55";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(3, top + 9.5);
    ctx.lineTo(7, top + 9.5);
    ctx.stroke();
    ctx.strokeStyle = "#5a3a2a";
    ctx.beginPath();
    ctx.arc(5, top + 14, 2, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }

  // Braço do chato apontando o dedo pra cima / segurando controle
  if (chato && !sleeping) {
    ctx.save();
    ctx.translate(-6, top + 16);
    ctx.rotate(-2.6 + Math.sin(clock * 10) * 0.3);
    ctx.fillStyle = C.skin;
    ctx.fillRect(-2, 0, 4, 12);
    ctx.fillStyle = "#222";
    ctx.fillRect(-2.5, 10, 5, 8);
    ctx.fillStyle = "#e63946";
    ctx.fillRect(-1, 12, 2, 2);
    ctx.restore();
  }

  ctx.restore();

  // Balão de fala (não espelhado)
  if (e.bubble && !sleeping) drawBubble(ctx, cx, e.y - 10, e.bubble.text, chato);
}

function drawBubble(ctx: Ctx, x: number, y: number, text: string, loud: boolean) {
  ctx.font = `bold ${loud ? 13 : 12}px ${FONT}`;
  const w = ctx.measureText(text).width + 16;
  const h = 22;
  const bx = x - w / 2;
  const by = y - h - 8;
  ctx.fillStyle = loud ? "#fff4e6" : "#ffffff";
  ctx.strokeStyle = loud ? "#e76f51" : "#9fb3c8";
  ctx.lineWidth = 2;
  rr(ctx, bx, by, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 5, by + h - 1);
  ctx.lineTo(x, by + h + 7);
  ctx.lineTo(x + 5, by + h - 1);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(x - 4, by + h - 3, 8, 3);
  ctx.fillStyle = loud ? "#9c2f1a" : C.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, by + h / 2 + 1);
  ctx.textBaseline = "alphabetic";
}

function drawItem(ctx: Ctx, it: Item) {
  const cx = it.x + it.w / 2;
  const cy = it.y + it.h / 2 + (it.floating ? Math.sin(it.t * 3) * 2 : 0);
  ctx.save();
  ctx.translate(cx, cy);
  if (it.kind === "pilula") {
    ctx.scale(Math.max(0.25, Math.abs(Math.cos(it.t * 3))), 1);
    ctx.rotate(-0.6);
    rr(ctx, -4, -9, 8, 18, 4);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-4, -9, 8, 9, [4, 4, 0, 0]);
    ctx.fillStyle = "#ff4d6d";
    ctx.fill();
    rr(ctx, -4, -9, 8, 18, 4);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (it.kind === "coracao") {
    ctx.fillStyle = "#e63946";
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-14, 0, -10, -12, 0, -5);
    ctx.bezierCurveTo(10, -12, 14, 0, 0, 10);
    ctx.fill();
    cross(ctx, 0, -1, 8, "#ffffff");
  } else {
    ctx.rotate(-0.7);
    ctx.fillStyle = "rgba(210,240,255,0.95)";
    ctx.fillRect(-4, -10, 8, 16);
    ctx.fillStyle = "#4f9fca";
    ctx.fillRect(-4, -2, 8, 8);
    ctx.strokeStyle = "#5f7d95";
    ctx.lineWidth = 1;
    ctx.strokeRect(-4, -10, 8, 16);
    ctx.fillStyle = "#5f7d95";
    ctx.fillRect(-6, -13, 12, 3);
    ctx.fillRect(-1, -16, 2, 4);
    ctx.fillStyle = "#9aa7b2";
    ctx.fillRect(-0.5, 6, 1, 8);
  }
  ctx.restore();
}

function drawProjectile(ctx: Ctx, pr: Projectile) {
  ctx.save();
  ctx.translate(pr.x + pr.w / 2, pr.y + pr.h / 2);
  if (pr.kind === "dardo") {
    if (pr.vx < 0) ctx.scale(-1, 1);
    ctx.fillStyle = "rgba(210,240,255,0.95)";
    ctx.fillRect(-9, -3, 12, 6);
    ctx.fillStyle = "#4f9fca";
    ctx.fillRect(-5, -3, 8, 6);
    ctx.fillStyle = "#9aa7b2";
    ctx.fillRect(3, -0.5, 7, 1);
    ctx.fillStyle = "#5f7d95";
    ctx.fillRect(-11, -4, 2, 8);
  } else {
    ctx.rotate(pr.spin);
    rr(ctx, -4, -8, 8, 16, 2);
    ctx.fillStyle = "#222";
    ctx.fill();
    ctx.fillStyle = "#e63946";
    ctx.fillRect(-2, -6, 4, 2);
    ctx.fillStyle = "#aaa";
    ctx.fillRect(-2, -2, 1.5, 1.5);
    ctx.fillRect(0.5, -2, 1.5, 1.5);
    ctx.fillRect(-2, 1, 1.5, 1.5);
    ctx.fillRect(0.5, 1, 1.5, 1.5);
  }
  ctx.restore();
}

function drawParticle(ctx: Ctx, pa: Particle) {
  const a = Math.max(0, pa.ttl / pa.maxTtl);
  ctx.globalAlpha = Math.min(1, a * 1.5);
  if (pa.kind === "spark") {
    ctx.fillStyle = pa.color;
    ctx.fillRect(pa.x - 2, pa.y - 2, 4, 4);
  } else if (pa.kind === "pill") {
    ctx.save();
    ctx.translate(pa.x, pa.y);
    ctx.rotate(pa.ttl * 12);
    rr(ctx, -4, -8, 8, 16, 4);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.fillStyle = pa.color;
    ctx.fillRect(-4, -8, 8, 8);
    ctx.restore();
  } else {
    ctx.font = pa.kind === "zzz" ? `bold ${12 + (1 - a) * 8}px ${FONT}` : `bold 14px ${FONT}`;
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.strokeText(pa.text ?? "", pa.x, pa.y);
    ctx.fillStyle = pa.color;
    ctx.fillText(pa.text ?? "", pa.x, pa.y);
  }
  ctx.globalAlpha = 1;
}

// ───────────────────────── HUD ─────────────────────────

function drawHud(ctx: Ctx, g: GameEngine) {
  ctx.fillStyle = "rgba(18,52,59,0.82)";
  rr(ctx, 12, 10, VIEW_W - 24, 40, 12);
  ctx.fill();

  ctx.textBaseline = "middle";
  ctx.font = `bold 17px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText(`PONTOS ${String(g.score).padStart(6, "0")}`, 28, 31);

  // Pílulas
  ctx.save();
  ctx.translate(232, 31);
  ctx.rotate(-0.6);
  rr(ctx, -4, -9, 8, 18, 4);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.fillStyle = "#ff4d6d";
  ctx.fillRect(-4, -9, 8, 9);
  ctx.restore();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`× ${String(g.pills).padStart(2, "0")}`, 246, 31);

  // Vidas (corações)
  ctx.fillText("VIDAS", 340, 31);
  for (let i = 0; i < Math.min(g.lives, 6); i++) {
    const x = 410 + i * 20;
    ctx.fillStyle = "#ff5d6c";
    ctx.beginPath();
    ctx.moveTo(x, 38);
    ctx.bezierCurveTo(x - 10, 31, x - 7, 22, x, 27);
    ctx.bezierCurveTo(x + 7, 22, x + 10, 31, x, 38);
    ctx.fill();
  }
  if (g.lives > 6) {
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`+${g.lives - 6}`, 532, 31);
  }

  ctx.fillStyle = "#9ee6dc";
  ctx.textAlign = "center";
  ctx.fillText(`${g.levelIndex + 1}/${g.totalLevels} · ${g.level.name}`, 680, 31);

  ctx.textAlign = "right";
  ctx.fillStyle = g.time < 60 && Math.floor(g.clock * 4) % 2 === 0 ? "#ffb4a2" : "#ffffff";
  ctx.fillText(`⏱ ${Math.ceil(g.time)}`, VIEW_W - 28, 31);
  ctx.textBaseline = "alphabetic";

  if (g.player.power === 2) {
    ctx.font = `bold 12px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(18,52,59,0.75)";
    ctx.fillText("X: atirar calmante", 24, 68);
  }
}

function drawCenterCard(ctx: Ctx, title: string, subtitle: string, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.font = `800 40px ${FONT}`;
  const w = Math.max(ctx.measureText(title).width + 80, 420);
  rr(ctx, VIEW_W / 2 - w / 2, 170, w, 120, 18);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fill();
  ctx.strokeStyle = "#2a9d8f";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = C.text;
  ctx.fillText(title, VIEW_W / 2, 228);
  ctx.font = `600 18px ${FONT}`;
  ctx.fillStyle = "#2a9d8f";
  ctx.fillText(subtitle, VIEW_W / 2, 262);
  ctx.globalAlpha = 1;
}

// ───────────────────────── Frame ─────────────────────────

export function render(ctx: Ctx, g: GameEngine) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawBackground(ctx, g);

  // Câmera: alinha a base da fase com a base da tela.
  const camY = g.heightPx - VIEW_H;
  ctx.save();
  ctx.translate(-Math.round(g.camX), -camY);

  drawExit(ctx, g);
  // Itens saindo do kit médico são desenhados atrás dele.
  for (const it of g.items) if (it.emerge > 0) drawItem(ctx, it);
  drawTiles(ctx, g);
  for (const it of g.items) if (it.emerge <= 0) drawItem(ctx, it);
  for (const e of g.enemies) if (e.active || e.x < g.camX + VIEW_W + 64) drawPatient(ctx, e, g.clock);
  for (const pr of g.projectiles) drawProjectile(ctx, pr);
  if (g.phase !== "title") drawNurse(ctx, g.player, g.clock, g.phase === "dying");
  for (const pa of g.particles) drawParticle(ctx, pa);

  ctx.restore();

  if (g.phase === "title") return;
  drawHud(ctx, g);

  if (g.phase === "playing" && g.bannerTimer > 0) {
    drawCenterCard(ctx, `Fase ${g.levelIndex + 1}: ${g.level.name}`, g.level.subtitle, Math.min(1, g.bannerTimer));
  } else if (g.phase === "dying" && g.phaseTimer > 0.6) {
    drawCenterCard(ctx, "Ops!", g.deathReason);
  } else if (g.phase === "levelClear") {
    drawCenterCard(ctx, "Alta concedida! 🎉", `Bônus de tempo · ${Math.ceil(g.time)}s restantes`);
  }
}
