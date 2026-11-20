import type { LevelDef } from "./types";

export const ROWS = 17;
/** Linha (topo) do piso. O jogador fica em pé na linha GROUND - 1. */
export const GROUND = 15;
const STAND = GROUND - 1;

/**
 * Construtor de fases: escrever mapas ASCII de 200 colunas à mão é
 * propenso a erro, então montamos as fases com pequenas primitivas.
 *
 * Marcadores de entidades (convertidos em objetos pelo motor):
 *  S início · E saída (ALTA) · o pílula · p paciente · c paciente chato
 */
class LevelBuilder {
  private grid: string[][];

  constructor(private readonly width: number) {
    this.grid = Array.from({ length: ROWS }, () => Array<string>(width).fill("."));
  }

  private set(x: number, y: number, ch: string) {
    const row = this.grid[y];
    if (row && x >= 0 && x < this.width) row[x] = ch;
  }

  floor(x0: number, x1: number) {
    for (let x = x0; x <= x1; x++) for (let y = GROUND; y < ROWS; y++) this.set(x, y, "#");
    return this;
  }

  /** Uma cama horizontal de `w` tiles com o colchão na linha `y`. */
  bed(x: number, y: number, w = 3) {
    for (let i = 0; i < w; i++) this.set(x + i, y, "B");
    return this;
  }

  box(x: number, y: number, kind: "?" | "H" | "X" = "?") {
    this.set(x, y, kind);
    return this;
  }

  pills(x: number, y: number, n: number, step = 1) {
    for (let i = 0; i < n; i++) this.set(x + i * step, y, "o");
    return this;
  }

  paciente(x: number, y = STAND) {
    this.set(x, y, "p");
    return this;
  }

  chato(x: number, y = STAND) {
    this.set(x, y, "c");
    return this;
  }

  /** Armário de remédios: obstáculo sólido com `h` tiles de altura. */
  cabinet(x: number, h: number, w = 2) {
    for (let i = 0; i < w; i++) for (let j = 1; j <= h; j++) this.set(x + i, GROUND - j, "M");
    return this;
  }

  /** Escada de camas empilhadas (degraus). */
  stairs(x: number, steps: number, dir: 1 | -1 = 1) {
    for (let s = 0; s < steps; s++) {
      const col = dir === 1 ? x + s : x + steps - 1 - s;
      for (let j = 0; j <= s; j++) this.set(col, STAND - j, "M");
    }
    return this;
  }

  start(x: number) {
    this.set(x, STAND, "S");
    return this;
  }

  exit(x: number) {
    this.set(x, STAND, "E");
    return this;
  }

  build(): string[] {
    return this.grid.map((r) => r.join(""));
  }
}

function level1(): string[] {
  const b = new LevelBuilder(190);
  b.floor(0, 52).floor(56, 98).floor(102, 189);
  b.start(3);

  b.pills(9, 11, 3);
  b.box(14, 11).bed(16, 11, 3).box(19, 11, "H").bed(20, 11, 2);
  b.bed(18, 7, 2).pills(18, 6, 2);
  b.paciente(22);

  b.cabinet(28, 2);
  b.paciente(34).paciente(37);
  b.cabinet(41, 3);
  b.bed(45, 11, 4).pills(45, 10, 4);

  // primeiro buraco
  b.pills(53, 11, 3);
  b.bed(60, 11, 3).box(63, 11).bed(64, 11, 2);
  b.paciente(66).paciente(70);
  b.bed(68, 11, 2).bed(72, 8, 4).pills(72, 7, 4);
  b.chato(80);
  b.cabinet(85, 2);
  b.box(90, 11).box(91, 11, "X").box(92, 11);

  b.pills(99, 10, 3);
  b.paciente(108).paciente(111);
  b.bed(114, 11, 3).bed(119, 8, 3).bed(124, 11, 3);
  b.pills(119, 7, 3);
  b.paciente(126);
  b.cabinet(132, 3);
  b.chato(140);
  b.box(146, 11).bed(147, 11, 2).box(149, 11);

  b.stairs(160, 5);
  b.floor(165, 189);
  b.pills(170, 10, 5);
  b.exit(182);
  return b.build();
}

