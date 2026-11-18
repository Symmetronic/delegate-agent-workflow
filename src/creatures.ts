import { neighbor, type Walker } from "#/src/movement.ts";
import type { Random } from "#/src/random.ts";
import type { Direction } from "#/src/walk-input.ts";
import { TILE_SIZE, type TilePosition } from "#/src/world.ts";

export type CreatureKind = "crow" | "rat" | "survivor";

export interface Creature extends Walker {
  readonly kind: CreatureKind;
  readonly home: TilePosition;
  readonly pause: number;
}

export const CREATURE_SPEED = 20;
export const WANDER_RADIUS = 3;
export const MIN_PAUSE = 600;
export const MAX_PAUSE = 2400;

const MILLISECONDS_PER_SECOND = 1000;
const DIRECTIONS: readonly Direction[] = ["up", "down", "left", "right"];

export const CREATURE_HOMES: readonly {
  readonly kind: CreatureKind;
  readonly home: TilePosition;
}[] = [
  { kind: "crow", home: { column: 22, row: 29 } },
  { kind: "rat", home: { column: 9, row: 39 } },
  { kind: "survivor", home: { column: 25, row: 45 } },
];

function randomPause(random: Random): number {
  return MIN_PAUSE + random() * (MAX_PAUSE - MIN_PAUSE);
}

function isNearHome(tile: TilePosition, home: TilePosition): boolean {
  return (
    Math.abs(tile.column - home.column) <= WANDER_RADIUS &&
    Math.abs(tile.row - home.row) <= WANDER_RADIUS
  );
}

export function createCreature(
  kind: CreatureKind,
  home: TilePosition,
  random: Random,
): Creature {
  return {
    kind,
    home,
    tile: home,
    facing: "down",
    progress: 0,
    pause: randomPause(random),
  };
}

export function wander(
  creature: Creature,
  elapsedMilliseconds: number,
  random: Random,
  isFree: (tile: TilePosition) => boolean,
): Creature {
  const distance =
    (CREATURE_SPEED * elapsedMilliseconds) / MILLISECONDS_PER_SECOND;
  if (creature.progress > 0) {
    const progress = creature.progress + distance;
    return progress < TILE_SIZE
      ? { ...creature, progress }
      : {
          ...creature,
          tile: neighbor(creature.tile, creature.facing),
          progress: 0,
          pause: randomPause(random),
        };
  }
  const pause = creature.pause - elapsedMilliseconds;
  if (pause > 0) {
    return { ...creature, pause };
  }
  const facing =
    DIRECTIONS[Math.floor(random() * DIRECTIONS.length)] ?? creature.facing;
  const target = neighbor(creature.tile, facing);
  if (!isNearHome(target, creature.home) || !isFree(target)) {
    return { ...creature, facing, pause: randomPause(random) };
  }
  return {
    ...creature,
    facing,
    progress: Math.max(distance, Number.EPSILON),
    pause: 0,
  };
}
