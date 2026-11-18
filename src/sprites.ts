import { PALETTE_COLORS } from "#/src/palette.ts";
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

export const PLAYER_SPRITE: SpriteRows = [
  ".333333.",
  "33333333",
  "30033003",
  ".333333.",
  "..2222..",
  ".222222.",
  ".2.22.2.",
  ".33..33.",
];

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