function level2(): string[] {
  const b = new LevelBuilder(210);
  b.floor(0, 30).floor(34, 60).floor(65, 90).floor(96, 130).floor(135, 160).floor(164, 209);
  b.start(3);

  b.bed(8, 11, 3).box(11, 11, "H").bed(12, 11, 2);
  b.paciente(16).chato(24);
  b.bed(27, 11, 3).pills(27, 10, 3);
  b.pills(31, 9, 3);

  b.cabinet(38, 2).paciente(44).paciente(46);
  b.bed(48, 11, 4).bed(54, 7, 3).pills(54, 6, 3);
  b.chato(56);
  b.pills(61, 9, 4);

  b.bed(68, 11, 2).box(70, 11).bed(71, 11, 2);
  b.paciente(74).paciente(77).paciente(80);
  b.cabinet(84, 3);
  b.bed(88, 10, 3).bed(92, 8, 3).pills(92, 7, 3);

  b.chato(104).chato(112);
  b.box(108, 11, "X").bed(109, 11, 3);
  b.cabinet(118, 2).cabinet(124, 4);
  b.pills(131, 9, 4);

  b.bed(138, 11, 3).paciente(140, 10).bed(143, 8, 3).paciente(144, 7);
  b.chato(150).paciente(154);
  b.pills(161, 9, 3);

  b.bed(168, 11, 2).box(170, 11).bed(171, 11, 2);
  b.chato(176).paciente(179);
  b.stairs(186, 6);
  b.floor(192, 209).pills(193, 9, 4);
  b.exit(202);
  return b.build();
}

function level3(): string[] {
  const b = new LevelBuilder(230);
  b.floor(0, 25).floor(30, 52).floor(58, 80).floor(86, 110).floor(115, 140).floor(146, 175).floor(180, 229);
  b.start(3);

  b.box(9, 11, "X").bed(10, 11, 3).box(13, 11, "H");
  b.chato(18).paciente(21);
  b.bed(23, 11, 2).bed(27, 9, 2).pills(27, 8, 2);

  b.chato(36).chato(42);
  b.cabinet(46, 3);
  b.bed(50, 9, 3).bed(55, 9, 2).pills(55, 8, 2);

  b.paciente(62).chato(66).paciente(70);
  b.bed(72, 11, 3).box(75, 11, "H").bed(76, 11, 2);
  b.bed(78, 7, 3).pills(78, 6, 3);
  b.bed(82, 10, 2);

  b.chato(92).chato(96).chato(100);
  b.cabinet(104, 4);
  b.bed(108, 10, 2).bed(112, 9, 2);

  b.bed(118, 11, 4).chato(119, 10);
  b.paciente(126).paciente(128).paciente(130);
  b.box(133, 11, "X").bed(134, 11, 2);
  b.bed(138, 9, 2).bed(142, 8, 3).pills(142, 7, 3);

  b.chato(152).chato(158).paciente(162);
  b.cabinet(166, 3).cabinet(171, 2);
  b.bed(176, 10, 3);

  b.chato(186).chato(190).chato(194);
  b.box(198, 11, "H").bed(199, 11, 3);
  b.stairs(206, 7);
  b.floor(213, 229).pills(214, 9, 5);
  b.exit(222);
  return b.build();
}

export const LEVELS: LevelDef[] = [
  { name: "Ala de Internação", subtitle: "Primeiro plantão", rows: level1() },
  { name: "Pronto-Socorro", subtitle: "Ninguém tem paciência", rows: level2() },
  { name: "UTI dos Chatos", subtitle: "Só os mais exigentes", rows: level3() },
];
