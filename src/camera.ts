import type { Size } from "#/src/screen-layout.ts";

export interface Point {
  readonly x: number;
  readonly y: number;
}

const HALF = 2;

function clampAxis(center: number, view: number, world: number): number {
  const centered = Math.round(center - view / HALF);
  return Math.min(Math.max(centered, 0), Math.max(world - view, 0));
}

export function computeCameraOrigin(
  center: Point,
  viewSize: Size,
  worldSize: Size,
): Point {
  return {
    x: clampAxis(center.x, viewSize.width, worldSize.width),
    y: clampAxis(center.y, viewSize.height, worldSize.height),
  };
}
