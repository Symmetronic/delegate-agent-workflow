import type { Point } from "#/src/camera.ts";

export type Direction = "up" | "down" | "left" | "right";

export type TouchOutcome = "tap" | "drag";

export const DRAG_THRESHOLD = 12;

const DIRECTION_BY_KEY: Readonly<Record<string, Direction>> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

interface Touch {
  readonly origin: Point;
  readonly current: Point;
  readonly dragged: boolean;
}

export interface WalkInput {
  touchStart(point: Point): void;
  touchMove(point: Point): void;
  touchEnd(): TouchOutcome;
  keyDown(key: string): void;
  keyUp(key: string): void;
  direction(): Direction | null;
}

function directionOfKey(key: string): Direction | undefined {
  return DIRECTION_BY_KEY[key.length === 1 ? key.toLowerCase() : key];
}

function snapToDirection(origin: Point, current: Point): Direction {
  const deltaX = current.x - origin.x;
  const deltaY = current.y - origin.y;
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? "right" : "left";
  }
  return deltaY > 0 ? "down" : "up";
}

function isPastThreshold(origin: Point, current: Point): boolean {
  return (
    Math.hypot(current.x - origin.x, current.y - origin.y) >= DRAG_THRESHOLD
  );
}

export function createWalkInput(): WalkInput {
  let touch: Touch | null = null;
  let heldDirections: readonly Direction[] = [];

  return {
    touchStart(point) {
      touch = { origin: point, current: point, dragged: false };
    },
    touchMove(point) {
      if (touch === null) {
        return;
      }
      touch = {
        origin: touch.origin,
        current: point,
        dragged: touch.dragged || isPastThreshold(touch.origin, point),
      };
    },
    touchEnd() {
      const outcome = touch?.dragged === true ? "drag" : "tap";
      touch = null;
      return outcome;
    },
    keyDown(key) {
      const direction = directionOfKey(key);
      if (direction !== undefined && !heldDirections.includes(direction)) {
        heldDirections = [...heldDirections, direction];
      }
    },
    keyUp(key) {
      const direction = directionOfKey(key);
      heldDirections = heldDirections.filter((held) => held !== direction);
    },
    direction() {
      if (touch !== null) {
        return isPastThreshold(touch.origin, touch.current)
          ? snapToDirection(touch.origin, touch.current)
          : null;
      }
      return heldDirections.at(-1) ?? null;
    },
  };
}
