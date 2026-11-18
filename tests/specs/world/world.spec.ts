import {
  isCableGrass,
  isSameTile,
  isWalkable,
  PLAYER_START,
  PROPS,
  SYSADMIN_TILE,
  TERMINAL_TILES,
  TILE_SIZE,
  tileAt,
  WORLD_COLUMNS,
  WORLD_ROWS,
  type TilePosition,
} from "#/src/world.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const SCREEN_COLUMNS = 20;
const SCREEN_ROWS = 18;
const SCREENS_PER_SIDE = 2;
const TILE_PIXELS = 8;
const GRASS_TILE = { column: 5, row: 5 };
const MAT_TILE = { column: 21, row: 18 };
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

function footprintOf(prop: (typeof PROPS)[number]): TilePosition[] {
  const tiles: TilePosition[] = [];
  for (let row = 0; row < prop.rows; row += 1) {
    for (let column = 0; column < prop.columns; column += 1) {
      tiles.push({
        column: prop.tile.column + column,
        row: prop.tile.row + row,
      });
    }
  }
  return tiles;
}

function keyOf(tile: TilePosition): string {
  return `${String(tile.column)},${String(tile.row)}`;
}

function neighborsOf(tile: TilePosition): TilePosition[] {
  return [
    { column: tile.column + 1, row: tile.row },
    { column: tile.column - 1, row: tile.row },
    { column: tile.column, row: tile.row + 1 },
    { column: tile.column, row: tile.row - 1 },
  ];
}

function reachableFromStart(): Set<string> {
  const occupied = [SYSADMIN_TILE, ...TERMINAL_TILES];
  const reachable = new Set([keyOf(PLAYER_START)]);
  const queue = [PLAYER_START];
  for (let tile = queue.shift(); tile !== undefined; tile = queue.shift()) {
    for (const next of neighborsOf(tile)) {
      if (
        !reachable.has(keyOf(next)) &&
        isWalkable(tileAt(next.column, next.row)) &&
        !occupied.some((target) => isSameTile(target, next))
      ) {
        reachable.add(keyOf(next));
        queue.push(next);
      }
    }
  }
  return reachable;
}

describe("world", () => {
  it("spans two by two screens", () => {
    assert.equal(WORLD_COLUMNS, SCREEN_COLUMNS * SCREENS_PER_SIDE);
    assert.equal(WORLD_ROWS, SCREEN_ROWS * SCREENS_PER_SIDE);
    assert.equal(TILE_SIZE, TILE_PIXELS);
  });

  it("shows the aftermath of the disaster", () => {
    assert.deepEqual([...allKinds()].sort(), [
      "barrel",
      "cable-grass",
      "cracked-ground",
      "crater",
      "dead-tree",
      "debris",
      "floor-mat",
      "ground",
      "obstacle",
      "toxic-pool",
      "wreck",
    ]);
  });

  it("covers exactly the wreck tiles with props", () => {
    const covered = PROPS.flatMap((prop) => footprintOf(prop));
    const wrecks: TilePosition[] = [];
    for (let row = 0; row < WORLD_ROWS; row += 1) {
      for (let column = 0; column < WORLD_COLUMNS; column += 1) {
        if (tileAt(column, row) === "wreck") {
          wrecks.push({ column, row });
        }
      }
    }

    assert.equal(covered.length, wrecks.length);
    assert.ok(
      wrecks.every((wreck) => covered.some((tile) => isSameTile(tile, wreck))),
    );
  });

  it("lets the player reach the sysadmin and every terminal", () => {
    const reachable = reachableFromStart();

    assert.ok(
      [SYSADMIN_TILE, ...TERMINAL_TILES].every((target) =>
        neighborsOf(target).some((tile) => reachable.has(keyOf(tile))),
      ),
    );
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
