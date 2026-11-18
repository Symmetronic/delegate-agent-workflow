import { computeCameraOrigin } from "#/src/camera.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const VIEW = { width: 160, height: 144 };
const WORLD = { width: 320, height: 288 };

describe("camera", () => {
  it("centers on the target in the middle of the world", () => {
    assert.deepEqual(computeCameraOrigin({ x: 160, y: 144 }, VIEW, WORLD), {
      x: 80,
      y: 72,
    });
  });

  it("clamps at the top left world edge", () => {
    assert.deepEqual(computeCameraOrigin({ x: 4, y: 4 }, VIEW, WORLD), {
      x: 0,
      y: 0,
    });
  });

  it("clamps at the bottom right world edge", () => {
    assert.deepEqual(computeCameraOrigin({ x: 316, y: 284 }, VIEW, WORLD), {
      x: 160,
      y: 144,
    });
  });
});
