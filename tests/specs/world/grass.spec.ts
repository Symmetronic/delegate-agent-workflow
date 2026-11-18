import {
  createGrass,
  RUSTLE_MILLISECONDS,
  SWAY_MILLISECONDS,
} from "#/src/grass.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const TILE = { column: 4, row: 7 };
const OTHER_TILE = { column: 5, row: 7 };
const NOW = 10_000;
const HALF = 2;
const SWAY_CYCLES = 4;

describe("grass", () => {
  it("rustles where something walks into it and then settles", () => {
    const grass = createGrass();
    grass.rustle(TILE, NOW);

    assert.equal(grass.frame(TILE, NOW), "rustling");
    assert.equal(
      grass.frame(TILE, NOW + RUSTLE_MILLISECONDS / HALF),
      "settling",
    );
    assert.notEqual(grass.frame(OTHER_TILE, NOW), "rustling");
  });

  it("goes back to swaying once the rustle is over", () => {
    const grass = createGrass();
    grass.rustle(TILE, NOW);
    const frame = grass.frame(TILE, NOW + RUSTLE_MILLISECONDS);

    assert.ok(frame === "still" || frame === "leaning");
  });

  it("sways between still and leaning in the wind", () => {
    const grass = createGrass();
    const frames = new Set(
      Array.from({ length: SWAY_CYCLES }, (_, cycle) =>
        grass.frame(TILE, cycle * SWAY_MILLISECONDS),
      ),
    );

    assert.deepEqual([...frames].sort(), ["leaning", "still"]);
  });
});
