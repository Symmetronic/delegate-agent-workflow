import { createPlayer, walk, WALK_SPEED } from "#/src/movement.ts";
import { createWalkInput, DRAG_THRESHOLD } from "#/src/walk-input.ts";
import { PLAYER_START, TILE_SIZE } from "#/src/world.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const SECOND = 1000;
const HALF_SECOND = 500;
const SECONDS_TO_CROSS_WORLD = 20;
const TWICE = 2;
const OPEN_GROUND = { column: 10, row: 12 };
const NEXT_TO_TOP_WALL = { column: 10, row: 1 };

describe("movement", () => {
  it("starts on the player start tile facing down", () => {
    assert.deepEqual(createPlayer(PLAYER_START), {
      x: PLAYER_START.column * TILE_SIZE,
      y: PLAYER_START.row * TILE_SIZE,
      facing: "down",
      walked: 0,
    });
  });

  it("stands still without a direction", () => {
    const player = createPlayer(OPEN_GROUND);
    assert.deepEqual(walk(player, null, SECOND), player);
  });

  it("walks at the walk speed and faces the direction of travel", () => {
    const start = createPlayer(OPEN_GROUND);
    const player = walk(start, "right", SECOND);
    assert.equal(player.x, start.x + WALK_SPEED);
    assert.equal(player.y, start.y);
    assert.equal(player.facing, "right");
    assert.equal(player.walked, WALK_SPEED);
  });

  it("is blocked by obstacles", () => {
    const start = createPlayer(NEXT_TO_TOP_WALL);
    const player = walk(start, "up", SECOND);
    assert.ok(player.y < start.y + 1);
    assert.ok(player.y >= TILE_SIZE - 1);
    assert.equal(player.facing, "up");
  });

  it("is blocked by world edges", () => {
    let player = createPlayer(OPEN_GROUND);
    for (let second = 0; second < SECONDS_TO_CROSS_WORLD; second += 1) {
      player = walk(player, "left", SECOND);
    }
    assert.ok(player.x >= 0);
    assert.equal(walk(player, "left", SECOND).x, player.x);
  });

  it("gives the same result for touch and keyboard input", () => {
    const touch = createWalkInput();
    touch.touchStart({ x: 0, y: 0 });
    touch.touchMove({ x: 0, y: DRAG_THRESHOLD * TWICE });
    const keyboard = createWalkInput();
    keyboard.keyDown("ArrowDown");
    const start = createPlayer(OPEN_GROUND);
    assert.deepEqual(
      walk(start, touch.direction(), HALF_SECOND),
      walk(start, keyboard.direction(), HALF_SECOND),
    );
  });
});
