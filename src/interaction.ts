import type { Point } from "#/src/camera.ts";
import { isStandingStill, neighbor, type Player } from "#/src/movement.ts";
import type { Direction } from "#/src/walk-input.ts";
import { isSameTile, TILE_SIZE, type TilePosition } from "#/src/world.ts";

export type Footprint = readonly TilePosition[];

export const TAP_RADIUS = 10;

const HALF = 2;
const DIRECTIONS: readonly Direction[] = ["up", "down", "left", "right"];

function directionTowards(
  player: Player,
  footprint: Footprint,
): Direction | null {
  if (
    footprint.some((tile) =>
      isSameTile(tile, neighbor(player.tile, player.facing)),
    )
  ) {
    return player.facing;
  }
  return (
    DIRECTIONS.find((direction) =>
      footprint.some((tile) =>
        isSameTile(tile, neighbor(player.tile, direction)),
      ),
    ) ?? null
  );
}

function isTapOn(tap: Point, footprint: Footprint): boolean {
  return footprint.some(
    (tile) =>
      Math.hypot(
        tap.x - (tile.column * TILE_SIZE + TILE_SIZE / HALF),
        tap.y - (tile.row * TILE_SIZE + TILE_SIZE / HALF),
      ) <= TAP_RADIUS,
  );
}

export interface Interaction {
  readonly target: number;
  readonly facing: Direction;
}

export function pickInteraction(
  player: Player,
  footprints: readonly Footprint[],
  tap?: Point,
): Interaction | null {
  if (!isStandingStill(player)) {
    return null;
  }
  const candidates = footprints
    .map((footprint, target) => ({
      target,
      facing: directionTowards(player, footprint),
      tapped: tap === undefined || isTapOn(tap, footprint),
    }))
    .filter(
      (candidate): candidate is Interaction & { tapped: boolean } =>
        candidate.facing !== null && candidate.tapped,
    );
  const chosen =
    candidates.find((candidate) => candidate.facing === player.facing) ??
    candidates[0];
  return chosen === undefined
    ? null
    : { target: chosen.target, facing: chosen.facing };
}
