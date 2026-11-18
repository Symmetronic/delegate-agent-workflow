import type { Point } from "#/src/camera.ts";
import {
  GLYPH_ADVANCE,
  GLYPH_HEIGHT,
  GLYPH_WIDTH,
  LINE_HEIGHT,
} from "#/src/font.ts";
import { paginate, type TextPage } from "#/src/text-window.ts";

export interface Cell {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const GRID_LEFT = 4;
const GRID_TOP = 90;
const CELL_WIDTH = 74;
const CELL_HEIGHT = 24;
const CELL_GAP = 4;
const COLUMNS = 2;
const CELL_COUNT = 4;
const LABEL_PADDING = 2;
const LABEL_LINES = 2;
const HALF = 2;
const LABEL_COLUMNS = Math.floor(
  (CELL_WIDTH - LABEL_PADDING * HALF + GLYPH_ADVANCE - GLYPH_WIDTH) /
    GLYPH_ADVANCE,
);

export interface AttackLabel {
  readonly lines: TextPage;
  readonly x: number;
  readonly y: number;
}

export const ATTACK_CELLS: readonly Cell[] = Array.from(
  { length: CELL_COUNT },
  (_, index) => ({
    x: GRID_LEFT + (index % COLUMNS) * (CELL_WIDTH + CELL_GAP),
    y: GRID_TOP + Math.floor(index / COLUMNS) * (CELL_HEIGHT + CELL_GAP),
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
  }),
);

export function attackAt(point: Point): number | null {
  const index = ATTACK_CELLS.findIndex(
    (cell) =>
      point.x >= cell.x &&
      point.x < cell.x + cell.width &&
      point.y >= cell.y &&
      point.y < cell.y + cell.height,
  );
  return index >= 0 ? index : null;
}

export function attackLabel(cell: Cell, name: string): AttackLabel {
  const lines = paginate(name, LABEL_COLUMNS, LABEL_LINES)[0] ?? [];
  const width =
    Math.max(...lines.map((line) => line.length), 0) * GLYPH_ADVANCE -
    (GLYPH_ADVANCE - GLYPH_WIDTH);
  const height = lines.length * LINE_HEIGHT - (LINE_HEIGHT - GLYPH_HEIGHT);
  return {
    lines,
    x: cell.x + Math.floor((cell.width - width) / HALF),
    y: cell.y + Math.floor((cell.height - height) / HALF),
  };
}
