import {
  isCableGrass,
  isWalkable,
  PLAYER_START,
  SYSADMIN_TILE,
  TILE_SIZE,
  tileAt,
  WORLD_COLUMNS,
  WORLD_ROWS,
} from "#/src/world.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const SCREEN_COLUMNS = 20;
const SCREEN_ROWS = 18;
const SCREENS_PER_SIDE = 2;
const TILE_PIXELS = 8;
const GRASS_TILE = { column: 5, row: 5 };
const MAT_TILE = { column: 22, row: 17 };
const OUTSIDE = 5;
const NEAR_START_TILES = 4;

function allKinds(): Set<string> {
  const kinds = new Set<string>();
  for (let row = 0; row < WORLD_ROWS; row += 1) {
    for (let column = 0; column < WORLD_COLUMNS; column += 1) {
      kinds.add(tileAt(column, row));
    }
  }
  return kinds;
}

describe("world", () => {
  it("spans two by two screens", () => {
    assert.equal(WORLD_COLUMNS, SCREEN_COLUMNS * SCREENS_PER_SIDE);
    assert.equal(WORLD_ROWS, SCREEN_ROWS * SCREENS_PER_SIDE);
    assert.equal(TILE_SIZE, TILE_PIXELS);
  });

  it("contains ground, cable grass, obstacles and the floor mat", () => {
    assert.deepEqual([...allKinds()].sort(), [
      "cable-grass",
      "floor-mat",
      "ground",
      "obstacle",
    ]);
  });

  it("lets the player start on walkable ground that is not cable grass", () => {
    const kind = tileAt(PLAYER_START.column, PLAYER_START.row);

    assert.ok(isWalkable(kind));
    assert.ok(!isCableGrass(kind));
  });

  it("treats obstacles and tiles beyond the world as blocked", () => {
    assert.ok(!isWalkable(tileAt(0, 0)));
    assert.ok(!isWalkable(tileAt(-1, OUTSIDE)));
    assert.ok(!isWalkable(tileAt(WORLD_COLUMNS, OUTSIDE)));
  });

  it("marks cable grass as its own zone and keeps it walkable", () => {
    assert.ok(isCableGrass(tileAt(GRASS_TILE.column, GRASS_TILE.row)));
    assert.ok(isWalkable(tileAt(GRASS_TILE.column, GRASS_TILE.row)));
    assert.ok(!isCableGrass(tileAt(MAT_TILE.column, MAT_TILE.row)));
  });

  it("places the sysadmin on his floor mat next to the start", () => {
    assert.equal(tileAt(SYSADMIN_TILE.column, SYSADMIN_TILE.row), "floor-mat");
    assert.ok(
      Math.abs(SYSADMIN_TILE.column - PLAYER_START.column) <= NEAR_START_TILES,
    );
    assert.equal(SYSADMIN_TILE.row, PLAYER_START.row);
  });
});
