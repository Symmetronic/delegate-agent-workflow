import type { Direction } from "#/src/walk-input.ts";
import {
  isWalkable,
  TILE_SIZE,
  tileAt,
  type TilePosition,
} from "#/src/world.ts";

export interface Player {
  readonly x: number;
  readonly y: number;
  readonly facing: Direction;
  readonly walked: number;
}

export const WALK_SPEED = 48;

const MILLISECONDS_PER_SECOND = 1000;
const MAX_STEP = 1;
const HITBOX_INSET = 1;

const STEP_BY_DIRECTION: Readonly<
  Record<Direction, { readonly x: number; readonly y: number }>
> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function createPlayer(start: TilePosition): Player {
  return {
    x: start.column * TILE_SIZE,
    y: start.row * TILE_SIZE,
    facing: "down",
    walked: 0,
  };
}

function isFree(x: number, y: number): boolean {
  const firstColumn = Math.floor((x + HITBOX_INSET) / TILE_SIZE);
  const lastColumn = Math.ceil((x + TILE_SIZE - HITBOX_INSET) / TILE_SIZE) - 1;
  const firstRow = Math.floor((y + HITBOX_INSET) / TILE_SIZE);
  const lastRow = Math.ceil((y + TILE_SIZE - HITBOX_INSET) / TILE_SIZE) - 1;
  for (let row = firstRow; row <= lastRow; row += 1) {
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      if (!isWalkable(tileAt(column, row))) {
        return false;
      }
    }
  }
  return true;
}

export function walk(
  player: Player,
  direction: Direction | null,
  elapsedMilliseconds: number,
): Player {
  if (direction === null) {
    return player;
  }
  const step = STEP_BY_DIRECTION[direction];
  let { x, y, walked } = player;
  let remaining = (WALK_SPEED * elapsedMilliseconds) / MILLISECONDS_PER_SECOND;
  while (remaining > 0) {
    const distance = Math.min(remaining, MAX_STEP);
    const nextX = x + step.x * distance;
    const nextY = y + step.y * distance;
    if (!isFree(nextX, nextY)) {
      break;
    }
    x = nextX;
    y = nextY;
    walked += distance;
    remaining -= distance;
  }
  return { x, y, facing: direction, walked };
}
