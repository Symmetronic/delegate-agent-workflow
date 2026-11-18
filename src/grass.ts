import type { TilePosition } from "#/src/world.ts";

export type GrassFrame = "still" | "leaning" | "rustling" | "settling";

export const RUSTLE_MILLISECONDS = 360;
export const SWAY_MILLISECONDS = 900;

const WAVE_TILES = 8;
const SWAY_FRAMES = 2;
const HALF = 2;

export interface Grass {
  rustle(tile: TilePosition, now: number): void;
  frame(tile: TilePosition, now: number): GrassFrame;
}

function keyOf(tile: TilePosition): string {
  return `${String(tile.column)},${String(tile.row)}`;
}

function swayFrame(tile: TilePosition, now: number): GrassFrame {
  const phase = Math.floor(
    now / SWAY_MILLISECONDS - (tile.column + tile.row) / WAVE_TILES,
  );
  return ((phase % SWAY_FRAMES) + SWAY_FRAMES) % SWAY_FRAMES === 0
    ? "still"
    : "leaning";
}

export function createGrass(): Grass {
  const rustles = new Map<string, number>();

  return {
    rustle(tile, now) {
      rustles.set(keyOf(tile), now);
    },
    frame(tile, now) {
      const key = keyOf(tile);
      const started = rustles.get(key);
      if (started !== undefined) {
        const elapsed = now - started;
        if (elapsed < RUSTLE_MILLISECONDS / HALF) {
          return "rustling";
        }
        if (elapsed < RUSTLE_MILLISECONDS) {
          return "settling";
        }
        rustles.delete(key);
      }
      return swayFrame(tile, now);
    },
  };
}
