import type { Point } from "#/src/camera.ts";
import type { Direction } from "#/src/walk-input.ts";
import {
  isWalkable,
  TILE_SIZE,
  tileAt,
  type TilePosition,
} from "#/src/world.ts";

export interface Walker {
  readonly tile: TilePosition;
  readonly facing: Direction;
  readonly progress: number;
}

export interface Player extends Walker {
  readonly walked: number;
  readonly turnRemaining: number;
  readonly stepping: boolean;
}

export type IsFree = (tile: TilePosition) => boolean;

export const WALK_SPEED = 48;
export const TURN_MILLISECONDS = 120;

const MILLISECONDS_PER_SECOND = 1000;
const ROUNDING_TOLERANCE = 1e-6;

const STEP_BY_DIRECTION: Readonly<
  Record<Direction, { readonly column: number; readonly row: number }>
> = {
  up: { column: 0, row: -1 },
  down: { column: 0, row: 1 },
  left: { column: -1, row: 0 },
  right: { column: 1, row: 0 },
};

export function neighbor(
  tile: TilePosition,
  direction: Direction,
): TilePosition {
  const step = STEP_BY_DIRECTION[direction];
  return { column: tile.column + step.column, row: tile.row + step.row };
}

export function isWalkableTile(tile: TilePosition): boolean {
  return isWalkable(tileAt(tile.column, tile.row));
}

export function createPlayer(start: TilePosition): Player {
  return {
    tile: start,
    facing: "down",
    progress: 0,
    walked: 0,
    turnRemaining: 0,
    stepping: false,
  };
}

export function positionOf(walker: Walker): Point {
  const step = STEP_BY_DIRECTION[walker.facing];
  return {
    x: walker.tile.column * TILE_SIZE + step.column * walker.progress,
    y: walker.tile.row * TILE_SIZE + step.row * walker.progress,
  };
}

export function occupiedTiles(walker: Walker): readonly TilePosition[] {
  return walker.progress > 0
    ? [walker.tile, neighbor(walker.tile, walker.facing)]
    : [walker.tile];
}

export function isStandingStill(walker: Walker): boolean {
  return walker.progress === 0;
}

export function walk(
  player: Player,
  direction: Direction | null,
  elapsedMilliseconds: number,
  isFree: IsFree = isWalkableTile,
): Player {
  let { tile, facing, progress, walked, turnRemaining, stepping } = player;
  let distance = (WALK_SPEED * elapsedMilliseconds) / MILLISECONDS_PER_SECOND;
  let inStep = progress > 0;
  for (;;) {
    if (inStep) {
      const advance = Math.min(distance, TILE_SIZE - progress);
      progress += advance;
      walked += advance;
      distance -= advance;
      if (progress < TILE_SIZE - ROUNDING_TOLERANCE) {
        break;
      }
      tile = neighbor(tile, facing);
      progress = 0;
      stepping = true;
      inStep = false;
    } else if (direction === null) {
      stepping = false;
      turnRemaining = 0;
      break;
    } else if (!stepping && direction !== facing) {
      facing = direction;
      turnRemaining = TURN_MILLISECONDS;
      break;
    } else if (turnRemaining > 0) {
      turnRemaining = Math.max(0, turnRemaining - elapsedMilliseconds);
      break;
    } else {
      facing = direction;
      if (distance <= 0) {
        break;
      }
      if (!isFree(neighbor(tile, facing))) {
        stepping = false;
        break;
      }
      inStep = true;
    }
  }
  return { tile, facing, progress, walked, turnRemaining, stepping };
}
