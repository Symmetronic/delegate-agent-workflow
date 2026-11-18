import {
  createPlayer,
  isStandingStill,
  occupiedTiles,
  positionOf,
  TURN_MILLISECONDS,
  walk,
  WALK_SPEED,
  type Player,
} from "#/src/movement.ts";
import { createWalkInput, DRAG_THRESHOLD } from "#/src/walk-input.ts";
import { PLAYER_START, TILE_SIZE } from "#/src/world.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const SECOND = 1000;
const FRAME = 16;
const TWICE = 2;
const HALF = 2;
const STEP_MILLISECONDS = (TILE_SIZE * SECOND) / WALK_SPEED;
const OPEN_GROUND = { column: 20, row: 14 };
const NEXT_TO_TOP_WALL = { column: 10, row: 1 };
const SECONDS_TO_CROSS_WORLD = 20;
const ROUNDING_TOLERANCE = 1e-6;

function hold(
  player: Player,
  direction: Parameters<typeof walk>[1],
  milliseconds: number,
): Player {
  let current = player;
  for (let time = 0; time < milliseconds; time += FRAME) {
    current = walk(current, direction, Math.min(FRAME, milliseconds - time));
  }
  return current;
}

function facingRight(): Player {
  return { ...createPlayer(OPEN_GROUND), facing: "right" };
}

describe("movement", () => {
  it("starts on the player start tile facing down", () => {
    const player = createPlayer(PLAYER_START);

    assert.deepEqual(player.tile, PLAYER_START);
    assert.equal(player.facing, "down");
    assert.deepEqual(positionOf(player), {
      x: PLAYER_START.column * TILE_SIZE,
      y: PLAYER_START.row * TILE_SIZE,
    });
  });

  it("stands still without a direction", () => {
    const player = createPlayer(OPEN_GROUND);
    assert.deepEqual(walk(player, null, SECOND), player);
  });

  it("walks one whole tile at the walk speed", () => {
    const player = hold(facingRight(), "right", STEP_MILLISECONDS);

    assert.deepEqual(player.tile, {
      column: OPEN_GROUND.column + 1,
      row: OPEN_GROUND.row,
    });
    assert.ok(isStandingStill(player));
    assert.ok(Math.abs(player.walked - TILE_SIZE) < ROUNDING_TOLERANCE);
  });

  it("finishes a started step after the direction is released", () => {
    const started = walk(facingRight(), "right", FRAME);
    assert.ok(!isStandingStill(started));
    const player = hold(started, null, STEP_MILLISECONDS);

    assert.equal(player.tile.column, OPEN_GROUND.column + 1);
    assert.ok(isStandingStill(player));
  });

  it("only ever stops on whole tiles", () => {
    let player = facingRight();
    for (let frame = 0; frame < SECOND / FRAME; frame += 1) {
      player = walk(player, frame < HALF ? "right" : null, FRAME);
    }
    const position = positionOf(player);

    assert.equal(position.x % TILE_SIZE, 0);
    assert.equal(position.y % TILE_SIZE, 0);
  });

  it("turns on a short press without stepping", () => {
    const player = hold(createPlayer(OPEN_GROUND), "left", FRAME);

    assert.equal(player.facing, "left");
    assert.deepEqual(player.tile, OPEN_GROUND);
    assert.ok(isStandingStill(player));
  });

  it("walks after turning when the direction is held", () => {
    const player = hold(
      createPlayer(OPEN_GROUND),
      "left",
      TURN_MILLISECONDS + STEP_MILLISECONDS * TWICE,
    );

    assert.ok(player.tile.column < OPEN_GROUND.column);
  });

  it("changes direction without a pause while walking", () => {
    const walked = hold(facingRight(), "right", STEP_MILLISECONDS);
    const player = hold(walked, "down", STEP_MILLISECONDS);

    assert.deepEqual(player.tile, {
      column: OPEN_GROUND.column + 1,
      row: OPEN_GROUND.row + 1,
    });
  });

  it("is blocked by obstacles but faces them", () => {
    const start = { ...createPlayer(NEXT_TO_TOP_WALL), facing: "up" as const };
    const player = hold(start, "up", SECOND);

    assert.deepEqual(player.tile, NEXT_TO_TOP_WALL);
    assert.equal(player.facing, "up");
  });

  it("is blocked by occupied tiles", () => {
    const player = hold(facingRight(), "right", SECOND);
    const blocked = walk(facingRight(), "right", SECOND, () => false);

    assert.ok(player.tile.column > OPEN_GROUND.column);
    assert.deepEqual(blocked.tile, OPEN_GROUND);
  });

  it("occupies both tiles while stepping", () => {
    const player = walk(facingRight(), "right", FRAME);

    assert.deepEqual(occupiedTiles(player), [
      OPEN_GROUND,
      { column: OPEN_GROUND.column + 1, row: OPEN_GROUND.row },
    ]);
    assert.deepEqual(occupiedTiles(facingRight()), [OPEN_GROUND]);
  });

  it("is blocked by world edges", () => {
    const player = hold(
      { ...createPlayer(OPEN_GROUND), facing: "left" },
      "left",
      SECONDS_TO_CROSS_WORLD * SECOND,
    );

    assert.ok(player.tile.column >= 0);
    assert.ok(isStandingStill(player));
  });

  it("gives the same result for touch and keyboard input", () => {
    const touch = createWalkInput();
    touch.touchStart({ x: 0, y: 0 });
    touch.touchMove({ x: 0, y: DRAG_THRESHOLD * TWICE });
    const keyboard = createWalkInput();
    keyboard.keyDown("ArrowDown");
    const start = createPlayer(OPEN_GROUND);
    assert.deepEqual(
      hold(start, touch.direction(), SECOND),
      hold(start, keyboard.direction(), SECOND),
    );
  });
});
