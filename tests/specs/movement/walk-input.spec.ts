import { createWalkInput, DRAG_THRESHOLD } from "#/src/walk-input.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const ORIGIN = { x: 100, y: 100 };
const TWICE = 2;
const FAR = DRAG_THRESHOLD * (TWICE + 1);

describe("walk input", () => {
  it("does not walk without input", () => {
    assert.equal(createWalkInput().direction(), null);
  });

  it("does not walk before the drag threshold is passed", () => {
    const input = createWalkInput();
    input.touchStart(ORIGIN);
    input.touchMove({ x: ORIGIN.x + DRAG_THRESHOLD - 1, y: ORIGIN.y });
    assert.equal(input.direction(), null);
  });

  it("snaps a drag to the dominant of four directions", () => {
    const input = createWalkInput();
    input.touchStart(ORIGIN);
    input.touchMove({ x: ORIGIN.x + FAR, y: ORIGIN.y + FAR / TWICE });
    assert.equal(input.direction(), "right");
    input.touchMove({ x: ORIGIN.x - FAR / TWICE, y: ORIGIN.y + FAR });
    assert.equal(input.direction(), "down");
    input.touchMove({ x: ORIGIN.x - FAR, y: ORIGIN.y });
    assert.equal(input.direction(), "left");
    input.touchMove({ x: ORIGIN.x, y: ORIGIN.y - FAR });
    assert.equal(input.direction(), "up");
  });

  it("stops on release", () => {
    const input = createWalkInput();
    input.touchStart(ORIGIN);
    input.touchMove({ x: ORIGIN.x + FAR, y: ORIGIN.y });
    input.touchEnd();
    assert.equal(input.direction(), null);
  });

  it("reports a touch that never passed the threshold as a tap", () => {
    const input = createWalkInput();
    input.touchStart(ORIGIN);
    input.touchMove({ x: ORIGIN.x + 1, y: ORIGIN.y });
    assert.equal(input.touchEnd(), "tap");
  });

  it("reports a touch that passed the threshold as a drag", () => {
    const input = createWalkInput();
    input.touchStart(ORIGIN);
    input.touchMove({ x: ORIGIN.x + FAR, y: ORIGIN.y });
    input.touchMove(ORIGIN);
    assert.equal(input.touchEnd(), "drag");
  });

  it("walks with arrow keys and WASD", () => {
    const input = createWalkInput();
    input.keyDown("ArrowLeft");
    assert.equal(input.direction(), "left");
    input.keyUp("ArrowLeft");
    input.keyDown("w");
    assert.equal(input.direction(), "up");
  });

  it("follows the most recently pressed key and falls back on release", () => {
    const input = createWalkInput();
    input.keyDown("a");
    input.keyDown("s");
    assert.equal(input.direction(), "down");
    input.keyUp("s");
    assert.equal(input.direction(), "left");
    input.keyUp("a");
    assert.equal(input.direction(), null);
  });

  it("stops when a letter key is released with Shift or Caps Lock", () => {
    const input = createWalkInput();
    input.keyDown("d");
    input.keyUp("D");
    assert.equal(input.direction(), null);
    input.keyDown("W");
    assert.equal(input.direction(), "up");
    input.keyUp("w");
    assert.equal(input.direction(), null);
  });
});
