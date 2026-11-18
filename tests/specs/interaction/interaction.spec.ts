import { pickInteraction, TAP_RADIUS } from "#/src/interaction.ts";
import { createPlayer, walk, type Player } from "#/src/movement.ts";
import { TILE_SIZE } from "#/src/world.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const FRAME = 16;
const HALF = 2;
const STANDING = { column: 10, row: 12 };
const ABOVE = { column: 10, row: 11 };
const RIGHT = { column: 11, row: 12 };
const DIAGONAL = { column: 11, row: 11 };
const TWO_AWAY = { column: 12, row: 12 };

function standing(facing: Player["facing"] = "down"): Player {
  return { ...createPlayer(STANDING), facing };
}

function centerOf(tile: { column: number; row: number }): {
  x: number;
  y: number;
} {
  return {
    x: tile.column * TILE_SIZE + TILE_SIZE / HALF,
    y: tile.row * TILE_SIZE + TILE_SIZE / HALF,
  };
}

describe("interaction", () => {
  it("reaches a target on a tile next to the player and turns towards it", () => {
    assert.deepEqual(pickInteraction(standing(), [[ABOVE]]), {
      target: 0,
      facing: "up",
    });
  });

  it("does not reach diagonal or distant targets", () => {
    assert.equal(pickInteraction(standing(), [[DIAGONAL], [TWO_AWAY]]), null);
  });

  it("prefers the target the player faces", () => {
    assert.deepEqual(pickInteraction(standing("right"), [[ABOVE], [RIGHT]]), {
      target: 1,
      facing: "right",
    });
  });

  it("reaches a target that spans several tiles by any of them", () => {
    assert.deepEqual(
      pickInteraction(standing(), [[TWO_AWAY, RIGHT, DIAGONAL]]),
      { target: 0, facing: "right" },
    );
  });

  it("reaches a tapped target only when it is next to the player", () => {
    const targets = [[ABOVE], [TWO_AWAY]];

    assert.deepEqual(pickInteraction(standing(), targets, centerOf(ABOVE)), {
      target: 0,
      facing: "up",
    });
    assert.equal(
      pickInteraction(standing(), targets, centerOf(TWO_AWAY)),
      null,
    );
  });

  it("ignores taps away from every target", () => {
    const tap = centerOf(ABOVE);
    const farTap = { x: tap.x, y: tap.y - TAP_RADIUS * HALF };

    assert.equal(pickInteraction(standing(), [[ABOVE]], farTap), null);
  });

  it("does not interact in the middle of a step", () => {
    const stepping = walk(standing("left"), "left", FRAME, () => true);

    assert.equal(pickInteraction(stepping, [[ABOVE]]), null);
  });
});
