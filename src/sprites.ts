import { PALETTE_COLORS } from "#/src/palette.ts";
import type { Direction } from "#/src/walk-input.ts";
import type { TileKind } from "#/src/world.ts";

export type SpriteRows = readonly string[];

export const TILE_SPRITES: Readonly<Record<TileKind, SpriteRows>> = {
  ground: [
    "00000000",
    "00000000",
    "00010000",
    "00000000",
    "00000000",
    "00000010",
    "00000000",
    "00000000",
  ],
  "cable-grass": [
    "01001001",
    "21021021",
    "02102102",
    "01201201",
    "10210210",
    "12012012",
    "21021021",
    "02102102",
  ],
  obstacle: [
    "33333333",
    "32222223",
    "32333223",
    "32322223",
    "32222323",
    "32232223",
    "32222223",
    "33333333",
  ],
  "floor-mat": [
    "00000000",
    "02222220",
    "02111120",
    "02122120",
    "02122120",
    "02111120",
    "02222220",
    "00000000",
  ],
};

const PLAYER_DOWN_BODY: SpriteRows = [
  ".333333.",
  "33333333",
  "30033003",
  ".333333.",
  "..2222..",
  ".222222.",
];

const PLAYER_UP_BODY: SpriteRows = [
  ".333333.",
  "33333333",
  "33333333",
  ".333333.",
  "..2222..",
  ".222222.",
];

const PLAYER_LEFT_BODY: SpriteRows = [
  ".333333.",
  "33333333",
  "30333333",
  ".333333.",
  "..2222..",
  "..2222..",
];

const PLAYER_LEGS: readonly SpriteRows[] = [
  [".2.22.2.", ".33..33."],
  ["..2222..", "..3333.."],
];

function withLegs(body: SpriteRows, legs: SpriteRows): SpriteRows {
  return [...body, ...legs];
}

function mirror(rows: SpriteRows): SpriteRows {
  return rows.map((row) => row.split("").reverse().join(""));
}

function playerFrames(body: SpriteRows): readonly SpriteRows[] {
  return PLAYER_LEGS.map((legs) => withLegs(body, legs));
}

export const PLAYER_SPRITES: Readonly<
  Record<Direction, readonly SpriteRows[]>
> = {
  down: playerFrames(PLAYER_DOWN_BODY),
  up: playerFrames(PLAYER_UP_BODY),
  left: playerFrames(PLAYER_LEFT_BODY),
  right: playerFrames(PLAYER_LEFT_BODY).map(mirror),
};

export function bakeSprite(rows: SpriteRows): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = rows[0]?.length ?? 0;
  canvas.height = rows.length;
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D is not available");
  }
  rows.forEach((row, y) => {
    row.split("").forEach((symbol, x) => {
      const color = PALETTE_COLORS[Number(symbol)];
      if (color !== undefined) {
        context.fillStyle = color;
        context.fillRect(x, y, 1, 1);
      }
    });
  });
  return canvas;
}

export const SYSADMIN_SPRITE: SpriteRows = [
  "..3333..",
  ".333333.",
  ".310013.",
  ".333333.",
  "..2222..",
  ".222222.",
  "2.2222.2",
  "..3..3..",
];

export const BUBBLE_SPRITE: SpriteRows = [
  "3333333",
  "3000003",
  "3003003",
  "3003003",
  "3000003",
  "3003003",
  "3333333",
  "..3....",
];

export const TERMINAL_SPRITE: SpriteRows = [
  ".333333.",
  "32222223",
  "32100123",
  "32010123",
  "32222223",
  ".333333.",
  "..3333..",
  ".333333.",
];

export const MACHINE_SPRITE: SpriteRows = [
  "....33333333....",
  "...3222222223...",
  "..322222222223..",
  "..321100112023..",
  "..321100112023..",
  "..322222222223..",
  "..323333333323..",
  "..323000000323..",
  "..323333333323..",
  "..322222222223..",
  "..333333333333..",
  ".33.3......3.33.",
  "3...3......3...3",
  "....33....33....",
  "....33....33....",
  "...333....333...",
];
