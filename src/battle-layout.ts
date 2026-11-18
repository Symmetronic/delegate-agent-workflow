import type { Point } from "#/src/camera.ts";

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
